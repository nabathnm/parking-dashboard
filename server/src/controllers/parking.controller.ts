import { Request, Response } from 'express';
import { databaseService } from '../services/database.service.js';
import { mqttService } from '../services/mqtt.service.js';
import { parkingService } from '../services/parking.service.js';
import { realtimeService } from '../services/realtime.service.js';
import { SlotStatus, GateStatus } from '../types/index.js';

export class ParkingController {
  public static async getSystemStatus(req: Request, res: Response) {
    const isDbConnected = await databaseService.testConnection();
    const systemStatus = realtimeService.getSystemStatus();
    
    return res.json({
      success: true,
      data: {
        ...systemStatus,
        database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
        mqtt: mqttService.getStatus(),
        simulationActive: parkingService.isSimulationActive(),
      },
    });
  }

  public static async getAreas(req: Request, res: Response) {
    const areas = await databaseService.getAllAreas();
    return res.json({ success: true, data: areas });
  }

  public static async sendGateCommand(req: Request, res: Response) {
    const areaId = String(req.params.areaId);
    const { command, gateId, requestedBy } = req.body;

    if (!command || !['OPEN', 'CLOSED'].includes(command)) {
      return res.status(400).json({ success: false, message: 'Invalid command. Must be OPEN or CLOSED.' });
    }

    const targetGateId = gateId || `gate-${areaId}`;
    const targetAngle = command === 'OPEN' ? 90 : 0;

    // Cek apakah area fisik (REAL) atau SIMULATED
    const isRealDevice = areaId === 'filkom-main';

    if (isRealDevice) {
      // 1. AREA REAL (FILKOM): Kirim MQTT Command ke ESP32
      // Status TIDAK diubah di DB sekarang, menunggu konfirmasi aktual dari ESP32!
      const published = mqttService.publishGateCommand(areaId, targetGateId, {
        command: command as 'OPEN' | 'CLOSED',
        target_angle: targetAngle,
        requested_by: requestedBy || 'admin',
        timestamp: new Date().toISOString(),
      });

      // Beri sinyal ke frontend bahwa perintah sedang pending
      realtimeService.broadcast('gate_command_pending', {
        areaId,
        gateId: targetGateId,
        command,
        message: 'Perintah terkirim ke ESP32. Menunggu aktuator servo berputar...',
      });

      return res.json({
        success: true,
        message: published
          ? 'Perintah dikirim ke ESP32 via MQTT. Menunggu konfirmasi fisik dari aktuator.'
          : 'MQTT sedang tidak terhubung. Perintah disimpan.',
        pendingConfirmation: true,
      });
    } else {
      // 2. AREA SIMULATED: Langsung simulasikan gerbang terbuka/tertutup
      const updated = await databaseService.updateGateStatus(
        areaId,
        targetGateId,
        command as GateStatus,
        targetAngle
      );

      realtimeService.broadcastGateStatusUpdated({
        areaId,
        gateId: targetGateId,
        status: command,
        servoAngle: targetAngle,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `Gerbang ${areaId} berhasil diubah ke ${command} (Simulasi).`,
        data: updated,
      });
    }
  }

  public static async updateGateNotes(req: Request, res: Response) {
    const areaId = String(req.params.areaId);
    const { notes } = req.body;

    const updated = await databaseService.updateGateNotes(areaId, notes || '');
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update gate notes.' });
    }

    realtimeService.broadcast('gate_notes_updated', {
      areaId,
      notes: notes || '',
    });

    return res.json({ success: true, data: updated });
  }

  public static async updateAreaNotes(req: Request, res: Response) {
    const areaId = String(req.params.areaId);
    const { notes } = req.body;

    const updated = await databaseService.updateAreaNotes(areaId, notes || '');
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update area notes.' });
    }

    realtimeService.broadcast('area_notes_updated', {
      areaId,
      notes: notes || '',
    });

    return res.json({ success: true, data: updated });
  }

  public static async overrideSlot(req: Request, res: Response) {
    const areaId = String(req.params.areaId);
    const slotId = String(req.params.slotId);
    const { status, distance_cm } = req.body;

    if (!['AVAILABLE', 'OCCUPIED', 'UNKNOWN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid slot status.' });
    }

    const updated = await databaseService.updateSlotStatus(
      areaId,
      slotId,
      status as SlotStatus,
      distance_cm
    );

    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update slot status.' });
    }

    realtimeService.broadcastSlotUpdated({
      areaId,
      slotId: updated.id,
      slotNumber: updated.slot_number,
      status: updated.status,
      distance_cm: updated.distance_cm,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, data: updated });
  }

  public static async toggleSimulation(req: Request, res: Response) {
    const { active, intervalMs } = req.body;
    parkingService.setSimulationActive(Boolean(active), intervalMs || 8000);
    return res.json({
      success: true,
      simulationActive: parkingService.isSimulationActive(),
    });
  }

  public static async triggerSimulationEvent(req: Request, res: Response) {
    const result = await parkingService.triggerSimulatedEvent();
    return res.json({ success: true, message: result });
  }

  public static async getActivities(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 50;
    const activities = await databaseService.getActivities(limit);
    return res.json({ success: true, data: activities });
  }

  public static async getNotifications(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 20;
    const notifications = await databaseService.getNotifications(limit);
    return res.json({ success: true, data: notifications });
  }
}
