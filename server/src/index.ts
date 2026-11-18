import express from 'express';
import http from 'http';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/api.routes.js';
import { realtimeService } from './services/realtime.service.js';
import { databaseService } from './services/database.service.js';
import { mqttService } from './services/mqtt.service.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRouter);

// Health check root
app.get('/', (req, res) => {
  res.json({
    name: 'SmartCampus Parking IoT Backend',
    version: '1.0.0',
    architecture: 'ESP32 -> EMQX (MQTT) -> Node.js Backend -> Supabase -> Next.js',
    status: 'Running',
    timestamp: new Date().toISOString(),
  });
});

// Initialize Realtime Socket.IO
realtimeService.init(server, env.FRONTEND_URL);

// Test database connection at startup
databaseService.testConnection().then((connected) => {
  console.log(`[Startup] Supabase Database Status: ${connected ? 'CONNECTED (OK)' : 'DISCONNECTED / CHECK PERMISSIONS'}`);
  realtimeService.updateSystemStatus({
    database: connected ? 'CONNECTED' : 'DISCONNECTED',
  });
});

// Start listening
server.listen(env.PORT, () => {
  console.log('================================================================');
  console.log(`  SmartCampus Parking IoT Backend is running on port ${env.PORT}`);
  console.log(`  Target Architecture: ESP32 -> EMQX -> Backend -> Supabase -> Next.js`);
  console.log(`  MQTT Status: ${mqttService.getStatus()}`);
  console.log(`  REST API URL: http://localhost:${env.PORT}/api`);
  console.log('================================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP and Socket server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
