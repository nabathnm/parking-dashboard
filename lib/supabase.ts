import { createClient } from '@supabase/supabase-js';
import {
  ParkingArea,
  ParkingSlot,
  GateInfo,
  IotDeviceInfo,
  ParkingActivity,
  NotificationItem,
  HourlyUsageData,
  SlotStatus,
  GateStatus,
  AreaStatus,
  AreaDataSource,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Periksa apakah kredensial Supabase telah diisi oleh user
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

// Fallback client aman untuk build time & SSR
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

// Helper transform row database Supabase ke model ParkingArea aplikasi
export function mapDbRowsToParkingAreas(
  areasData: any[],
  slotsData: any[],
  gatesData: any[],
  devicesData: any[]
): ParkingArea[] {
  return areasData.map((areaRow) => {
    const areaSlots = slotsData
      .filter((s) => s.area_id === areaRow.id)
      .map((s): ParkingSlot => ({
        id: s.id,
        slotNumber: s.slot_number,
        status: s.status as SlotStatus,
        distance_cm: s.distance_cm ?? undefined,
        lastChanged: s.last_changed || new Date().toISOString(),
      }));

    const gateRow = gatesData.find((g) => g.area_id === areaRow.id);
    const gate: GateInfo = gateRow
      ? {
          id: gateRow.id,
          name: gateRow.name,
          status: gateRow.status as GateStatus,
          servoAngle: gateRow.servo_angle ?? (gateRow.status === 'OPEN' ? 90 : 0),
          notes: gateRow.notes || '',
          lastToggled: gateRow.last_toggled || new Date().toISOString(),
        }
      : {
          id: `gate-${areaRow.id}`,
          name: `Portal Gerbang ${areaRow.faculty_name}`,
          status: 'CLOSED',
          servoAngle: 0,
          notes: '',
          lastToggled: new Date().toISOString(),
        };

    const deviceRow = devicesData.find((d) => d.area_id === areaRow.id);
    const device: IotDeviceInfo = deviceRow
      ? {
          id: deviceRow.id,
          model: deviceRow.model || 'ESP32 Controller',
          deviceName: deviceRow.device_name || deviceRow.id,
          status: deviceRow.status || 'ONLINE',
          ipAddress: deviceRow.ip_address || '',
          macAddress: deviceRow.mac_address || '',
          rssi: deviceRow.rssi ?? -60,
          firmwareVersion: deviceRow.firmware_version || 'v2.4.2',
          uptimeSeconds: deviceRow.uptime_seconds || 0,
          lastHeartbeat: deviceRow.last_heartbeat || new Date().toISOString(),
          mqttTopic: deviceRow.mqtt_topic || `campus/parking/${areaRow.id}/node/status`,
          sensorCount: deviceRow.sensor_count || areaSlots.length,
        }
      : {
          id: `ESP32-${areaRow.id.toUpperCase()}`,
          model: 'ESP32 Gateway Node',
          deviceName: `ESP32-${areaRow.id.toUpperCase()}`,
          status: 'ONLINE',
          ipAddress: '192.168.1.100',
          macAddress: '24:6F:28:B4:9C:12',
          rssi: -58,
          firmwareVersion: 'v2.4.2',
          uptimeSeconds: 86420,
          lastHeartbeat: new Date().toISOString(),
          mqttTopic: `campus/parking/${areaRow.id}/node/status`,
          sensorCount: areaSlots.length,
        };

    // Label: FILKOM adalah hardware fisik (REAL), fakultas lain SIMULATED
    const dataSource: AreaDataSource = (areaRow.data_source as AreaDataSource) || (areaRow.id === 'filkom-main' ? 'REAL' : 'SIMULATED');

    return {
      id: areaRow.id,
      facultyName: areaRow.faculty_name,
      name: areaRow.name || areaRow.faculty_name,
      description: areaRow.description || '',
      status: (areaRow.status as AreaStatus) || 'AVAILABLE',
      dataSource,
      lastUpdated: areaRow.last_updated || new Date().toISOString(),
      mapLocation: {
        x: Number(areaRow.map_x) || 28,
        y: Number(areaRow.map_y) || 28,
      },
      notes: areaRow.notes || '',
      slots: areaSlots,
      gate,
      device,
    };
  });
}

// -----------------------------------------------------------------------------
// OPERASI DATABASE SUPABASE & BACKEND API
// -----------------------------------------------------------------------------

// 1. Ambil seluruh data parkir terpadu dari Supabase
export async function fetchParkingDataFromSupabase(): Promise<{
  areas: ParkingArea[];
  activities: ParkingActivity[];
  notifications: NotificationItem[];
  hourlyUsage: HourlyUsageData[];
} | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const [areasRes, slotsRes, gatesRes, devicesRes, activitiesRes, notifsRes] = await Promise.all([
      supabase.from('parking_areas').select('*').order('id'),
      supabase.from('parking_slots').select('*').order('slot_number'),
      supabase.from('gates').select('*'),
      supabase.from('iot_devices').select('*'),
      supabase.from('parking_activities').select('*').order('timestamp', { ascending: false }).limit(50),
      supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(20),
    ]);

    if (areasRes.error) throw areasRes.error;

    const areas = mapDbRowsToParkingAreas(
      areasRes.data || [],
      slotsRes.data || [],
      gatesRes.data || [],
      devicesRes.data || []
    );

    const activities: ParkingActivity[] = (activitiesRes.data || []).map((a: any) => ({
      id: a.id,
      timestamp: a.timestamp,
      faculty: a.faculty,
      areaId: a.area_id || '',
      slotId: a.slot_id,
      activity: a.activity,
      status: a.status,
      previous_status: a.previous_status,
      current_status: a.current_status,
      data_source: a.data_source,
      durationMinutes: a.duration_minutes,
    }));

    const notifications: NotificationItem[] = (notifsRes.data || []).map((n: any) => ({
      id: n.id,
      timestamp: n.timestamp,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read ?? n.read ?? false,
      areaId: n.area_id,
    }));

    const totalSlots = areas.reduce((acc, a) => acc + a.slots.length, 0);
    const occupiedSlots = areas.reduce(
      (acc, a) => acc + a.slots.filter((s) => s.status === 'OCCUPIED').length,
      0
    );
    const availableSlots = totalSlots - occupiedSlots;
    const currentRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    const hourlyUsage: HourlyUsageData[] = [
      { time: '07:00', occupied: Math.max(1, Math.round(occupiedSlots * 0.4)), available: Math.max(1, totalSlots - Math.round(occupiedSlots * 0.4)), occupancyRate: Math.round(currentRate * 0.4) },
      { time: '08:00', occupied: Math.max(2, Math.round(occupiedSlots * 0.7)), available: Math.max(1, totalSlots - Math.round(occupiedSlots * 0.7)), occupancyRate: Math.round(currentRate * 0.7) },
      { time: '09:00', occupied: occupiedSlots, available: availableSlots, occupancyRate: currentRate },
      { time: '10:00', occupied: occupiedSlots, available: availableSlots, occupancyRate: currentRate },
    ];

    return { areas, activities, notifications, hourlyUsage };
  } catch (error) {
    console.error('Gagal mengambil data dari Supabase:', error);
    return null;
  }
}

// 2. Kirim perintah gerbang ke Backend (Two-Way Communication via MQTT)
export async function sendGateCommandToBackend(
  areaId: string,
  command: GateStatus,
  gateId?: string
): Promise<{ success: boolean; message: string; pendingConfirmation?: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/gates/${areaId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, gateId, requestedBy: 'admin-dashboard' }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Backend API] Backend not reachable for gate command, falling back to direct Supabase:', err);
  }

  // Fallback direct Supabase jika backend sedang offline
  const success = await toggleGateStatusInSupabase(areaId, command);
  return {
    success,
    message: success ? `Status portal gerbang disimpan langsung ke Supabase.` : 'Gagal mengirim perintah portal.',
  };
}

// 3. Ubah status slot parkir (Admin Dashboard)
export async function updateSlotStatusInSupabase(
  slotId: string,
  newStatus: SlotStatus
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('parking_slots')
    .update({
      status: newStatus,
      last_changed: new Date().toISOString(),
    })
    .eq('id', slotId);

  if (error) {
    console.error('Gagal update status slot di Supabase:', error);
    return false;
  }
  return true;
}

// 4. Buka/Tutup Portal Barrier Gerbang (Direct Supabase)
export async function toggleGateStatusInSupabase(
  areaId: string,
  newStatus: GateStatus
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('gates')
    .update({
      status: newStatus,
      servo_angle: newStatus === 'OPEN' ? 90 : 0,
      last_toggled: new Date().toISOString(),
    })
    .eq('area_id', areaId);

  if (error) {
    console.error('Gagal update portal gerbang di Supabase:', error);
    return false;
  }
  return true;
}

// 5. Update Catatan Portal Gerbang
export async function updateGateNotesInSupabase(
  areaId: string,
  notes: string
): Promise<boolean> {
  // Coba update via Backend terlebih dahulu
  try {
    const res = await fetch(`${API_BASE_URL}/api/gates/${areaId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) return true;
  } catch (e) {
    // fallback to supabase
  }

  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('gates')
    .update({ notes })
    .eq('area_id', areaId);

  return !error;
}

// 6. Update Catatan Area Parkir
export async function updateAreaNotesInSupabase(
  areaId: string,
  notes: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/areas/${areaId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) return true;
  } catch (e) {
    // fallback to supabase
  }

  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('parking_areas')
    .update({ notes, last_updated: new Date().toISOString() })
    .eq('id', areaId);

  return !error;
}
