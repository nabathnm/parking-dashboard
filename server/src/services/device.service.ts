import { DeviceStatusPayload, DeviceStatus } from '../types/index.js';
import { databaseService } from './database.service.js';
import { realtimeService } from './realtime.service.js';

interface DeviceRecord {
  deviceId: string;
  areaId: string;
  status: DeviceStatus;
  lastHeartbeatTime: number;
  rssi?: number;
  uptimeSeconds?: number;
}

class DeviceService {
  private devices: Map<string, DeviceRecord> = new Map();
  private watchdogInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_TIMEOUT_MS = 45000; // 45 detik tanpa heartbeat -> OFFLINE

  constructor() {
    this.startWatchdog();
  }

  public async handleDeviceHeartbeat(areaId: string, payload: DeviceStatusPayload) {
    const now = Date.now();
    const timestampStr = payload.timestamp || new Date(now).toISOString();

    const record: DeviceRecord = {
      deviceId: payload.device_id,
      areaId,
      status: payload.status,
      lastHeartbeatTime: now,
      rssi: payload.rssi,
      uptimeSeconds: payload.uptime_seconds,
    };
    this.devices.set(payload.device_id, record);

    console.log(`[DeviceService] Heartbeat received from ${payload.device_id} (${areaId}): ${payload.status}`);

    // Update database
    await databaseService.updateDeviceStatus(payload.device_id, areaId, payload.status, {
      rssi: payload.rssi,
      uptime_seconds: payload.uptime_seconds,
      ip_address: payload.ip_address,
      mac_address: payload.mac_address,
    });

    // Jika status adalah OFFLINE (misal dari LWT MQTT), set slot jadi UNKNOWN
    if (payload.status === 'OFFLINE') {
      await databaseService.markSlotsAsUnknown(areaId);
    }

    // Broadcast ke frontend via Socket.IO
    realtimeService.broadcastDeviceStatusUpdated({
      deviceId: payload.device_id,
      areaId,
      status: payload.status,
      rssi: payload.rssi,
      uptimeSeconds: payload.uptime_seconds,
      lastHeartbeat: timestampStr,
    });
  }

  private startWatchdog() {
    this.watchdogInterval = setInterval(async () => {
      const now = Date.now();
      for (const [deviceId, dev] of this.devices.entries()) {
        if (dev.status === 'ONLINE' && now - dev.lastHeartbeatTime > this.HEARTBEAT_TIMEOUT_MS) {
          console.warn(`[DeviceService] Device ${deviceId} (${dev.areaId}) timed out! Marking as OFFLINE.`);
          dev.status = 'OFFLINE';

          // Update database: device status OFFLINE & slots UNKNOWN
          await databaseService.updateDeviceStatus(deviceId, dev.areaId, 'OFFLINE');
          await databaseService.markSlotsAsUnknown(dev.areaId);

          // Broadcast ke frontend
          realtimeService.broadcastDeviceStatusUpdated({
            deviceId,
            areaId: dev.areaId,
            status: 'OFFLINE',
            lastHeartbeat: new Date(now).toISOString(),
          });
        }
      }
    }, 15000); // Check every 15 seconds
  }

  public cleanup() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
    }
  }
}

export const deviceService = new DeviceService();
