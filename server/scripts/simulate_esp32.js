"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = __importDefault(require("mqtt"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
dotenv_1.default.config();
const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = Number(process.env.MQTT_PORT) || 8883;
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const isTls = MQTT_PORT === 8883;
const protocol = isTls ? 'mqtts' : 'mqtt';
const brokerUrl = `${protocol}://${MQTT_HOST}:${MQTT_PORT}`;
console.log('================================================================');
console.log('  ESP32 PHYSICAL HARDWARE SIMULATOR (FILKOM NODE-01)');
console.log(`  Target Broker: ${brokerUrl}`);
console.log('================================================================');
if (!process.env.MQTT_HOST) {
    console.warn('[Warning] MQTT_HOST is not set in .env. Simulator will attempt to connect to localhost:1883 or exit.');
}
const options = {
    clientId: `ESP32-FILKOM-SIM-${Math.random().toString(16).substring(2, 6)}`,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clean: true,
    reconnectPeriod: 4000,
    rejectUnauthorized: false,
    will: {
        topic: 'campus/parking/filkom/node/status',
        payload: Buffer.from(JSON.stringify({
            device_id: 'ESP32-FILKOM-01',
            status: 'OFFLINE',
            reason: 'LWT_SIMULATOR_DISCONNECT',
            timestamp: new Date().toISOString(),
        })),
        qos: 1,
        retain: true,
    },
};
const client = mqtt_1.default.connect(brokerUrl, options);
client.on('connect', () => {
    console.log('[ESP32 Simulator] [OK] Connected to EMQX Cloud!');
    // 1. Publish Heartbeat / Node Status (ONLINE)
    publishNodeStatus('ONLINE');
    // 2. Subscribe ke Gate Command (Two-way communication)
    const cmdTopic = 'campus/parking/filkom/gate/+/command';
    client.subscribe(cmdTopic, { qos: 1 }, (err) => {
        if (!err)
            console.log(`[ESP32 Simulator] [OK] Subscribed to Gate Commands: ${cmdTopic}`);
    });
    // 3. Publish Status Awal Slot A1 dan A2
    publishSlotStatus('A1', 'AVAILABLE', 185);
    publishSlotStatus('A2', 'OCCUPIED', 9.2);
    // 4. Heartbeat berkala setiap 20 detik
    setInterval(() => {
        publishNodeStatus('ONLINE');
    }, 20000);
    // 5. Interaksi simulasi berkala untuk pengujian
    startPeriodicSlotSimulation();
});
client.on('message', (topic, message) => {
    console.log(`[ESP32 Simulator] Received Command on topic [${topic}]:`, message.toString());
    try {
        const payload = JSON.parse(message.toString());
        if (payload.command) {
            console.log(`[ESP32 Simulator] Actuator Processing: Rotating Servo to ${payload.target_angle ?? (payload.command === 'OPEN' ? 90 : 0)}°...`);
            // Simulasikan delay fisik servo berputar (800ms)
            setTimeout(() => {
                const parts = topic.split('/');
                const gateId = parts[4] || 'gate-filkom';
                const confirmedStatus = payload.command;
                const confirmedAngle = payload.target_angle ?? (confirmedStatus === 'OPEN' ? 90 : 0);
                const statusTopic = `campus/parking/filkom/gate/${gateId}/status`;
                const statusPayload = JSON.stringify({
                    gate_id: gateId,
                    status: confirmedStatus,
                    servo_angle: confirmedAngle,
                    safety_sensor: 'CLEAR',
                    timestamp: new Date().toISOString(),
                });
                client.publish(statusTopic, statusPayload, { qos: 1, retain: true });
                console.log(`[ESP32 Simulator] [CONFIRMED] Gate status sent back to EMQX -> ${statusTopic}:`, statusPayload);
            }, 800);
        }
    }
    catch (err) {
        console.error('[ESP32 Simulator] Error processing command:', err.message);
    }
});
client.on('error', (err) => {
    console.error('[ESP32 Simulator] Connection Error:', err.message);
});
function publishNodeStatus(status) {
    const topic = 'campus/parking/filkom/node/status';
    const payload = JSON.stringify({
        device_id: 'ESP32-FILKOM-01',
        status,
        rssi: -52 + Math.floor(Math.random() * 8),
        uptime_seconds: Math.floor(process.uptime()),
        ip_address: '192.168.1.108',
        mac_address: '24:6F:28:B4:9C:12',
        timestamp: new Date().toISOString(),
    });
    client.publish(topic, payload, { qos: 1, retain: true });
    console.log(`[ESP32 Simulator] Node Heartbeat published: ${status}`);
}
function publishSlotStatus(slotId, status, distanceCm) {
    const topic = `campus/parking/filkom/slots/${slotId}`;
    const payload = JSON.stringify({
        slot_id: slotId,
        status,
        distance_cm: distanceCm,
        timestamp: new Date().toISOString(),
    });
    client.publish(topic, payload, { qos: 1, retain: true });
    console.log(`[ESP32 Simulator] Slot ${slotId} published -> ${status} (${distanceCm}cm)`);
}
function startPeriodicSlotSimulation() {
    let toggleState = false;
    setInterval(() => {
        toggleState = !toggleState;
        const targetSlot = toggleState ? 'A1' : 'A2';
        const status = toggleState ? 'OCCUPIED' : 'AVAILABLE';
        const dist = status === 'OCCUPIED' ? 8.4 : 192.0;
        console.log(`\n--- [Simulator Event: Kendaraan ${status === 'OCCUPIED' ? 'Masuk' : 'Keluar'} di Slot ${targetSlot}] ---`);
        publishSlotStatus(targetSlot, status, dist);
    }, 15000);
}
