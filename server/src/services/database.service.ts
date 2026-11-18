import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config/env.js';
import { SlotStatus, GateStatus, DeviceStatus } from '../types/index.js';

export function normalizeAreaId(id: string): string {
  if (!id) return id;
  const clean = id.trim().toLowerCase();
  if (clean === 'filkom' || clean === 'filkom-main') return 'filkom-main';
  if (clean === 'teknik' || clean === 'teknik-main') return 'teknik-main';
  if (clean === 'feb' || clean === 'feb-main') return 'feb-main';
  if (clean === 'fisip' || clean === 'fisip-main') return 'fisip-main';
  return clean.endsWith('-main') ? clean : `${clean}-main`;
}

class DatabaseService {
  private client: SupabaseClient | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });
        this.isConnected = true;
        console.log('[DatabaseService] Supabase client initialized with Service Role Key.');
      } catch (err) {
        console.error('[DatabaseService] Failed to initialize Supabase client:', err);
        this.isConnected = false;
      }
    } else {
      console.warn('[DatabaseService] SUPABASE_SERVICE_ROLE_KEY is not configured.');
      this.isConnected = false;
    }
  }

  public getStatus(): 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' {
    return this.isConnected ? 'CONNECTED' : 'DISCONNECTED';
  }

  public async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client.from('parking_areas').select('id').limit(1);
      if (error) {
        console.error('[DatabaseService] Connection test failed:', error.message);
        this.isConnected = false;
        return false;
      }
      this.isConnected = true;
      return true;
    } catch (err) {
      this.isConnected = false;
      return false;
    }
  }

  public async getAllAreas() {
    if (!this.client) return [];
    try {
      const [areasRes, slotsRes, gatesRes, devicesRes] = await Promise.all([
        this.client.from('parking_areas').select('*').order('id', { ascending: true }),
        this.client.from('parking_slots').select('*').order('slot_number', { ascending: true }),
        this.client.from('gates').select('*'),
        this.client.from('iot_devices').select('*'),
      ]);

      if (areasRes.error) throw areasRes.error;

      const rawAreas = areasRes.data || [];
      const rawSlots = slotsRes.data || [];
      const rawGates = gatesRes.data || [];
      const rawDevices = devicesRes.data || [];

      return rawAreas.map((area: any) => {
        const areaSlots = rawSlots
          .filter((s: any) => s.area_id === area.id)
          .map((s: any) => ({
            id: s.id,
            slotNumber: s.slot_number,
            status: s.status as SlotStatus,
            distance_cm: s.distance_cm ?? undefined,
            lastChanged: s.last_changed || new Date().toISOString(),
          }));

        const areaGate = rawGates.find((g: any) => g.area_id === area.id);
        const areaDevice = rawDevices.find((d: any) => d.area_id === area.id);

        return {
          id: area.id,
          facultyName: area.faculty_name,
          name: area.name || area.faculty_name,
          description: area.description || '',
          status: area.status,
          dataSource: area.data_source || (area.id === 'filkom-main' ? 'REAL' : 'SIMULATED'),
          lastUpdated: area.last_updated || new Date().toISOString(),
          mapLocation: {
            x: Number(area.map_x) || 28,
            y: Number(area.map_y) || 28,
          },
          notes: area.notes || '',
          slots: areaSlots,
          gate: {
            id: areaGate?.id || `gate-${area.id}`,
            name: areaGate?.name || `Portal ${area.faculty_name}`,
            status: (areaGate?.status as GateStatus) || 'CLOSED',
            lastToggled: areaGate?.last_toggled || new Date().toISOString(),
            servoAngle: areaGate?.servo_angle ?? (areaGate?.status === 'OPEN' ? 90 : 0),
            notes: areaGate?.notes || '',
          },
          device: {
            id: areaDevice?.id || `NODE-${area.id.toUpperCase()}`,
            model: areaDevice?.model || 'ESP32-WROOM-32D',
            deviceName: areaDevice?.device_name || areaDevice?.id,
            status: (areaDevice?.status as DeviceStatus) || 'ONLINE',
            ipAddress: areaDevice?.ip_address || '192.168.1.100',
            macAddress: areaDevice?.mac_address || '24:6F:28:B4:9C:12',
            rssi: areaDevice?.rssi ?? -60,
            firmwareVersion: areaDevice?.firmware_version || 'v2.4.2',
            uptimeSeconds: areaDevice?.uptime_seconds ?? 0,
            lastHeartbeat: areaDevice?.last_heartbeat || new Date().toISOString(),
            mqttTopic: areaDevice?.mqtt_topic || `campus/parking/${area.id}/node/status`,
            sensorCount: areaDevice?.sensor_count ?? areaSlots.length,
          },
        };
      });
    } catch (err: any) {
      console.error('[DatabaseService] Failed to get all areas:', err.message);
      return [];
    }
  }

  public async updateSlotStatus(
    areaId: string,
    slotNumberOrId: string,
    status: SlotStatus,
    distanceCm?: number
  ) {
    if (!this.client) return null;
    const targetAreaId = normalizeAreaId(areaId);
    try {
      // Find the slot first
      const { data: slots, error: findError } = await this.client
        .from('parking_slots')
        .select('*')
        .eq('area_id', targetAreaId)
        .or(`id.eq.${slotNumberOrId},slot_number.eq.${slotNumberOrId}`)
        .limit(1);

      if (findError || !slots || slots.length === 0) {
        console.warn(`[DatabaseService] Slot ${slotNumberOrId} not found in area ${targetAreaId}`);
        return null;
      }

      const currentSlot = slots[0];
      const prevStatus = currentSlot.status;

      // Update slot
      const updatePayload: Record<string, any> = {
        status,
        last_changed: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (distanceCm !== undefined) {
        updatePayload.distance_cm = distanceCm;
      }

      const { data: updatedSlot, error: updateError } = await this.client
        .from('parking_slots')
        .update(updatePayload)
        .eq('id', currentSlot.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Recalculate area status
      await this.recalculateAreaStatus(targetAreaId);

      // Record activity if status changed
      if (prevStatus !== status) {
        const isOccupied = status === 'OCCUPIED';
        const activity = isOccupied ? 'IN' : 'OUT';
        const isReal = targetAreaId === 'filkom-main';

        await this.recordActivity({
          area_id: targetAreaId,
          faculty: targetAreaId === 'filkom-main' ? 'Fakultas Ilmu Komputer' : targetAreaId,
          slot_id: currentSlot.slot_number,
          activity,
          status,
          previous_status: prevStatus,
          current_status: status,
          data_source: isReal ? 'REAL' : 'SIMULATED',
          duration_minutes: isOccupied ? undefined : Math.floor(15 + Math.random() * 90),
        });
      }

      return updatedSlot;
    } catch (err: any) {
      console.error('[DatabaseService] updateSlotStatus error:', err.message);
      return null;
    }
  }

  public async markSlotsAsUnknown(areaId: string) {
    if (!this.client) return;
    const targetAreaId = normalizeAreaId(areaId);
    try {
      console.log(`[DatabaseService] Marking all slots in ${targetAreaId} as UNKNOWN (Device Offline)`);
      await this.client
        .from('parking_slots')
        .update({ status: 'UNKNOWN', last_changed: new Date().toISOString() })
        .eq('area_id', targetAreaId);

      await this.client
        .from('parking_areas')
        .update({ status: 'OFFLINE', last_updated: new Date().toISOString() })
        .eq('id', targetAreaId);
    } catch (err: any) {
      console.error('[DatabaseService] markSlotsAsUnknown error:', err.message);
    }
  }

  public async updateDeviceStatus(
    deviceId: string,
    areaId: string,
    status: DeviceStatus,
    telemetry?: { rssi?: number; uptime_seconds?: number; ip_address?: string; mac_address?: string }
  ) {
    if (!this.client) return null;
    const targetAreaId = normalizeAreaId(areaId);
    try {
      const updateData: Record<string, any> = {
        status,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (telemetry?.rssi !== undefined) updateData.rssi = telemetry.rssi;
      if (telemetry?.uptime_seconds !== undefined) updateData.uptime_seconds = telemetry.uptime_seconds;
      if (telemetry?.ip_address) updateData.ip_address = telemetry.ip_address;
      if (telemetry?.mac_address) updateData.mac_address = telemetry.mac_address;

      const { data, error } = await this.client
        .from('iot_devices')
        .update(updateData)
        .or(`id.eq.${deviceId},area_id.eq.${targetAreaId}`)
        .select();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[DatabaseService] updateDeviceStatus error:', err.message);
      return null;
    }
  }

  public async updateGateStatus(
    areaId: string,
    gateId: string,
    status: GateStatus,
    servoAngle?: number
  ) {
    if (!this.client) return null;
    const targetAreaId = normalizeAreaId(areaId);
    try {
      const angle = servoAngle !== undefined ? servoAngle : (status === 'OPEN' ? 90 : 0);
      const { data, error } = await this.client
        .from('gates')
        .update({
          status,
          servo_angle: angle,
          last_toggled: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${gateId},area_id.eq.${targetAreaId}`)
        .select()
        .single();

      if (error) throw error;

      // Log gate activity
      await this.recordActivity({
        area_id: targetAreaId,
        faculty: targetAreaId === 'filkom-main' ? 'Fakultas Ilmu Komputer' : targetAreaId,
        slot_id: 'GATE',
        activity: 'GATE_TRIGGER',
        status: status === 'OPEN' ? 'AVAILABLE' : 'OCCUPIED',
        previous_status: status === 'OPEN' ? 'OCCUPIED' : 'AVAILABLE',
        current_status: status === 'OPEN' ? 'AVAILABLE' : 'OCCUPIED',
        data_source: targetAreaId === 'filkom-main' ? 'REAL' : 'SIMULATED',
      });

      return data;
    } catch (err: any) {
      console.error('[DatabaseService] updateGateStatus error:', err.message);
      return null;
    }
  }

  public async updateGateNotes(areaId: string, notes: string) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('gates')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('area_id', areaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[DatabaseService] updateGateNotes error:', err.message);
      return null;
    }
  }

  public async updateAreaNotes(areaId: string, notes: string) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('parking_areas')
        .update({ notes, last_updated: new Date().toISOString() })
        .eq('id', areaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[DatabaseService] updateAreaNotes error:', err.message);
      return null;
    }
  }

  public async recordActivity(activity: {
    area_id: string;
    faculty: string;
    slot_id: string;
    activity: string;
    status: SlotStatus;
    previous_status?: SlotStatus;
    current_status?: SlotStatus;
    data_source?: string;
    duration_minutes?: number;
  }) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('parking_activities')
        .insert({
          timestamp: new Date().toISOString(),
          area_id: activity.area_id,
          faculty: activity.faculty,
          slot_id: activity.slot_id,
          activity: activity.activity,
          status: activity.status,
          previous_status: activity.previous_status,
          current_status: activity.current_status,
          data_source: activity.data_source || 'SIMULATED',
          duration_minutes: activity.duration_minutes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('[DatabaseService] recordActivity error:', err.message);
      return null;
    }
  }

  public async getActivities(limit = 50) {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('parking_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('[DatabaseService] getActivities error:', err.message);
      return [];
    }
  }

  public async getNotifications(limit = 20) {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('[DatabaseService] getNotifications error:', err.message);
      return [];
    }
  }

  private async recalculateAreaStatus(areaId: string) {
    if (!this.client) return;
    try {
      const { data: slots } = await this.client
        .from('parking_slots')
        .select('status')
        .eq('area_id', areaId);

      if (!slots || slots.length === 0) return;

      const total = slots.length;
      const available = slots.filter((s: any) => s.status === 'AVAILABLE').length;

      let newStatus: string = 'AVAILABLE';
      if (available === 0) newStatus = 'FULL';
      else if (available / total <= 0.25) newStatus = 'LIMITED';

      await this.client
        .from('parking_areas')
        .update({ status: newStatus, last_updated: new Date().toISOString() })
        .eq('id', areaId);
    } catch (err: any) {
      console.error('[DatabaseService] recalculateAreaStatus error:', err.message);
    }
  }
}

export const databaseService = new DatabaseService();
