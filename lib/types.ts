export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNKNOWN';
export type AreaStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'OFFLINE';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type GateStatus = 'OPEN' | 'CLOSED';

export interface ParkingSlot {
  id: string;
  slotNumber: string; // e.g. "A1", "A2", "B1"
  status: SlotStatus;
  lastChanged: string;
}

export interface GateInfo {
  id: string;
  name: string;
  status: GateStatus;
  lastToggled: string;
  servoAngle: number;
  notes?: string;
}

export interface IotDeviceInfo {
  id: string;
  model: string;
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
  description: string;
  status: AreaStatus;
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

