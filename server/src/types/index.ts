import { z } from 'zod';

export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNKNOWN';
export type AreaStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'OFFLINE';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type GateStatus = 'OPEN' | 'CLOSED';
export type AreaDataSource = 'REAL' | 'SIMULATED';

// Zod Validation Schemas untuk MQTT Payloads
export const SlotPayloadSchema = z.object({
  slot_id: z.string().min(1),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'UNKNOWN']),
  distance_cm: z.number().optional(),
  timestamp: z.string().optional(),
});
export type SlotPayload = z.infer<typeof SlotPayloadSchema>;

export const DeviceStatusPayloadSchema = z.object({
  device_id: z.string().min(1),
  status: z.enum(['ONLINE', 'OFFLINE']),
  rssi: z.number().optional(),
  uptime_seconds: z.number().optional(),
  ip_address: z.string().optional(),
  mac_address: z.string().optional(),
  timestamp: z.string().optional(),
});
export type DeviceStatusPayload = z.infer<typeof DeviceStatusPayloadSchema>;

export const GateStatusPayloadSchema = z.object({
  gate_id: z.string().min(1),
  status: z.enum(['OPEN', 'CLOSED']),
  servo_angle: z.number().min(0).max(180).optional(),
  timestamp: z.string().optional(),
});
export type GateStatusPayload = z.infer<typeof GateStatusPayloadSchema>;

export const GateCommandPayloadSchema = z.object({
  command: z.enum(['OPEN', 'CLOSED']),
  target_angle: z.number().min(0).max(180).optional(),
  requested_by: z.string().default('admin'),
  timestamp: z.string().optional(),
});
export type GateCommandPayload = z.infer<typeof GateCommandPayloadSchema>;

// System Connection Status
export interface SystemConnectionStatus {
  mqtt: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'CONFIG_REQUIRED';
  database: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  device: 'ONLINE' | 'OFFLINE';
  backend: 'CONNECTED' | 'DISCONNECTED';
  lastDataReceived: string | null;
}
