'use client';

import React from 'react';
import { useParking } from '@/context/ParkingContext';
import { Radio, Database, Cpu, Clock, Server, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeAgo } from './TimeAgo';

export function ConnectionStatusBar({ className }: { className?: string }) {
  const { connectionState } = useParking();

  const getMqttBadge = () => {
    switch (connectionState.mqtt) {
      case 'CONNECTED':
        return {
          label: 'EMQX MQTT',
          status: 'Connected',
          dotClass: 'bg-emerald-500 animate-pulse',
          bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      case 'CONNECTING':
        return {
          label: 'EMQX MQTT',
          status: 'Connecting...',
          dotClass: 'bg-amber-500 animate-ping',
          bgClass: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      case 'CONFIG_REQUIRED':
        return {
          label: 'EMQX MQTT',
          status: 'Config Belum Diisi',
          dotClass: 'bg-amber-500',
          bgClass: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      default:
        return {
          label: 'EMQX MQTT',
          status: 'Disconnected',
          dotClass: 'bg-rose-500',
          bgClass: 'bg-rose-50 border-rose-200 text-rose-800',
        };
    }
  };

  const getDbBadge = () => {
    switch (connectionState.database) {
      case 'CONNECTED':
        return {
          label: 'Supabase DB',
          status: 'Connected',
          dotClass: 'bg-emerald-500',
          bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      case 'CONNECTING':
        return {
          label: 'Supabase DB',
          status: 'Connecting...',
          dotClass: 'bg-amber-500 animate-ping',
          bgClass: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      default:
        return {
          label: 'Supabase DB',
          status: 'Disconnected',
          dotClass: 'bg-rose-500',
          bgClass: 'bg-rose-50 border-rose-200 text-rose-800',
        };
    }
  };

  const getDeviceBadge = () => {
    if (connectionState.device === 'ONLINE') {
      return {
        label: 'ESP32 FILKOM',
        status: 'Online',
        dotClass: 'bg-emerald-500',
        bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      };
    }
    return {
      label: 'ESP32 FILKOM',
      status: 'Offline',
      dotClass: 'bg-rose-500',
      bgClass: 'bg-rose-50 border-rose-200 text-rose-800',
    };
  };

  const mqtt = getMqttBadge();
  const db = getDbBadge();
  const dev = getDeviceBadge();

  return (
    <div
      className={cn(
        'w-full bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          IoT Telemetri:
        </span>

        {/* 1. EMQX MQTT Status */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all',
            mqtt.bgClass
          )}
          title={`Status Broker EMQX: ${mqtt.status}`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{mqtt.label}:</span>
          <span className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', mqtt.dotClass)} />
            {mqtt.status}
          </span>
        </div>

        {/* 2. Supabase PostgreSQL Database Status */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all',
            db.bgClass
          )}
          title={`Status PostgreSQL Supabase: ${db.status}`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{db.label}:</span>
          <span className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', db.dotClass)} />
            {db.status}
          </span>
        </div>

        {/* 3. ESP32 Physical Device Status */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all',
            dev.bgClass
          )}
          title={`Status Node Hardware ESP32: ${dev.status}`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{dev.label}:</span>
          <span className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', dev.dotClass)} />
            {dev.status}
          </span>
        </div>

        {/* 4. Backend Server Status */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all',
            connectionState.backend === 'CONNECTED'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          )}
          title="Status Node.js Express & Socket.IO Backend"
        >
          <Server className="w-3.5 h-3.5" />
          <span>Backend:</span>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                connectionState.backend === 'CONNECTED' ? 'bg-blue-600' : 'bg-slate-400'
              )}
            />
            {connectionState.backend === 'CONNECTED' ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>

      {/* 5. Last Data Received Timestamp */}
      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] ml-auto">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>Data Terakhir:</span>
        {connectionState.lastDataReceived ? (
          <span className="text-slate-900 font-bold">
            <TimeAgo date={connectionState.lastDataReceived} />
          </span>
        ) : (
          <span className="text-slate-400 italic">Menunggu transmisi...</span>
        )}
      </div>
    </div>
  );
}
