'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  ParkingArea,
  ParkingSlot,
  ParkingActivity,
  NotificationItem,
  HourlyUsageData,
  AreaStatus,
  SlotStatus,
  GateStatus,
} from '@/lib/types';
import {
  supabase,
  isSupabaseConfigured,
  fetchParkingDataFromSupabase,
  updateSlotStatusInSupabase,
  toggleGateStatusInSupabase,
  updateGateNotesInSupabase,
  updateAreaNotesInSupabase,
} from '@/lib/supabase';

// Initial baseline data jika Supabase sedang loading atau koneksi awal
const BASELINE_AREAS: ParkingArea[] = [
  {
    id: 'filkom-main',
    facultyName: 'Fakultas Ilmu Komputer',
    description: 'Area uji coba hardware asli dengan 2 sensor jarak HC-SR04 terhubung ke modul ESP32 dan 1 portal servo gate.',
    status: 'AVAILABLE',
    lastUpdated: new Date().toISOString(),
    notes: 'Kawasan testbed IoT terhubung langsung ke modul ESP32 live (2 sensor fisik asli).',
    mapLocation: { x: 28, y: 28 },
    slots: [
      { id: 'slot-a1', slotNumber: 'A1', status: 'OCCUPIED', lastChanged: new Date().toISOString() },
      { id: 'slot-a2', slotNumber: 'A2', status: 'AVAILABLE', lastChanged: new Date().toISOString() },
    ],
    gate: {
      id: 'gate-filkom',
      name: 'Portal Gerbang FILKOM',
      status: 'CLOSED',
      lastToggled: new Date().toISOString(),
      servoAngle: 0,
      notes: 'Portal gerbang utama gedung FILKOM (Otomatis ESP32)',
    },
    device: {
      id: 'ESP32-FILKOM-NODE-01',
      model: 'ESP32-WROOM-32D (Dual-Core 240MHz)',
      status: 'ONLINE',
      ipAddress: '192.168.1.108',
      macAddress: '24:6F:28:B4:9C:12',
      rssi: -58,
      firmwareVersion: 'v2.4.2-iot-mesh',
      uptimeSeconds: 86420,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'smartcampus/parking/filkom/telemetry',
      sensorCount: 2,
    },
  },
  {
    id: 'teknik-main',
    facultyName: 'Fakultas Teknik',
    description: 'Area parkir terpadu Fakultas Teknik untuk dosen, mahasiswa, dan laboratorium.',
    status: 'LIMITED',
    lastUpdated: new Date().toISOString(),
    notes: 'Akses cepat ke Gedung Dekanat & Laboratorium Rekayasa Terpadu.',
    mapLocation: { x: 72, y: 28 },
    slots: Array.from({ length: 10 }, (_, i) => ({
      id: `slot-b${i + 1}`,
      slotNumber: `B${i + 1}`,
      status: (i < 6 ? 'OCCUPIED' : 'AVAILABLE') as SlotStatus,
      lastChanged: new Date().toISOString(),
    })),
    gate: {
      id: 'gate-teknik',
      name: 'Portal Gerbang Teknik',
      status: 'CLOSED',
      lastToggled: new Date().toISOString(),
      servoAngle: 0,
      notes: 'Portal barrier otomatis timur kampus',
    },
    device: {
      id: 'SIM-NODE-TEKNIK-02',
      model: 'Simulated Gateway Controller',
      status: 'ONLINE',
      ipAddress: '192.168.2.45',
      macAddress: '30:AE:A4:07:9F:88',
      rssi: -64,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 142000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'smartcampus/parking/teknik/telemetry',
      sensorCount: 10,
    },
  },
  {
    id: 'feb-main',
    facultyName: 'Fakultas Ekonomi dan Bisnis',
    description: 'Area parkir sentral FEB dengan kapasitas padat dan pemantauan sensor otomatis.',
    status: 'LIMITED',
    lastUpdated: new Date().toISOString(),
    notes: 'Kawasan parkir rindang sayap barat kampus FEB.',
    mapLocation: { x: 72, y: 72 },
    slots: Array.from({ length: 10 }, (_, i) => ({
      id: `slot-c${i + 1}`,
      slotNumber: `C${i + 1}`,
      status: (i < 8 ? 'OCCUPIED' : 'AVAILABLE') as SlotStatus,
      lastChanged: new Date().toISOString(),
    })),
    gate: {
      id: 'gate-feb',
      name: 'Portal Gerbang FEB',
      status: 'CLOSED',
      lastToggled: new Date().toISOString(),
      servoAngle: 0,
      notes: 'Portal akses cepat mahasiswa FEB',
    },
    device: {
      id: 'SIM-NODE-FEB-03',
      model: 'Simulated Gateway Controller',
      status: 'ONLINE',
      ipAddress: '192.168.3.12',
      macAddress: '48:3F:DA:11:44:CD',
      rssi: -70,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 98000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'smartcampus/parking/feb/telemetry',
      sensorCount: 10,
    },
  },
  {
    id: 'fisip-main',
    facultyName: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    description: 'Area parkir berkanopi teduh di dekat Gedung Dekanat dan Aula FISIP.',
    status: 'AVAILABLE',
    lastUpdated: new Date().toISOString(),
    notes: 'Area parkir dekat aula utama dan gedung dekanat.',
    mapLocation: { x: 28, y: 72 },
    slots: Array.from({ length: 10 }, (_, i) => ({
      id: `slot-d${i + 1}`,
      slotNumber: `D${i + 1}`,
      status: (i < 4 ? 'OCCUPIED' : 'AVAILABLE') as SlotStatus,
      lastChanged: new Date().toISOString(),
    })),
    gate: {
      id: 'gate-fisip',
      name: 'Portal Gerbang FISIP',
      status: 'CLOSED',
      lastToggled: new Date().toISOString(),
      servoAngle: 0,
      notes: 'Portal barrier sayap aula dekanat',
    },
    device: {
      id: 'SIM-NODE-FISIP-04',
      model: 'Simulated Gateway Controller',
      status: 'ONLINE',
      ipAddress: '192.168.4.88',
      macAddress: '5C:CF:7F:89:12:33',
      rssi: -62,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 64000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'smartcampus/parking/fisip/telemetry',
      sensorCount: 10,
    },
  },
];

const BASELINE_HOURLY: HourlyUsageData[] = [
  { time: '07:00', occupied: 6, available: 26, occupancyRate: 19 },
  { time: '08:00', occupied: 14, available: 18, occupancyRate: 44 },
  { time: '09:00', occupied: 22, available: 10, occupancyRate: 69 },
  { time: '10:00', occupied: 20, available: 12, occupancyRate: 63 },
];

interface ParkingContextType {
  areas: ParkingArea[];
  activities: ParkingActivity[];
  notifications: NotificationItem[];
  hourlyUsage: HourlyUsageData[];
  simulationActive: boolean;
  simulationIntervalMs: number;
  lastSimEventMessage: string | null;
  searchQuery: string;
  isSupabaseLive: boolean;
  setSearchQuery: (q: string) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulationIntervalMs: (ms: number) => void;
  toggleSlot: (areaId: string, slotId: string) => void;
  toggleGate: (areaId: string, gateId?: string) => void;
  updateGateNotes: (areaId: string, notes: string) => void;
  updateAreaNotes: (areaId: string, notes: string) => void;
  triggerRandomEvent: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  resetAllData: () => void;
  refreshFromSupabase: () => Promise<void>;
  stats: {
    totalAreas: number;
    totalSlots: number;
    totalAvailable: number;
    totalOccupied: number;
    occupancyRate: number;
    onlineDevicesCount: number;
  };
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

function calculateAreaStatus(available: number, total: number): AreaStatus {
  if (available === 0) return 'FULL';
  const ratio = available / total;
  if (ratio <= 0.25) return 'LIMITED';
  return 'AVAILABLE';
}

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<ParkingArea[]>(BASELINE_AREAS);
  const [activities, setActivities] = useState<ParkingActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsageData[]>(BASELINE_HOURLY);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationIntervalMs, setSimulationIntervalMs] = useState<number>(7000);
  const [lastSimEventMessage, setLastSimEventMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(isSupabaseConfigured);

  // 1. Fetch data dari Supabase saat aplikasi dimuat
  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const data = await fetchParkingDataFromSupabase();
    if (data && data.areas.length > 0) {
      setAreas(data.areas);
      setActivities(data.activities);
      setNotifications(data.notifications);
      if (data.hourlyUsage.length > 0) {
        setHourlyUsage(data.hourlyUsage);
      }
      setIsSupabaseLive(true);
      setLastSimEventMessage('Terhubung langsung ke database Supabase Cloud.');
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // 2. Realtime Subscription Supabase (Mendengarkan perubahan langsung dari cloud)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('smartcampus-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        (payload) => {
          const updatedSlot = payload.new as any;
          if (!updatedSlot || !updatedSlot.id) return;

          setAreas((prevAreas) =>
            prevAreas.map((area) => {
              if (area.id !== updatedSlot.area_id) return area;

              const newSlots = area.slots.map((s) =>
                s.id === updatedSlot.id
                  ? { ...s, status: updatedSlot.status as SlotStatus, lastChanged: updatedSlot.last_changed }
                  : s
              );
              const newOccupied = newSlots.filter((s) => s.status === 'OCCUPIED').length;
              const newAvailable = newSlots.length - newOccupied;

              return {
                ...area,
                slots: newSlots,
                status: calculateAreaStatus(newAvailable, newSlots.length),
                lastUpdated: new Date().toISOString(),
              };
            })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gates' },
        (payload) => {
          const updatedGate = payload.new as any;
          if (!updatedGate || !updatedGate.area_id) return;

          setAreas((prevAreas) =>
            prevAreas.map((area) => {
              if (area.id !== updatedGate.area_id) return area;
              return {
                ...area,
                gate: {
                  ...area.gate,
                  status: updatedGate.status as GateStatus,
                  servoAngle: updatedGate.servo_angle ?? (updatedGate.status === 'OPEN' ? 90 : 0),
                  notes: updatedGate.notes ?? area.gate.notes,
                  lastToggled: updatedGate.last_toggled || new Date().toISOString(),
                },
              };
            })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_areas' },
        (payload) => {
          const updatedArea = payload.new as any;
          if (!updatedArea || !updatedArea.id) return;

          setAreas((prevAreas) =>
            prevAreas.map((area) =>
              area.id === updatedArea.id
                ? {
                    ...area,
                    notes: updatedArea.notes ?? area.notes,
                    status: (updatedArea.status as AreaStatus) || area.status,
                    lastUpdated: updatedArea.last_updated || new Date().toISOString(),
                  }
                : area
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parking_activities' },
        (payload) => {
          const newAct = payload.new as any;
          if (!newAct || !newAct.id) return;

          const activityItem: ParkingActivity = {
            id: newAct.id,
            timestamp: newAct.timestamp,
            faculty: newAct.faculty,
            areaId: newAct.area_id || '',
            slotId: newAct.slot_id,
            activity: newAct.activity,
            status: newAct.status,
            durationMinutes: newAct.duration_minutes,
          };
          setActivities((prev) => [activityItem, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetAllData = useCallback(async () => {
    if (isSupabaseConfigured) {
      await loadSupabaseData();
      setLastSimEventMessage('Data disinkronkan ulang dari Supabase.');
    } else {
      setAreas(BASELINE_AREAS);
      setLastSimEventMessage('Data disinkronkan ke kondisi baseline.');
    }
  }, [loadSupabaseData]);

  // Toggle Slot (Bisa dikendalikan via Dashboard Admin)
  const toggleSlot = useCallback((areaId: string, slotId: string) => {
    setAreas((prevAreas) => {
      return prevAreas.map((area) => {
        if (area.id !== areaId) return area;

        const targetSlot = area.slots.find((s) => s.id === slotId);
        if (!targetSlot) return area;

        const newStatus: SlotStatus = targetSlot.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
        const isOccupied = newStatus === 'OCCUPIED';

        // Kirim update ke Supabase di latar belakang
        updateSlotStatusInSupabase(slotId, newStatus);

        const updatedSlots: ParkingSlot[] = area.slots.map((s) => {
          if (s.id !== slotId) return s;
          return {
            ...s,
            status: newStatus,
            lastChanged: new Date().toISOString(),
          };
        });

        const newOccupied = updatedSlots.filter((s) => s.status === 'OCCUPIED').length;
        const newAvailable = updatedSlots.length - newOccupied;
        const newAreaStatus = calculateAreaStatus(newAvailable, updatedSlots.length);

        // Record Activity Log lokal (jika offline)
        const newActivity: ParkingActivity = {
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          faculty: area.facultyName,
          areaId: area.id,
          slotId: targetSlot.slotNumber,
          activity: isOccupied ? 'IN' : 'OUT',
          status: newStatus,
          durationMinutes: isOccupied ? undefined : Math.floor(25 + Math.random() * 180),
        };
        setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);

        const eventMsg = `${area.facultyName} (${targetSlot.slotNumber}) kini ${newStatus === 'OCCUPIED' ? 'TERISI' : 'KOSONG'}`;
        setLastSimEventMessage(eventMsg);

        return {
          ...area,
          slots: updatedSlots,
          status: newAreaStatus,
          lastUpdated: new Date().toISOString(),
        };
      });
    });
  }, []);

  // Toggle Gate Servo (Bisa dikendalikan via Dashboard Admin)
  const toggleGate = useCallback((areaId: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        const nextStatus: GateStatus = area.gate.status === 'CLOSED' ? 'OPEN' : 'CLOSED';

        // Kirim update ke Supabase
        toggleGateStatusInSupabase(areaId, nextStatus);

        return {
          ...area,
          gate: {
            ...area.gate,
            status: nextStatus,
            servoAngle: nextStatus === 'OPEN' ? 90 : 0,
            lastToggled: new Date().toISOString(),
          },
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Update Catatan Portal (Bisa dikendalikan via Dashboard Admin)
  const updateGateNotes = useCallback((areaId: string, notes: string) => {
    updateGateNotesInSupabase(areaId, notes);
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        return {
          ...area,
          gate: {
            ...area.gate,
            notes,
          },
        };
      })
    );
  }, []);

  // Update Catatan Area Parkir (Bisa dikendalikan via Dashboard Admin)
  const updateAreaNotes = useCallback((areaId: string, notes: string) => {
    updateAreaNotesInSupabase(areaId, notes);
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        return {
          ...area,
          notes,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Random simulation trigger (opsional)
  const triggerRandomEvent = useCallback(() => {
    setAreas((currentAreas) => {
      const simulatedAreas = currentAreas.filter((a) => a.id !== 'filkom-main');
      const targetArea = simulatedAreas[Math.floor(Math.random() * simulatedAreas.length)];
      if (!targetArea || targetArea.slots.length === 0) return currentAreas;

      const randomSlot = targetArea.slots[Math.floor(Math.random() * targetArea.slots.length)];
      if (!randomSlot) return currentAreas;

      setTimeout(() => {
        toggleSlot(targetArea.id, randomSlot.id);
      }, 0);

      return currentAreas;
    });
  }, [toggleSlot]);

  // Periodic Simulation loop
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      triggerRandomEvent();
    }, simulationIntervalMs);

    return () => clearInterval(interval);
  }, [simulationActive, simulationIntervalMs, triggerRandomEvent]);

  // Compute campus-wide statistics dynamically from slots
  const stats = useMemo(() => {
    const safeAreas = areas || [];
    const totalAreas = safeAreas.length;
    const totalSlots = safeAreas.reduce((acc, a) => acc + (a?.slots?.length || 0), 0);
    const totalOccupied = safeAreas.reduce(
      (acc, a) =>
        acc + (a?.slots ? a.slots.filter((s) => s.status === 'OCCUPIED').length : 0),
      0
    );
    const totalAvailable = totalSlots - totalOccupied;
    const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;
    const onlineDevicesCount = safeAreas.filter((a) => a?.device?.status === 'ONLINE').length;

    return {
      totalAreas,
      totalSlots,
      totalAvailable,
      totalOccupied,
      occupancyRate,
      onlineDevicesCount,
    };
  }, [areas]);

  return (
    <ParkingContext.Provider
      value={{
        areas,
        activities,
        notifications,
        hourlyUsage,
        simulationActive,
        simulationIntervalMs,
        lastSimEventMessage,
        searchQuery,
        isSupabaseLive,
        setSearchQuery,
        setSimulationActive,
        setSimulationIntervalMs,
        toggleSlot,
        toggleGate,
        updateGateNotes,
        updateAreaNotes,
        triggerRandomEvent,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetAllData,
        refreshFromSupabase: loadSupabaseData,
        stats,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
}
