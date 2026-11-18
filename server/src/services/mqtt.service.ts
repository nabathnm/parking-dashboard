import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { env, isMqttConfigured } from '../config/env.js';
import {
  SlotPayloadSchema,
  DeviceStatusPayloadSchema,
  GateStatusPayloadSchema,
  GateCommandPayload,
} from '../types/index.js';
import { parkingService } from './parking.service.js';
import { deviceService } from './device.service.js';
import { realtimeService } from './realtime.service.js';

class MqttService {
  private client: MqttClient | null = null;
  private connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'CONFIG_REQUIRED' = 'DISCONNECTED';

  constructor() {
    // Daftarkan MQTT publisher ke parkingService agar simulasi terkirim ke EMQX
    parkingService.registerMqttPublisher((areaId, slotId, payload) => {
      return this.publishSlotStatus(areaId, slotId, payload);
    });

    this.connect();
  }

  public connect() {
    if (!isMqttConfigured) {
      console.warn('[MqttService] MQTT credentials are not configured in .env. Status set to CONFIG_REQUIRED.');
      this.connectionStatus = 'CONFIG_REQUIRED';
      realtimeService.updateSystemStatus({ mqtt: 'CONFIG_REQUIRED' });
      return;
    }

    this.connectionStatus = 'CONNECTING';
    realtimeService.updateSystemStatus({ mqtt: 'CONNECTING' });

    // Format protocol: jika port 8883 gunakan mqtts (TLS)
    const isTls = env.MQTT_PORT === 8883;
    const protocol = isTls ? 'mqtts' : 'mqtt';
    const brokerUrl = `${protocol}://${env.MQTT_HOST}:${env.MQTT_PORT}`;

    console.log(`[MqttService] Connecting to EMQX Broker: ${brokerUrl} (TLS: ${isTls})`);

    const options: IClientOptions = {
      clientId: `${env.MQTT_CLIENT_ID}-${Math.random().toString(16).substring(2, 8)}`,
      username: env.MQTT_USERNAME,
      password: env.MQTT_PASSWORD,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
      keepalive: 30,
      // Last Will and Testament (LWT)
      will: {
        topic: 'campus/parking/filkom/node/status',
        payload: Buffer.from(
          JSON.stringify({
            device_id: 'ESP32-FILKOM-01',
            status: 'OFFLINE',
            reason: 'LWT_UNEXPECTED_DISCONNECT',
            timestamp: new Date().toISOString(),
          })
        ),
        qos: 1,
        retain: true,
      },
      rejectUnauthorized: false, // Untuk fleksibilitas sertifikat TLS self-signed / cloud
    };

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        console.log('[MqttService] Successfully connected to EMQX Cloud!');
        this.connectionStatus = 'CONNECTED';
        realtimeService.updateSystemStatus({ mqtt: 'CONNECTED' });
        this.subscribeTopics();
      });

      this.client.on('reconnect', () => {
        console.log('[MqttService] Reconnecting to EMQX Cloud...');
        this.connectionStatus = 'CONNECTING';
        realtimeService.updateSystemStatus({ mqtt: 'CONNECTING' });
      });

      this.client.on('close', () => {
        if (this.connectionStatus !== 'DISCONNECTED') {
          console.warn('[MqttService] Connection to EMQX closed.');
          this.connectionStatus = 'DISCONNECTED';
          realtimeService.updateSystemStatus({ mqtt: 'DISCONNECTED' });
        }
      });

      this.client.on('offline', () => {
        console.warn('[MqttService] Client went offline.');
        this.connectionStatus = 'DISCONNECTED';
        realtimeService.updateSystemStatus({ mqtt: 'DISCONNECTED' });
      });

      this.client.on('error', (err) => {
        console.error('[MqttService] MQTT Error:', err.message);
        this.connectionStatus = 'DISCONNECTED';
        realtimeService.updateSystemStatus({ mqtt: 'DISCONNECTED' });
      });

      this.client.on('message', (topic, message) => {
        this.handleIncomingMessage(topic, message.toString());
      });
    } catch (err: any) {
      console.error('[MqttService] Failed to create MQTT connection:', err.message);
      this.connectionStatus = 'DISCONNECTED';
      realtimeService.updateSystemStatus({ mqtt: 'DISCONNECTED' });
    }
  }

  private subscribeTopics() {
    if (!this.client) return;

    // Topics sesuai spesifikasi prompt:
    // campus/parking/{areaId}/node/status
    // campus/parking/{areaId}/slots/{slotId}
    // campus/parking/{areaId}/gate/{gateId}/status
    const topics = [
      'campus/parking/+/node/status',
      'campus/parking/+/slots/+',
      'campus/parking/+/gate/+/status',
    ];

    topics.forEach((topic) => {
      this.client?.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[MqttService] Failed to subscribe to ${topic}:`, err.message);
        } else {
          console.log(`[MqttService] Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  private async handleIncomingMessage(topic: string, messageStr: string) {
    try {
      const parts = topic.split('/');
      // Format topic: campus/parking/{areaId}/...
      if (parts[0] !== 'campus' || parts[1] !== 'parking') {
        console.warn(`[MqttService] Unknown topic prefix: ${topic}`);
        return;
      }

      const areaId = parts[2];
      const category = parts[3]; // 'node', 'slots', atau 'gate'

      let rawPayload: any;
      try {
        rawPayload = JSON.parse(messageStr);
      } catch (e) {
        console.warn(`[MqttService] Invalid JSON in topic ${topic}:`, messageStr);
        return;
      }

      // 1. Topic: campus/parking/{areaId}/node/status
      if (category === 'node' && parts[4] === 'status') {
        const parsed = DeviceStatusPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          console.warn(`[MqttService] Invalid node status payload on ${topic}:`, parsed.error.issues);
          return;
        }
        await deviceService.handleDeviceHeartbeat(areaId, parsed.data);
      }

      // 2. Topic: campus/parking/{areaId}/slots/{slotId}
      else if (category === 'slots') {
        const parsed = SlotPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          console.warn(`[MqttService] Invalid slot payload on ${topic}:`, parsed.error.issues);
          return;
        }
        await parkingService.handleSlotUpdate(areaId, parsed.data);
      }

      // 3. Topic: campus/parking/{areaId}/gate/{gateId}/status
      else if (category === 'gate' && parts[5] === 'status') {
        const parsed = GateStatusPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          console.warn(`[MqttService] Invalid gate status payload on ${topic}:`, parsed.error.issues);
          return;
        }
        await parkingService.handleGateStatusUpdate(areaId, parsed.data);
      }
    } catch (err: any) {
      console.error(`[MqttService] Error handling message on ${topic}:`, err.message);
    }
  }

  // Publikasi perintah gerbang ke ESP32: campus/parking/{areaId}/gate/{gateId}/command
  public publishGateCommand(areaId: string, gateId: string, command: GateCommandPayload): boolean {
    if (!this.client || this.connectionStatus !== 'CONNECTED') {
      console.warn('[MqttService] Cannot publish gate command: MQTT not connected.');
      return false;
    }

    const shortArea = areaId.replace('-main', '');
    const topic = `campus/parking/${shortArea}/gate/${gateId}/command`;
    const payloadStr = JSON.stringify({
      ...command,
      timestamp: command.timestamp || new Date().toISOString(),
    });

    console.log(`[MqttService] Publishing command to ${topic}:`, payloadStr);

    this.client.publish(topic, payloadStr, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MqttService] Failed to publish gate command:`, err.message);
      }
    });

    return true;
  }

  // Publikasi status slot ke EMQX Cloud (dipakai oleh simulator area Teknik, FEB, FISIP)
  public publishSlotStatus(
    areaId: string,
    slotId: string,
    payload: { status: string; distance_cm?: number; timestamp?: string }
  ): boolean {
    if (!this.client || this.connectionStatus !== 'CONNECTED') {
      return false;
    }

    const shortArea = areaId.replace('-main', '');
    const topic = `campus/parking/${shortArea}/slots/${slotId}`;
    const payloadStr = JSON.stringify({
      slot_id: slotId,
      status: payload.status,
      distance_cm: payload.distance_cm,
      timestamp: payload.timestamp || new Date().toISOString(),
    });

    this.client.publish(topic, payloadStr, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MqttService] Failed to publish slot status to ${topic}:`, err.message);
      } else {
        console.log(`[MqttService] [EMQX Cloud] Published simulation slot -> ${topic}: ${payload.status}`);
      }
    });

    return true;
  }

  // Publikasi heartbeat node ke EMQX Cloud
  public publishNodeStatus(
    areaId: string,
    payload: { device_id: string; status: 'ONLINE' | 'OFFLINE'; rssi?: number; uptime_seconds?: number }
  ): boolean {
    if (!this.client || this.connectionStatus !== 'CONNECTED') {
      return false;
    }

    const shortArea = areaId.replace('-main', '');
    const topic = `campus/parking/${shortArea}/node/status`;
    const payloadStr = JSON.stringify({
      device_id: payload.device_id,
      status: payload.status,
      rssi: payload.rssi ?? -60,
      uptime_seconds: payload.uptime_seconds ?? Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });

    this.client.publish(topic, payloadStr, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MqttService] Failed to publish node status to ${topic}:`, err.message);
      }
    });

    return true;
  }

  public getStatus(): 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'CONFIG_REQUIRED' {
    return this.connectionStatus;
  }
}

export const mqttService = new MqttService();
