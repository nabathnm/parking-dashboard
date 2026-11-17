'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useParking } from '@/context/ParkingContext';
import {
  Settings,
  Cpu,
  Radio,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  Server,
  Play,
  Pause,
  Shuffle,
  ShieldCheck,
  Code,
  Copy,
} from 'lucide-react';

function SettingsContent() {
  const {
    simulationActive,
    setSimulationActive,
    simulationIntervalMs,
    setSimulationIntervalMs,
    triggerRandomEvent,
    resetAllData,
  } = useParking();

  const [copied, setCopied] = useState(false);
  const [brokerHost, setBrokerHost] = useState('broker.emqx.io');
  const [brokerPort, setBrokerPort] = useState('1883');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sampleJsonPayload = JSON.stringify(
    {
      device_id: 'ESP32-FASILKOM-NODE-01',
      timestamp: '2026-11-05T03:10:00.000Z',
      sensors: [
        { slot_id: 'A1', distance_cm: 18.4, status: 'OCCUPIED' },
        { slot_id: 'A2', distance_cm: 184.2, status: 'AVAILABLE' },
        { slot_id: 'A3', distance_cm: 21.8, status: 'OCCUPIED' },
        { slot_id: 'A4', distance_cm: 179.6, status: 'AVAILABLE' },
      ],
      gates: [
        { type: 'ENTRY', status: 'CLOSED', servo_angle: 0 },
        { type: 'EXIT', status: 'CLOSED', servo_angle: 0 },
      ],
      rssi: -58,
      uptime_s: 86420,
    },
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard.writeText(sampleJsonPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pengaturan Sistem & Konfigurasi IoT
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola parameter simulasi, skema MQTT untuk perangkat ESP32, dan konfigurasi umum sistem
        </p>
      </div>

      {/* 1. Simulation Engine Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Kontrol Engine Simulasi Mock Data
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengatur pergerakan otomatis status parkir fakultas pada lingkungan prototipe
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              simulationActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {simulationActive ? 'Simulasi Aktif' : 'Simulasi Dijeda'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-800">Status Loop Simulasi:</span>
            <p className="text-xs text-slate-500">
              Secara periodik memperbarui status slot pada area fakultas simulasi (Teknik, FEB, FISIP, Pertanian).
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulationActive(!simulationActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  simulationActive
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {simulationActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{simulationActive ? 'Jeda Simulasi' : 'Jalankan Simulasi'}</span>
              </button>

              <button
                type="button"
                onClick={triggerRandomEvent}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                <span>Picu 1 Event Acak</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-800">Interval Pembaruan Simulasi:</span>
            <p className="text-xs text-slate-500">
              Seberapa sering sistem menyimulasikan kendaraan masuk atau keluar secara otomatis.
            </p>
            <div className="pt-2">
              <select
                value={simulationIntervalMs}
                onChange={(e) => setSimulationIntervalMs(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={3000}>Cepat (Setiap 3 detik)</option>
                <option value={7000}>Normal (Setiap 7 detik - Default)</option>
                <option value={15000}>Sedang (Setiap 15 detik)</option>
                <option value={30000}>Santai (Setiap 30 detik)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={resetAllData}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Data ke Nilai Awal</span>
          </button>
        </div>
      </div>

      {/* 2. ESP32 & MQTT Integration Blueprint */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Arsitektur Integrasi ESP32 & MQTT Broker
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Struktur konfigurasi yang siap disambungkan dengan firmware ESP32 dan backend MQTT
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            READY FOR ESP32
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                MQTT Broker Host
              </label>
              <input
                type="text"
                value={brokerHost}
                onChange={(e) => setBrokerHost(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Port (TCP / WebSocket)
              </label>
              <input
                type="text"
                value={brokerPort}
                onChange={(e) => setBrokerPort(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Prefix Topik MQTT:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Telemetry (Publish):</span>
                <span className="text-blue-700 font-bold text-[11px]">
                  smartcampus/parking/+/telemetry
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Gate Command (Sub):</span>
                <span className="text-blue-700 font-bold text-[11px]">
                  smartcampus/parking/+/gate/set
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Node Heartbeat:</span>
                <span className="text-blue-700 font-bold text-[11px]">
                  smartcampus/parking/+/status
                </span>
              </div>
            </div>
          </div>

          {/* JSON Schema Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-600" />
                Format Payload JSON Telemetri ESP32:
              </label>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin JSON'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
              <pre>{sampleJsonPayload}</pre>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Prototipe beroperasi tanpa ketergantungan koneksi jaringan MQTT eksternal.
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi prototipe berhasil diperbarui!</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
