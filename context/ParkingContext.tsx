'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  INITIAL_PARKING_AREAS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_HOURLY_USAGE,
} from '@/lib/mock-data';

interface ParkingContextType {
  areas: ParkingArea[];
  activities: ParkingActivity[];
  notifications: NotificationItem[];
  hourlyUsage: HourlyUsageData[];
  simulationActive: boolean;
  simulationIntervalMs: number;
  lastSimEventMessage: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setSimulationActive: (active: boolean) => void;
  setSimulationIntervalMs: (ms: number) => void;
  toggleSlot: (areaId: string, slotId: string) => void;
  toggleGate: (areaId: string, gateId: string) => void;
  triggerRandomEvent: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  resetAllData: () => void;
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
  const [areas, setAreas] = useState<ParkingArea[]>(INITIAL_PARKING_AREAS);
  const [activities, setActivities] = useState<ParkingActivity[]>(INITIAL_ACTIVITIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [hourlyUsage] = useState<HourlyUsageData[]>(INITIAL_HOURLY_USAGE);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [simulationIntervalMs, setSimulationIntervalMs] = useState<number>(7000);
  const [lastSimEventMessage, setLastSimEventMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toggle single slot (Used by interactive demo or simulation)
  const toggleSlot = useCallback((areaId: string, slotId: string) => {
    setAreas((prevAreas) => {
      return prevAreas.map((area) => {
        if (area.id !== areaId) return area;

        const targetSlot = area.slots.find((s) => s.id === slotId);
        if (!targetSlot) return area;

        const newStatus: SlotStatus = targetSlot.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
        const isOccupied = newStatus === 'OCCUPIED';
        const newDistance = isOccupied
          ? Math.floor(14 + Math.random() * 12)
          : Math.floor(175 + Math.random() * 18);

        const updatedSlots: ParkingSlot[] = area.slots.map((s) => {
          if (s.id !== slotId) return s;
          return {
            ...s,
            status: newStatus,
            distanceCm: newDistance,
            lastChanged: new Date().toISOString(),
            notes: isOccupied
              ? `Kendaraan terparkir (${newDistance} cm)`
              : `Slot kosong (${newDistance} cm)`,
          };
        });

        const newOccupied = updatedSlots.filter((s) => s.status === 'OCCUPIED').length;
        const newAvailable = updatedSlots.length - newOccupied;
        const newAreaStatus = calculateAreaStatus(newAvailable, updatedSlots.length);

        // Record Activity Log
        const newActivity: ParkingActivity = {
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          faculty: area.facultyName,
          parkingArea: area.areaName,
          areaId: area.id,
          slotId: targetSlot.slotNumber,
          activity: isOccupied ? 'IN' : 'OUT',
          status: newStatus,
          durationMinutes: isOccupied ? undefined : Math.floor(25 + Math.random() * 180),
          vehiclePlate: `B ${Math.floor(1000 + Math.random() * 8999)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        };

        setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);

        // Push notification if Fasilkom (Real Device) or notable event
        const eventTitle = isOccupied ? 'Kendaraan Masuk' : 'Kendaraan Keluar';
        const eventMsg = `${area.code} (${targetSlot.slotNumber}) kini ${newStatus === 'OCCUPIED' ? 'TERISI' : 'KOSONG'}`;
        setLastSimEventMessage(eventMsg);

        if (area.dataSource === 'REAL DEVICE') {
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: `[ESP32] ${eventTitle} di ${area.facultyName}`,
            message: `Sensor ${targetSlot.sensorId || targetSlot.slotNumber}: ${newDistance} cm (${newStatus})`,
            type: isOccupied ? 'info' : 'success',
            read: false,
            areaId: area.id,
          };
          setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
        }

        return {
          ...area,
          slots: updatedSlots,
          occupiedSlots: newOccupied,
          availableSlots: newAvailable,
          status: newAreaStatus,
          lastUpdated: new Date().toISOString(),
          device: {
            ...area.device,
            lastHeartbeat: new Date().toISOString(),
          },
        };
      });
    });
  }, []);

  // Toggle Gate servo
  const toggleGate = useCallback((areaId: string, gateId: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        const updatedGates = area.gates.map((g) => {
          if (g.id !== gateId) return g;
          const nextStatus: GateStatus = g.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
          return {
            ...g,
            status: nextStatus,
            servoAngle: nextStatus === 'OPEN' ? 90 : 0,
            lastToggled: new Date().toISOString(),
          };
        });
        return {
          ...area,
          gates: updatedGates,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Random simulation trigger (predominantly simulates SIMULATED areas as per instructions)
  const triggerRandomEvent = useCallback(() => {
    setAreas((currentAreas) => {
      // Pick simulated areas predominantly
      const simulatedAreas = currentAreas.filter((a) => a.dataSource === 'SIMULATED');
      const targetArea = simulatedAreas[Math.floor(Math.random() * simulatedAreas.length)];
      if (!targetArea || targetArea.slots.length === 0) return currentAreas;

      const randomSlot = targetArea.slots[Math.floor(Math.random() * targetArea.slots.length)];
      if (!randomSlot) return currentAreas;

      // Use toggleSlot logic for consistency
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

  // Notification management
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const resetAllData = useCallback(() => {
    setAreas(INITIAL_PARKING_AREAS);
    setActivities(INITIAL_ACTIVITIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLastSimEventMessage('Data direset ke nilai awal.');
  }, []);

  // Compute campus-wide statistics
  const stats = useMemo(() => {
    const totalAreas = areas.length;
    const totalSlots = areas.reduce((acc, a) => acc + a.totalCapacity, 0);
    const totalOccupied = areas.reduce((acc, a) => acc + a.occupiedSlots, 0);
    const totalAvailable = areas.reduce((acc, a) => acc + a.availableSlots, 0);
    const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;
    const onlineDevicesCount = areas.filter((a) => a.device.status === 'ONLINE').length;

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
        setSearchQuery,
        setSimulationActive,
        setSimulationIntervalMs,
        toggleSlot,
        toggleGate,
        triggerRandomEvent,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetAllData,
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

