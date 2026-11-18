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
import {
  ArrowLeft,
  SquareParking,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Eye,
  History,
  Lock,
} from 'lucide-react';
import { TimeAgo } from '@/components/common/TimeAgo';

function AreaDetailInner() {
  const params = useParams();
  const areaId = (params?.id as string) || 'filkom-main';

  const { areas, activities } = useParking();
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
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ketersediaan
        </Link>
      </div>
    );
  }

  // Activities related to this area
  const areaActivities = activities.filter((act) => act.areaId === area.id).slice(0, 8);

  const totalCapacity = area.slots.length;
  const occupiedSlots = area.slots.filter((s) => s.status === 'OCCUPIED').length;
  const availableSlots = area.slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((occupiedSlots / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Ketersediaan
          </Link>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {area.facultyName}
            </h1>
            <ParkingStatusBadge status={area.status} />
          </div>

          {area.notes ? (
            <p className="text-xs text-blue-700 font-medium">
              {area.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {area.description}
            </p>
          )}
        </div>

        {/* Read-Only Status Badge */}
        <div className="flex items-center">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Mode Mahasiswa (Hanya Baca)</span>
          </span>
        </div>
      </div>

      {/* 4 Stat Overview for this Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Kapasitas</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCapacity}</span>
            <span className="text-xs text-slate-400">Slot</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Daya tampung area parkir</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Slot Kosong
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{availableSlots}</span>
            <span className="text-xs text-emerald-700 font-medium">Slot</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">Siap untuk digunakan</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold flex items-center gap-1 text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Slot Terisi
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{occupiedSlots}</span>
            <span className="text-xs text-rose-700 font-medium">Kendaraan</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-2 font-medium">Okupansi {occupancyRate}%</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold flex items-center gap-1 text-blue-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            Status Node IoT
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


      {/* PORTAL GATE STATUS CARD (1 Portal Barrier) */}
      <GateStatusCard
        gate={area.gate}
        areaId={area.id}
        readOnly={true}
      />

      {/* READ-ONLY PARKING SLOT VISUALIZATION GRID */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SquareParking className="w-4 h-4 text-blue-600" />
              Denah Visual Slot Parkir (Tampilan Pengguna)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Posisi fisik slot parkir di area {area.facultyName}. Slot hijau menunjukkan tempat parkir yang sedang kosong.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Kosong (Tersedia)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Terisi Mobil
            </span>
          </div>
        </div>

        {/* Slot Grid Container (Read-Only) */}
        <div
          className={`grid gap-4 ${
            totalCapacity <= 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
              : totalCapacity <= 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
          }`}
        >
          {area.slots.map((slot) => (
            <ParkingSlotItem
              key={slot.id}
              slot={slot}
              areaId={area.id}
              isRealDevice={area.id === 'filkom-main'}
              readOnly={true}
            />
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Sensor ultrasonik mendeteksi keberadaan mobil berdasarkan pantulan gelombang (&lt;50 cm = terisi).</span>
          <span className="font-medium text-slate-500">Mode: Read-Only</span>
        </div>
      </div>

      {/* Recent Area Activity Log */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Riwayat Pergerakan Kendaraan Terkini
          </h3>
          <span className="text-xs text-slate-400">{area.facultyName}</span>
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
                      Slot {act.slotId} — Mobil{' '}
                      {act.activity === 'IN' ? 'Terdeteksi Masuk' : 'Terdeteksi Keluar'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Status Slot: {act.status === 'OCCUPIED' ? 'Terisi' : 'Kosong'}
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

export default function AreaDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat detail area...</div>}>
        <AreaDetailInner />
      </Suspense>
    </DashboardLayout>
  );
}
