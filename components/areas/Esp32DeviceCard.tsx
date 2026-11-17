'use client';

import React from 'react';
import { IotDeviceInfo } from '@/lib/types';
import {
  Cpu,
  Wifi,
  Activity,
  Radio,
  Server,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TimeAgo } from '@/components/common/TimeAgo';

interface Esp32DeviceCardProps {
  device: IotDeviceInfo;
  isRealDevice: boolean;
}

export function Esp32DeviceCard({ device, isRealDevice }: Esp32DeviceCardProps) {
  const isOnline = device.status === 'ONLINE';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{device.name}</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isRealDevice
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {isRealDevice ? 'LIVE HARDWARE' : 'SIMULATED NODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {device.id} • Model: {device.model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isOnline ? 'ONLINE (Aktif)' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Grid of Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 text-[11px] block">IP & MAC Address</span>
          <span className="font-mono font-semibold text-slate-900 block mt-1 truncate">
            {device.ipAddress}
          </span>
          <span className="font-mono text-[10px] text-slate-500 block truncate">
            {device.macAddress}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 text-[11px] block flex items-center gap-1">
            <Wifi className="w-3 h-3 text-blue-600" /> Sinyal Wi-Fi (RSSI)
          </span>
          <span className="font-mono font-bold text-slate-900 block mt-1">
            {device.rssi} dBm
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Sangat Kuat (-50 to -65 dBm)</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 text-[11px] block flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-blue-600" /> Firmware
          </span>
          <span className="font-mono font-bold text-slate-900 block mt-1">
            {device.firmwareVersion}
          </span>
          <span className="text-[10px] text-slate-500">Free Heap: 184 KB</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-400 text-[11px] block flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> Uptime Perangkat
          </span>
          <span className="font-mono font-bold text-slate-900 block mt-1">
            {Math.floor(device.uptimeSeconds / 3600)} Jam {Math.floor((device.uptimeSeconds % 3600) / 60)} Mnt
          </span>
          <span className="text-[10px] text-slate-500">0 Reboot terkini</span>
        </div>
      </div>

      {/* MQTT Topic and Architecture details */}
      <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-blue-600" /> MQTT Pub/Sub:
          </span>
          <code className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-blue-700 font-semibold">
            {device.mqttTopic}
          </code>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Heartbeat terkini: <TimeAgo date={device.lastHeartbeat} fallback="Baru saja" /></span>
        </div>
      </div>
    </div>
  );
}

