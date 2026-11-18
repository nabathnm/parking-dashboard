import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env dan .env.local dari root atau folder server
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to local .env

// Helper untuk membersihkan hostname jika user menyertakan protocol (https://, port, /api/v5)
export function sanitizeMqttHost(host: string): string {
  if (!host) return '';
  let clean = host.trim();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^mqtts?:\/\//i, '');
  clean = clean.replace(/\/.*$/, '');      // hapus trailing path /api/v5
  clean = clean.replace(/:[0-9]+$/, '');   // hapus port :8443 jika ada
  return clean;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // EMQX Cloud MQTT Broker
  MQTT_HOST: z.string().default('').transform(sanitizeMqttHost),
  MQTT_PORT: z.coerce.number().default(8883),
  MQTT_USERNAME: z.string().default(''),
  MQTT_PASSWORD: z.string().default(''),
  MQTT_CLIENT_ID: z.string().default('smartcampus-backend-server'),
  
  // Supabase PostgreSQL
  SUPABASE_URL: z.string().default('https://hcrwbttkqxipkbpojzcq.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  
  // Frontend URL
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);

export const isMqttConfigured = Boolean(
  env.MQTT_HOST && env.MQTT_HOST.trim().length > 0 &&
  env.MQTT_USERNAME && env.MQTT_USERNAME.trim().length > 0
);

export const isSupabaseConfigured = Boolean(
  env.SUPABASE_URL && env.SUPABASE_URL.trim().length > 0 &&
  env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 0
);
