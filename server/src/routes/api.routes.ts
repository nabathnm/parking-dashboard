import { Router } from 'express';
import { ParkingController } from '../controllers/parking.controller.js';

export const apiRouter = Router();

// 1. Health & Connection Status
apiRouter.get('/status', ParkingController.getSystemStatus);

// 2. Parking Areas & Data
apiRouter.get('/areas', ParkingController.getAreas);

// 3. Gate Control (Two-Way Communication via MQTT & Simulation)
apiRouter.post('/gates/:areaId/command', ParkingController.sendGateCommand);
apiRouter.post('/gates/:areaId/notes', ParkingController.updateGateNotes);

// 4. Area Notes
apiRouter.post('/areas/:areaId/notes', ParkingController.updateAreaNotes);

// 5. Slot Status Override
apiRouter.post('/slots/:areaId/:slotId/override', ParkingController.overrideSlot);

// 6. Simulation Engine for SIMULATED faculties
apiRouter.post('/simulation/toggle', ParkingController.toggleSimulation);
apiRouter.post('/simulation/trigger', ParkingController.triggerSimulationEvent);

// 7. Activity History & Notifications
apiRouter.get('/activities', ParkingController.getActivities);
apiRouter.get('/notifications', ParkingController.getNotifications);
