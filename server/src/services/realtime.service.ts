import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SystemConnectionStatus } from '../types/index.js';

class RealtimeService {
  private io: SocketIOServer | null = null;
  private currentStatus: SystemConnectionStatus = {
    mqtt: 'DISCONNECTED',
    database: 'CONNECTING',
    device: 'OFFLINE',
    backend: 'CONNECTED',
    lastDataReceived: null,
  };

  public init(httpServer: HttpServer, corsOrigin: string = '*') {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin === '*' ? true : [corsOrigin, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[RealtimeService] Frontend client connected: ${socket.id}`);
      
      // Kirim status koneksi saat ini ke client baru
      socket.emit('system_status', this.currentStatus);

      socket.on('disconnect', () => {
        console.log(`[RealtimeService] Frontend client disconnected: ${socket.id}`);
      });
    });

    console.log('[RealtimeService] Socket.IO server initialized.');
  }

  public updateSystemStatus(partial: Partial<SystemConnectionStatus>) {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.broadcast('system_status', this.currentStatus);
  }

  public getSystemStatus(): SystemConnectionStatus {
    return this.currentStatus;
  }

  public broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  public broadcastSlotUpdated(payload: {
    areaId: string;
    slotId: string;
    slotNumber: string;
    status: string;
    distance_cm?: number;
    timestamp: string;
  }) {
    this.currentStatus.lastDataReceived = payload.timestamp;
    this.broadcast('slot_updated', payload);
    this.broadcast('system_status', this.currentStatus);
  }

  public broadcastGateStatusUpdated(payload: {
    areaId: string;
    gateId: string;
    status: string;
    servoAngle: number;
    notes?: string;
    timestamp: string;
  }) {
    this.currentStatus.lastDataReceived = payload.timestamp;
    this.broadcast('gate_status_updated', payload);
    this.broadcast('system_status', this.currentStatus);
  }

  public broadcastDeviceStatusUpdated(payload: {
    deviceId: string;
    areaId: string;
    status: string;
    rssi?: number;
    uptimeSeconds?: number;
    lastHeartbeat: string;
  }) {
    this.currentStatus.device = payload.status as 'ONLINE' | 'OFFLINE';
    this.currentStatus.lastDataReceived = payload.lastHeartbeat;
    this.broadcast('device_status_updated', payload);
    this.broadcast('system_status', this.currentStatus);
  }

  public broadcastActivity(activity: any) {
    this.broadcast('activity_created', activity);
  }
}

export const realtimeService = new RealtimeService();
