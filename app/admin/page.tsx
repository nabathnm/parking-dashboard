'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useParking } from '@/context/ParkingContext';
import { ParkingSlotItem } from '@/components/areas/ParkingSlotItem';
import { GateStatusCard } from '@/components/areas/GateStatusCard';
import { Esp32DeviceCard } from '@/components/areas/Esp32DeviceCard';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { ParkingHistoryTable } from '@/components/history/ParkingHistoryTable';
import { CampusParkingMap } from '@/components/map/CampusParkingMap';
import { ConnectionStatusBar } from '@/components/common/ConnectionStatusBar';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import {
  ShieldCheck,
  Cpu,
  Car,
  RefreshCw,
  Play,
  Pause,
  Shuffle,
  RotateCcw,
  SlidersHorizontal,
  History,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sliders,
  MapPin,
  Layers,
} from 'lucide-react';

function AdminContent() {
  const {
    areas,
    stats,
    toggleSlot,
    toggleGate,
    updateGateNotes,
  } = useParking();

  // Active selected area for inspection & modification (4 areas total)
  const [selectedAreaId, setSelectedAreaId] = useState<string>('filkom-main');
  const [activeTab, setActiveTab] = useState<'slots' | 'map' | 'iot' | 'history'>('slots');

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || areas[0];

  // Helper for batch simulation in selected area
  const handleSimulateIn = () => {
    const availableSlot = selectedArea.slots.find((s) => s.status === 'AVAILABLE');
    if (availableSlot) {
      toggleSlot(selectedArea.id, availableSlot.id);
    }
  };

  const handleSimulateOut = () => {
    const occupiedSlot = selectedArea.slots.find((s) => s.status === 'OCCUPIED');
    if (occupiedSlot) {
      toggleSlot(selectedArea.id, occupiedSlot.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime IoT & Database Connection Status Bar */}
      <ConnectionStatusBar />

      {/* Admin Top Header Banner (Consistent Blue Palette) */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl border border-blue-800 p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                Panel Admin & Operator IoT (4 Area Kampus)
              </span>
              <span className="text-xs text-blue-300 font-mono">
                Total {stats.totalSlots} Slot Terkendali
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Pusat Kendali 4 Area Parkir & Perangkat IoT
            </h1>
            <p className="text-xs text-blue-200 max-w-2xl">
              Kendalikan status 2 sensor fisik FILKOM & slot simulasi fakultas lain, operasikan gerbang barrier gate, jalankan simulasi pergerakan kendaraan, dan pantau ESP32.
            </p>
          </div>
        </div>

      </div>

      {/* Admin Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('slots')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'slots'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-blue-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Kendali Slot & Gerbang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-blue-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Riwayat & Ekspor CSV</span>
        </button>
      </div>

      {/* TAB 1: KENDALI 10 SLOT & GERBANG */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {/* Faculty Selector (4 Areas) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Pilih Dari 4 Area Parkir untuk Dikendalikan:
              </span>
              <span className="text-xs text-blue-700 font-semibold hidden sm:inline">
                Klik kartu slot untuk langsung mengubah status (Kosong ⇄ Terisi)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {areas.map((area) => {
                const isSelected = area.id === selectedArea.id;
                const avail = area.slots.filter((s) => s.status === 'AVAILABLE').length;
                const total = area.slots.length;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                        : 'bg-slate-50 hover:bg-blue-50/50 text-slate-800 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {area.facultyName.replace('Fakultas ', '')}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {avail}/{total} Kosong
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {area.notes || area.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Area Management Board */}
          <div
            id={`area-${selectedArea.id}`}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedArea.facultyName}
                  </h2>
                  <DataSourceBadge
                    source={selectedArea.dataSource === 'REAL' ? 'REAL DEVICE' : 'SIMULATED'}
                    size="sm"
                  />
                  <ParkingStatusBadge status={selectedArea.status} size="sm" />
                </div>
                <p className="text-xs text-blue-700 font-medium mt-0.5">
                  {selectedArea.notes || selectedArea.description} • Kapasitas: {selectedArea.slots.length} Slot
                </p>
              </div>

              {/* Quick Batch Simulation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateIn}
                  disabled={selectedArea.slots.filter((s) => s.status === 'AVAILABLE').length === 0}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  title="Simulasikan 1 mobil masuk mengisi slot kosong"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>+ Mobil Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateOut}
                  disabled={selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  title="Simulasikan 1 mobil keluar mengosongkan slot terisi"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>- Mobil Keluar</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE CLICKABLE SLOTS */}
            <div>
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-xs font-bold text-slate-800">
                  Daftar Slot Parkir ({selectedArea.slots.length} Slot) — Klik slot untuk mengubah status:
                </span>
                <span className="text-xs text-blue-600 font-semibold">
                  {selectedArea.slots.filter((s) => s.status === 'AVAILABLE').length} Kosong •{' '}
                  {selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length} Terisi
                </span>
              </div>

              <div
                className={
                  selectedArea.slots.length <= 4
                    ? 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl gap-3.5'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5'
                }
              >
                {selectedArea.slots.map((slot) => (
                  <ParkingSlotItem
                    key={slot.id}
                    slot={slot}
                    areaId={selectedArea.id}
                    onToggle={toggleSlot}
                    isRealDevice={selectedArea.id === 'filkom-main'}
                    readOnly={false}
                  />
                ))}
              </div>
            </div>

            {/* Barrier Gate Control Card (1 Portal) */}
            <div className="pt-3 border-t border-slate-100">
              <GateStatusCard
                gate={selectedArea.gate}
                areaId={selectedArea.id}
                onToggleGate={toggleGate}
                onUpdateNotes={updateGateNotes}
                readOnly={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOG RIWAYAT & EKSPOR CSV */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Log Aktivitas Masuk/Keluar (4 Area Fakultas)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat lengkap pergerakan kendaraan yang dicatat oleh sistem IoT. Anda dapat menyaring data dan mengunduh berkas CSV.
            </p>
          </div>

          <ParkingHistoryTable />
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardLayout>
      <AdminContent />
    </DashboardLayout>
  );
}
