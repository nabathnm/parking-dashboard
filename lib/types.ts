export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNKNOWN';
export type AreaStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'OFFLINE';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';
export type GateStatus = 'OPEN' | 'CLOSED';
export type DataSource = 'REAL DEVICE' | 'SIMULATED';

export interface ParkingSlot {
  id: string;
  slotNumber: string; // e.g. "A1", "A2", "B1"
  status: SlotStatus;
  distanceCm: number; // ultrasonic sensor distance in cm
  lastChanged: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  sensorId?: string;
  notes?: string;
}

export interface GateInfo {
  id: string;
  name: string;
  type: 'ENTRY' | 'EXIT';
  status: GateStatus;
  lastToggled: string;
  servoAngle: number;
}

export interface IotDeviceInfo {
  id: string;
  name: string;
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
  areaName: string;
  code: string;
  description: string;
  dataSource: DataSource;
  totalCapacity: number;
  availableSlots: number;
  occupiedSlots: number;
  status: AreaStatus;
  lastUpdated: string;
  // Campus map coordinates (percentage on blueprint canvas)
  mapLocation: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    buildingLabel: string;
  };
  slots: ParkingSlot[];
  gates: GateInfo[];
  device: IotDeviceInfo;
}

export interface ParkingActivity {
  id: string;
  timestamp: string;
  faculty: string;
  parkingArea: string;
  areaId: string;
  slotId: string;
  activity: 'IN' | 'OUT' | 'GATE_TRIGGER' | 'SYSTEM_CHECK';
  status: SlotStatus;
  durationMinutes?: number;
  vehiclePlate?: string;
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

