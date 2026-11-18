'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ParkingArea,
  ParkingSlot,
  ParkingActivity,
  NotificationItem,
  HourlyUsageData,
  AreaStatus,
  SlotStatus,
  GateStatus,
  ConnectionState,
} from '@/lib/types';
import {
  supabase,
  isSupabaseConfigured,
  fetchParkingDataFromSupabase,
  updateSlotStatusInSupabase,
  updateGateNotesInSupabase,
  updateAreaNotesInSupabase,
  sendGateCommandToBackend,
  API_BASE_URL,
} from '@/lib/supabase';

// Baseline data initial dengan label REAL DEVICE (FILKOM) dan SIMULATED (Fakultas lain)
const INITIAL_AREAS: ParkingArea[] = [
  {
    id: 'filkom-main',
    facultyName: 'Fakultas Ilmu Komputer',
    description: 'Area uji coba hardware asli dengan 2 sensor jarak HC-SR04 terhubung ke modul ESP32 dan 1 portal servo gate.',
    status: 'AVAILABLE',
    dataSource: 'REAL',
    lastUpdated: new Date().toISOString(),
    notes: 'Kawasan testbed IoT terhubung langsung ke modul ESP32 live via EMQX Cloud.',
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
      isPendingConfirmation: false,
    },
    device: {
      id: 'ESP32-FILKOM-01',
      model: 'ESP32-WROOM-32D',
      deviceName: 'ESP32-FILKOM-01',
      status: 'ONLINE',
      ipAddress: '192.168.1.108',
      macAddress: '24:6F:28:B4:9C:12',
      rssi: -58,
      firmwareVersion: 'v2.4.2-iot',
      uptimeSeconds: 86420,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'campus/parking/filkom/node/status',
      sensorCount: 2,
    },
  },
  {
    id: 'teknik-main',
    facultyName: 'Fakultas Teknik',
    description: 'Area parkir terpadu Fakultas Teknik untuk dosen, mahasiswa, dan laboratorium.',
    status: 'LIMITED',
    dataSource: 'SIMULATED',
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
      deviceName: 'SIM-NODE-TEKNIK-02',
      status: 'ONLINE',
      ipAddress: '192.168.2.45',
      macAddress: '30:AE:A4:07:9F:88',
      rssi: -64,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 142000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'campus/parking/teknik/node/status',
      sensorCount: 10,
    },
  },
  {
    id: 'feb-main',
    facultyName: 'Fakultas Ekonomi dan Bisnis',
    description: 'Area parkir sentral FEB dengan kapasitas padat dan pemantauan sensor otomatis.',
    status: 'LIMITED',
    dataSource: 'SIMULATED',
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
      deviceName: 'SIM-NODE-FEB-03',
      status: 'ONLINE',
      ipAddress: '192.168.3.12',
      macAddress: '48:3F:DA:11:44:CD',
      rssi: -70,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 98000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'campus/parking/feb/node/status',
      sensorCount: 10,
    },
  },
  {
    id: 'fisip-main',
    facultyName: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    description: 'Area parkir berkanopi teduh di dekat Gedung Dekanat dan Aula FISIP.',
    status: 'AVAILABLE',
    dataSource: 'SIMULATED',
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
      deviceName: 'SIM-NODE-FISIP-04',
      status: 'ONLINE',
      ipAddress: '192.168.4.88',
      macAddress: '5C:CF:7F:89:12:33',
      rssi: -62,
      firmwareVersion: 'v1.8.0-sim',
      uptimeSeconds: 64000,
      lastHeartbeat: new Date().toISOString(),
      mqttTopic: 'campus/parking/fisip/node/status',
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
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (q: string) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulationIntervalMs: (ms: number) => void;
  toggleSlot: (areaId: string, slotId: string) => void;
  toggleGate: (areaId: string, gateId?: string) => Promise<void>;
  updateGateNotes: (areaId: string, notes: string) => Promise<void>;
  updateAreaNotes: (areaId: string, notes: string) => Promise<void>;
  triggerRandomEvent: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  resetAllData: () => Promise<void>;
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
  const [areas, setAreas] = useState<ParkingArea[]>(INITIAL_AREAS);
  const [activities, setActivities] = useState<ParkingActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsageData[]>(BASELINE_HOURLY);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationIntervalMs, setSimulationIntervalMs] = useState<number>(7000);
  const [lastSimEventMessage, setLastSimEventMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(isSupabaseConfigured);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status Koneksi Terpadu (MQTT, Database, Device, Backend)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    mqtt: 'CONNECTING',
    database: isSupabaseConfigured ? 'CONNECTED' : 'DISCONNECTED',
    device: 'ONLINE',
    backend: 'DISCONNECTED',
    lastDataReceived: null,
  });

  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch data dari Supabase saat aplikasi dimuat
  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchParkingDataFromSupabase();
      if (data && data.areas.length > 0) {
        setAreas(data.areas);
        setActivities(data.activities);
        setNotifications(data.notifications);
        if (data.hourlyUsage.length > 0) {
          setHourlyUsage(data.hourlyUsage);
        }
        setIsSupabaseLive(true);
        setConnectionState((prev) => ({
          ...prev,
          database: 'CONNECTED',
        }));
      }
    } catch (err: any) {
      console.error('Error fetching Supabase data:', err);
      setError(err.message || 'Gagal memuat data dari Supabase');
      setConnectionState((prev) => ({ ...prev, database: 'DISCONNECTED' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // 2. Hubungkan ke Node.js Backend Realtime (Socket.IO)
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to IoT Backend:', API_BASE_URL);
      setConnectionState((prev) => ({ ...prev, backend: 'CONNECTED' }));
    });

    socket.on('disconnect', () => {
      console.warn('[Socket.IO] Disconnected from IoT Backend.');
      setConnectionState((prev) => ({ ...prev, backend: 'DISCONNECTED' }));
    });

    // Menerima update status koneksi aktual dari backend
    socket.on('system_status', (status: Partial<ConnectionState>) => {
      setConnectionState((prev) => ({
        ...prev,
        ...status,
        backend: 'CONNECTED',
      }));
    });

    // Menerima update status slot real-time dari ESP32 / Backend
    socket.on('slot_updated', (payload: {
      areaId: string;
      slotId: string;
      slotNumber: string;
      status: SlotStatus;
      distance_cm?: number;
      timestamp: string;
    }) => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          if (area.id !== payload.areaId) return area;

          const updatedSlots = area.slots.map((s) => {
            if (s.id === payload.slotId || s.slotNumber === payload.slotNumber) {
              return {
                ...s,
                status: payload.status,
                distance_cm: payload.distance_cm ?? s.distance_cm,
                lastChanged: payload.timestamp,
              };
            }
            return s;
          });

          const newOccupied = updatedSlots.filter((s) => s.status === 'OCCUPIED').length;
          const newAvailable = updatedSlots.length - newOccupied;

          return {
            ...area,
            slots: updatedSlots,
            status: calculateAreaStatus(newAvailable, updatedSlots.length),
            lastUpdated: payload.timestamp,
          };
        })
      );

      setConnectionState((prev) => ({
        ...prev,
        lastDataReceived: payload.timestamp,
      }));
    });

    // Menerima status konfirmasi gerbang dari ESP32
    socket.on('gate_status_updated', (payload: {
      areaId: string;
      gateId: string;
      status: GateStatus;
      servoAngle: number;
      notes?: string;
      timestamp: string;
    }) => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          if (area.id !== payload.areaId) return area;
          return {
            ...area,
            gate: {
              ...area.gate,
              status: payload.status,
              servoAngle: payload.servoAngle,
              notes: payload.notes ?? area.gate.notes,
              lastToggled: payload.timestamp,
              isPendingConfirmation: false, // Konfirmasi fisik selesai!
            },
          };
        })
      );
    });

    // Status perintah gerbang sedang pending (dikirim ke ESP32)
    socket.on('gate_command_pending', (payload: { areaId: string; command: string; message: string }) => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          if (area.id !== payload.areaId) return area;
          return {
            ...area,
            gate: {
              ...area.gate,
              isPendingConfirmation: true,
            },
          };
        })
      );
      setLastSimEventMessage(payload.message);
    });

    // Menerima update status perangkat ESP32
    socket.on('device_status_updated', (payload: {
      deviceId: string;
      areaId: string;
      status: 'ONLINE' | 'OFFLINE';
      rssi?: number;
      uptimeSeconds?: number;
      lastHeartbeat: string;
    }) => {
      setAreas((prevAreas) =>
        prevAreas.map((area) => {
          if (area.id !== payload.areaId) return area;
          return {
            ...area,
            device: {
              ...area.device,
              status: payload.status,
              rssi: payload.rssi ?? area.device.rssi,
              uptimeSeconds: payload.uptimeSeconds ?? area.device.uptimeSeconds,
              lastHeartbeat: payload.lastHeartbeat,
            },
          };
        })
      );

      if (payload.areaId === 'filkom-main') {
        setConnectionState((prev) => ({
          ...prev,
          device: payload.status,
          lastDataReceived: payload.lastHeartbeat,
        }));
      }
    });

    // Menerima aktivitas baru
    socket.on('activity_created', (act: ParkingActivity) => {
      setActivities((prev) => [act, ...prev.slice(0, 49)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Supabase Realtime Subscription (Fallback / Realtime DB layer)
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
                  ? {
                      ...s,
                      status: updatedSlot.status as SlotStatus,
                      distance_cm: updatedSlot.distance_cm ?? s.distance_cm,
                      lastChanged: updatedSlot.last_changed,
                    }
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
                  isPendingConfirmation: false,
                },
              };
            })
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
            previous_status: newAct.previous_status,
            current_status: newAct.current_status,
            data_source: newAct.data_source,
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
    await loadSupabaseData();
    setLastSimEventMessage('Data disinkronkan ulang dari Supabase.');
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

        // Kirim update ke Supabase / Backend di latar belakang
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

  // Kontrol Gerbang Barrier (Komunikasi 2 Arah via MQTT & ESP32 Confirmation)
  const toggleGate = useCallback(async (areaId: string, gateId?: string) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area) return;

    const nextStatus: GateStatus = area.gate.status === 'CLOSED' ? 'OPEN' : 'CLOSED';

    // Jika area fisik (FILKOM), tandai pending confirmation sampai ESP32 merespon
    if (area.dataSource === 'REAL' || area.id === 'filkom-main') {
      setAreas((prev) =>
        prev.map((a) =>
          a.id === areaId
            ? { ...a, gate: { ...a.gate, isPendingConfirmation: true } }
            : a
        )
      );
      setLastSimEventMessage(`Mengirim perintah buka/tutup ke ESP32 via MQTT...`);
    }

    const res = await sendGateCommandToBackend(areaId, nextStatus, gateId || area.gate.id);
    setLastSimEventMessage(res.message);
  }, [areas]);

  // Update Catatan Gerbang
  const updateGateNotes = useCallback(async (areaId: string, notes: string) => {
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId ? { ...a, gate: { ...a.gate, notes } } : a
      )
    );
    await updateGateNotesInSupabase(areaId, notes);
    setLastSimEventMessage(`Catatan gerbang ${areaId} berhasil disimpan.`);
  }, []);

  // Update Catatan Area
  const updateAreaNotes = useCallback(async (areaId: string, notes: string) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, notes } : a))
    );
    await updateAreaNotesInSupabase(areaId, notes);
    setLastSimEventMessage(`Catatan area ${areaId} berhasil disimpan.`);
  }, []);

  // Trigger Random Event untuk area SIMULATED
  const triggerRandomEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/trigger`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastSimEventMessage(data.message || 'Event simulasi berhasil dieksekusi.');
        return;
      }
    } catch (e) {
      // local fallback
    }

    // Fallback lokal jika backend belum running
    const simAreas = areas.filter((a) => a.id !== 'filkom-main');
    if (simAreas.length === 0) return;
    const randomArea = simAreas[Math.floor(Math.random() * simAreas.length)];
    const randomSlot = randomArea.slots[Math.floor(Math.random() * randomArea.slots.length)];
    if (randomSlot) {
      toggleSlot(randomArea.id, randomSlot.id);
    }
  }, [areas, toggleSlot]);

  // Toggle backend background simulation
  const handleSetSimulationActive = useCallback(async (active: boolean) => {
    setSimulationActive(active);
    try {
      await fetch(`${API_BASE_URL}/api/simulation/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, intervalMs: simulationIntervalMs }),
      });
    } catch (e) {
      // offline fallback
    }
  }, [simulationIntervalMs]);

  // Compute campus-wide statistics dynamically from slots
  const stats = useMemo(() => {
    const safeAreas = areas || [];
    const totalAreas = safeAreas.length;
    const totalSlots = safeAreas.reduce((acc, a) => acc + (a.slots?.length || 0), 0);
    const totalOccupied = safeAreas.reduce(
      (acc, a) => acc + (a.slots?.filter((s) => s.status === 'OCCUPIED')?.length || 0),
      0
    );
    const totalAvailable = totalSlots - totalOccupied;
    const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;
    const onlineDevicesCount = safeAreas.filter((a) => a.device?.status === 'ONLINE').length;

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
        connectionState,
        isLoading,
        error,
        setSearchQuery,
        setSimulationActive: handleSetSimulationActive,
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
