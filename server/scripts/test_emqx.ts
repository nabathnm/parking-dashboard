import mqtt from 'mqtt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

function sanitizeMqttHost(host: string): string {
  if (!host) return '';
  let clean = host.trim();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^mqtts?:\/\//i, '');
  clean = clean.replace(/\/.*$/, '');
  clean = clean.replace(/:[0-9]+$/, '');
  return clean;
}

const host = sanitizeMqttHost(process.env.MQTT_HOST || '');
const port = Number(process.env.MQTT_PORT) || 8883;
const username = process.env.MQTT_USERNAME || '';
const password = process.env.MQTT_PASSWORD || '';
const isTls = port === 8883;
const brokerUrl = `${isTls ? 'mqtts' : 'mqtt'}://${host}:${port}`;

console.log('Testing EMQX MQTT Connection...');
console.log(`Broker URL: ${brokerUrl}`);
console.log(`Username  : ${username}`);
console.log(`Password  : ${'*'.repeat(password.length)}`);
console.log(`Port      : ${port} (TLS: ${isTls})`);

const client = mqtt.connect(brokerUrl, {
  clientId: `test-client-${Math.random().toString(16).substring(2, 8)}`,
  username,
  password,
  connectTimeout: 8000,
  rejectUnauthorized: false,
});

const timeout = setTimeout(() => {
  console.error('\n[TIMEOUT] Connection took longer than 8 seconds. Please check host, port, or internet/firewall.');
  client.end(true);
  process.exit(1);
}, 8000);

client.on('connect', () => {
  clearTimeout(timeout);
  console.log('\n========================================');
  console.log('  SUCCESS! Connected to EMQX Cloud Broker!');
  console.log('========================================');

  // Test publish & subscribe
  const testTopic = 'campus/parking/test/ping';
  client.subscribe(testTopic, () => {
    console.log(`Subscribed to test topic: ${testTopic}`);
    client.publish(testTopic, JSON.stringify({ message: 'Hello from SmartCampus test script', time: new Date().toISOString() }));
  });
});

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}:`, message.toString());
  console.log('Verification completed successfully! Disconnecting...');
  client.end(true);
  process.exit(0);
});

client.on('error', (err) => {
  clearTimeout(timeout);
  console.error('\n[ERROR] Connection failed:', err.message);
  client.end(true);
  process.exit(1);
});
