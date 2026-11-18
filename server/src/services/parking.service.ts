import { SlotPayload, GateStatusPayload, SlotStatus, GateStatus } from '../types/index.js';
import { databaseService } from './database.service.js';
import { realtimeService } from './realtime.service.js';

class ParkingService {
  private simulationActive: boolean = false;
  private simInterval: NodeJS.Timeout | null = null;

  public async handleSlotUpdate(areaId: string, payload: SlotPayload) {
    const timestampStr = payload.timestamp || new Date().toISOString();

    console.log(`[ParkingService] Slot Update: Area=${areaId}, Slot=${payload.slot_id}, Status=${payload.status}, Dist=${payload.distance_cm ?? '-'}cm`);

    // 1. Simpan ke database Supabase
    const updatedSlot = await databaseService.updateSlotStatus(
      areaId,
      payload.slot_id,
      payload.status,
      payload.distance_cm
    );

    // 2. Broadcast ke frontend via Socket.IO
    realtimeService.broadcastSlotUpdated({
      areaId,
      slotId: updatedSlot?.id || payload.slot_id,
      slotNumber: updatedSlot?.slot_number || payload.slot_id,
      status: payload.status,
      distance_cm: payload.distance_cm,
      timestamp: timestampStr,
    });
  }

  public async handleGateStatusUpdate(areaId: string, payload: GateStatusPayload) {
    const timestampStr = payload.timestamp || new Date().toISOString();
    const servoAngle = payload.servo_angle ?? (payload.status === 'OPEN' ? 90 : 0);

    console.log(`[ParkingService] Gate Status Confirmed: Area=${areaId}, Gate=${payload.gate_id}, Status=${payload.status}, Angle=${servoAngle}°`);

    // Simpan ke Supabase setelah ada konfirmasi aktual dari ESP32
    await databaseService.updateGateStatus(areaId, payload.gate_id, payload.status, servoAngle);

    // Broadcast ke frontend
    realtimeService.broadcastGateStatusUpdated({
      areaId,
      gateId: payload.gate_id,
      status: payload.status,
      servoAngle,
      timestamp: timestampStr,
    });
  }

  // Simulasi untuk fakultas tanpa hardware fisik (Teknik, FEB, FISIP berlabel SIMULATED)
  public setSimulationActive(active: boolean, intervalMs: number = 8000) {
    this.simulationActive = active;
    if (this.simInterval) clearInterval(this.simInterval);

    if (active) {
      console.log(`[ParkingService] Background simulation started for SIMULATED areas (interval: ${intervalMs}ms)`);
      this.simInterval = setInterval(async () => {
        await this.triggerSimulatedEvent();
      }, intervalMs);
    } else {
      console.log('[ParkingService] Background simulation stopped.');
    }
  }

  public isSimulationActive(): boolean {
    return this.simulationActive;
  }

  public async triggerSimulatedEvent(): Promise<string | null> {
    const simAreas = ['teknik-main', 'feb-main', 'fisip-main'];
    const chosenArea = simAreas[Math.floor(Math.random() * simAreas.length)];
    
    // Pick a slot number B1-B10, C1-C10, D1-D10
    const prefix = chosenArea === 'teknik-main' ? 'B' : (chosenArea === 'feb-main' ? 'C' : 'D');
    const slotNum = `${prefix}${Math.floor(1 + Math.random() * 10)}`;
    const newStatus: SlotStatus = Math.random() > 0.5 ? 'OCCUPIED' : 'AVAILABLE';

    await this.handleSlotUpdate(chosenArea, {
      slot_id: slotNum,
      status: newStatus,
      distance_cm: newStatus === 'OCCUPIED' ? Math.round(15 + Math.random() * 30) : 180,
      timestamp: new Date().toISOString(),
    });

    return `Simulasi: Slot ${slotNum} di ${chosenArea} berubah menjadi ${newStatus}`;
  }
}

export const parkingService = new ParkingService();
