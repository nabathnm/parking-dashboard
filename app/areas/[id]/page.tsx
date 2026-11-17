'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useParking } from '@/context/ParkingContext';
import { ParkingSlotItem } from '@/components/areas/ParkingSlotItem';
import { GateStatusCard } from '@/components/areas/GateStatusCard';
import { Esp32DeviceCard } from '@/components/areas/Esp32DeviceCard';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import {
  ArrowLeft,
  SquareParking,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Car,
  RefreshCw,
  History,
} from 'lucide-react';
import { TimeAgo } from '@/components/common/TimeAgo';

function AreaDetailInner() {
  const params = useParams();
  const areaId = (params?.id as string) || 'fasilkom-main';

  const { areas, activities, toggleSlot, toggleGate } = useParking();
  const area = areas.find((a) => a.id === areaId);

  if (!area) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <SquareParking className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Area Parkir Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">
          Area parkir dengan ID &quot;{areaId}&quot; tidak terdaftar di sistem.
        </p>
        <Link
          href="/areas"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Area
        </Link>
      </div>
    );
  }

  // Activities related to this area
  const areaActivities = activities.filter((act) => act.areaId === area.id).slice(0, 8);

  // Quick simulation helper
  const handleSimulateIn = () => {
    const availableSlot = area.slots.find((s) => s.status === 'AVAILABLE');
    if (availableSlot) {
      toggleSlot(area.id, availableSlot.id);
    }
  };

  const handleSimulateOut = () => {
    const occupiedSlot = area.slots.find((s) => s.status === 'OCCUPIED');
    if (occupiedSlot) {
      toggleSlot(area.id, occupiedSlot.id);
    }
  };

  const occupancyRate = Math.round(
    (area.occupiedSlots / area.totalCapacity) * 100
  );

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <Link
            href="/areas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Area
          </Link>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {area.facultyName}
            </h1>
            <DataSourceBadge source={area.dataSource} />
            <ParkingStatusBadge status={area.status} />
          </div>

          <p className="text-xs text-slate-500">
            {area.code} • {area.areaName}
          </p>
        </div>

        {/* Demo Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateIn}
            disabled={area.availableSlots === 0}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
            title="Simulasikan mobil masuk mengisi slot kosong pertama"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Simulasi Kendaraan Masuk</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateOut}
            disabled={area.occupiedSlots === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
            title="Simulasikan mobil keluar mengosongkan slot terisi"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulasi Kendaraan Keluar</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview for this Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Kapasitas</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{area.totalCapacity}</span>
            <span className="text-xs text-slate-400">Slot</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Daya tampung area</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Slot Tersedia
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{area.availableSlots}</span>
            <span className="text-xs text-emerald-700 font-medium">Slot</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">Siap untuk digunakan</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Slot Terisi
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{area.occupiedSlots}</span>
            <span className="text-xs text-rose-700 font-medium">Kendaraan</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-2 font-medium">Okupansi {occupancyRate}%</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 text-blue-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            Status IoT Gateway
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {area.device.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate font-mono">
            RSSI: {area.device.rssi} dBm
          </p>
        </div>
      </div>

      {/* Real Device Special Banner for Fasilkom */}
      {area.dataSource === 'REAL DEVICE' && (
        <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-blue-900 text-sm">
                Live Demonstrasi Sensor IoT Fasilkom (4-Sensor Grid)
              </p>
              <p className="text-blue-700 mt-0.5">
                Setiap slot terhubung langsung ke sensor ultrasonik HC-SR04 dengan pembacaan jarak presisi. Klik kartu slot di bawah untuk menguji perubahan status secara instan!
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto">
            PIN HC-SR04: Trig 5, Echo 18,19,21,22
          </span>
        </div>
      )}

      {/* PARKING SLOT VISUALIZATION GRID */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SquareParking className="w-4 h-4 text-blue-600" />
              Denah & Grid Visualisasi Slot Parkir
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Representasi tata letak fisik tempat parkir. Klik pada slot mana saja untuk menyimulasikan kendaraan.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Tersedia (Kosong)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Terisi (Mobil)
            </span>
          </div>
        </div>

        {/* Slot Grid Container */}
        <div
          className={`grid gap-4 ${
            area.totalCapacity <= 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
          }`}
        >
          {area.slots.map((slot) => (
            <ParkingSlotItem
              key={slot.id}
              slot={slot}
              areaId={area.id}
              onToggle={toggleSlot}
              isRealDevice={area.dataSource === 'REAL DEVICE'}
            />
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Ambang batas deteksi ultrasonik: &lt; 50 cm = Terisi, &gt; 100 cm = Kosong</span>
          <span>Update sinkronisasi: Realtime</span>
        </div>
      </div>

      {/* 2 Column: Gate Barrier Control + Hardware Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GateStatusCard
          gates={area.gates}
          areaId={area.id}
          onToggleGate={toggleGate}
        />
        <Esp32DeviceCard
          device={area.device}
          isRealDevice={area.dataSource === 'REAL DEVICE'}
        />
      </div>

      {/* Recent Area Activity Log */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Log Aktivitas Terkini Area Ini
          </h3>
          <Link
            href="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Lihat Riwayat Lengkap →
          </Link>
        </div>

        <div className="mt-3 divide-y divide-slate-100 text-xs">
          {areaActivities.length === 0 ? (
            <p className="py-4 text-slate-400 text-center">
              Belum ada pergerakan kendaraan yang dicatat pada area ini.
            </p>
          ) : (
            areaActivities.map((act) => (
              <div
                key={act.id}
                className="py-2.5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      act.activity === 'IN'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {act.activity === 'IN' ? 'IN' : 'OUT'}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Slot {act.slotId} — Kendaraan{' '}
                      {act.activity === 'IN' ? 'Masuk' : 'Keluar'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {act.vehiclePlate || 'B 1000 UN'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-medium text-slate-600">
                    <TimeAgo date={act.timestamp} fallback="Baru saja" />
                  </span>
                  {act.durationMinutes && (
                    <p className="text-[10px] text-slate-400">
                      Durasi: {act.durationMinutes} mnt
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ParkingAreaDetailPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-400">
            Memuat data detail area parkir...
          </div>
        }
      >
        <AreaDetailInner />
      </Suspense>
    </DashboardLayout>
  );
}
