'use client';

import React from 'react';
import Link from 'next/link';
import { useParking } from '@/context/ParkingContext';
import {
  Cpu,
  Wifi,
  Activity,
  Radio,
  ExternalLink,
  ShieldCheck,
  Server,
  ToggleLeft,
  ToggleRight,
  DoorClosed,
  DoorOpen,
} from 'lucide-react';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { TimeAgo } from '@/components/common/TimeAgo';

export function IotDeviceSummary() {
  const { areas, toggleGate } = useParking();
  const fasilkomArea = areas.find((a) => a.id === 'fasilkom-main');

  if (!fasilkomArea) return null;

  const device = fasilkomArea.device;
  const gates = fasilkomArea.gates;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600 text-white shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{device.name}</h2>
              <DataSourceBadge source="REAL DEVICE" size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              ID: {device.id} • Model: {device.model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE (Latensi 18ms)
          </span>

          <Link
            href={`/areas/${fasilkomArea.id}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Buka Halaman Detail ESP32"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid of hardware parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
          <span className="text-slate-400 block text-[11px]">IP & MAC Address</span>
          <span className="font-mono font-semibold text-slate-800 text-[11px] block mt-1 truncate">
            {device.ipAddress}
          </span>
          <span className="font-mono text-[10px] text-slate-500 truncate block">
            {device.macAddress}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Wifi className="w-3 h-3 text-blue-600" /> Sinyal Wi-Fi (RSSI)
          </span>
          <span className="font-mono font-bold text-slate-800 text-xs block mt-1">
            {device.rssi} dBm
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Sinyal Sangat Baik</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" /> Sensor Terhubung
          </span>
          <span className="font-bold text-slate-800 text-xs block mt-1">
            4x HC-SR04
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Ultrasonik Active</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Radio className="w-3 h-3 text-blue-600" /> MQTT Topic Prefix
          </span>
          <span className="font-mono font-semibold text-slate-800 text-[10px] block mt-1 truncate">
            smartcampus/fasilkom/#
          </span>
          <span className="text-[10px] text-slate-500 font-mono">QoS 1 • Ping OK</span>
        </div>
      </div>

      {/* Live Gates Status */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Status Gerbang Barrier:</span>
          {gates.map((gate) => {
            const isOpen = gate.status === 'OPEN';
            return (
              <div
                key={gate.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50"
              >
                {isOpen ? (
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <DoorClosed className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className="font-medium text-slate-700">
                  {gate.type === 'ENTRY' ? 'Masuk' : 'Keluar'}:
                </span>
                <span
                  className={`font-bold ${
                    isOpen ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  {gate.status}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGate(fasilkomArea.id, gate.id)}
                  className="ml-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Ubah
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Heartbeat terakhir: <TimeAgo date={device.lastHeartbeat} fallback="Baru saja" /></span>
        </div>
      </div>
    </div>
  );
}

