export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNKNOWN';
export type AreaStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'OFFLINE';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type GateStatus = 'OPEN' | 'CLOSED';
export type AreaDataSource = 'REAL' | 'SIMULATED' | 'REAL DEVICE';

export interface ParkingSlot {
  id: string;
  slotNumber: string; // e.g. "A1", "A2", "B1"
  status: SlotStatus;
  distance_cm?: number;
  lastChanged: string;
}

export interface GateInfo {
  id: string;
  name: string;
  status: GateStatus;
  lastToggled: string;
  servoAngle: number;
  notes?: string;
  isPendingConfirmation?: boolean; // True saat command dikirim ke ESP32 dan menunggu konfirmasi aktual
}

export interface IotDeviceInfo {
  id: string;
  model: string;
  deviceName?: string;
  status: DeviceStatus;
  ipAddress: string;
  macAddress: string;
  rssi: number; // in dBm
  firmwareVersion: string;
  uptimeSeconds: number;
  lastHeartbeat: string;
  mqttTopic: string;
  sensorCount: number;
}

export interface ParkingArea {
  id: string;
  facultyName: string;
  name?: string;
  description: string;
  status: AreaStatus;
  dataSource: AreaDataSource; // REAL (FILKOM ESP32) atau SIMULATED (Fakultas lain)
  lastUpdated: string;
  mapLocation: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  slots: ParkingSlot[];
  gate: GateInfo; // 1 portal per area
  device: IotDeviceInfo;
  notes?: string; // notes untuk parking area
}

export interface ParkingActivity {
  id: string;
  timestamp: string;
  faculty: string;
  areaId: string;
  slotId: string;
  activity: 'IN' | 'OUT' | 'GATE_TRIGGER' | 'SYSTEM_CHECK';
  status: SlotStatus;
  previous_status?: SlotStatus;
  current_status?: SlotStatus;
  data_source?: string;
  durationMinutes?: number;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  areaId?: string;
}

export interface HourlyUsageData {
  time: string; // e.g. "07:00"
  occupied: number;
  available: number;
  occupancyRate: number; // percentage
}

export interface ConnectionState {
  mqtt: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'CONFIG_REQUIRED';
  database: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  device: 'ONLINE' | 'OFFLINE';
  backend: 'CONNECTED' | 'DISCONNECTED';
  lastDataReceived: string | null;
}

// Derived helpers from slots
export function getAreaCapacity(area: ParkingArea): number {
  return area.slots.length;
}

export function getAreaOccupied(area: ParkingArea): number {
  return area.slots.filter((s) => s.status === 'OCCUPIED').length;
}

export function getAreaAvailable(area: ParkingArea): number {
  return area.slots.filter((s) => s.status === 'AVAILABLE').length;
}

export function getAreaOccupancyRate(area: ParkingArea): number {
  const total = area.slots.length;
  if (total === 0) return 0;
  return Math.round((getAreaOccupied(area) / total) * 100);
}
