'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParking } from '@/context/ParkingContext';
import { ParkingArea } from '@/lib/types';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  Eye,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampusParkingMapProps {
  selectedAreaId?: string;
  onSelectArea?: (id: string) => void;
  isAdmin?: boolean;
}

function getShortFacultyName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('komputer') || lower.includes('filkom')) return 'FILKOM';
  if (lower.includes('teknik')) return 'Teknik';
  if (lower.includes('sosial') || lower.includes('fisip')) return 'FISIP';
  if (lower.includes('ekonomi') || lower.includes('feb')) return 'FEB';
  return name.replace('Fakultas ', '');
}

export function CampusParkingMap({
  selectedAreaId: externalSelectedId,
  onSelectArea,
  isAdmin = false,
}: CampusParkingMapProps) {
  const { areas } = useParking();
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    areas[0]?.id || 'filkom-main'
  );

  const selectedId = externalSelectedId || internalSelectedId;
  const selectedArea = areas.find((a) => a.id === selectedId) || areas[0];

  const handleSelect = (id: string) => {
    if (onSelectArea) {
      onSelectArea(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-blue-50/50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Denah Peta Parkir Kampus Terpusat (4 Zona Fakultas)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap area memiliki kapasitas dummy 10 slot. Klik marker pada peta untuk melihat detail slot.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tersedia (&gt;2)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Terbatas (&le;2)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Penuh (0)
          </span>
        </div>
      </div>

      {/* Main Map Container + Quick Inspector Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* SVG Campus Map Canvas (Standby) */}
        <div className="lg:col-span-8 bg-slate-950 relative min-h-[360px] sm:min-h-[440px] flex items-center justify-center select-none overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">

          <svg
            viewBox="0 0 900 520"
            className="w-full h-full object-cover"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="campusGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.6" />
              </pattern>
              <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Base Canvas */}
            <rect width="900" height="520" fill="#0A0F1D" />
            <rect width="900" height="520" fill="url(#campusGrid)" />

            {/* Green parks */}
            <path d="M 80 180 Q 200 120 320 180 T 400 240 Q 280 300 150 280 Z" fill="#064E3B" opacity="0.3" />
            <path d="M 520 280 Q 680 240 820 320 T 640 450 Z" fill="#064E3B" opacity="0.3" />

            {/* Main Campus Ring Roads */}
            <rect x="70" y="55" width="760" height="410" rx="40" fill="none" stroke="#1E293B" strokeWidth="26" />
            <rect x="70" y="55" width="760" height="410" rx="40" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="10 10" />

            {/* Central Avenue Cross Roads */}
            <line x1="70" y1="260" x2="830" y2="260" stroke="#1E293B" strokeWidth="22" strokeLinecap="round" />
            <line x1="70" y1="260" x2="830" y2="260" stroke="#475569" strokeWidth="1.2" strokeDasharray="8 8" />
            <line x1="450" y1="55" x2="450" y2="465" stroke="#1E293B" strokeWidth="22" strokeLinecap="round" />
            <line x1="450" y1="55" x2="450" y2="465" stroke="#475569" strokeWidth="1.2" strokeDasharray="8 8" />

            {/* Center Landmark / Tugu Kampus */}
            <circle cx="450" cy="260" r="46" fill="#1E293B" stroke="#3B82F6" strokeWidth="3" />
            <circle cx="450" cy="260" r="28" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
            <text x="450" y="264" textAnchor="middle" fill="#93C5FD" fontSize="10" fontWeight="bold">
              Plaza Rektorat
            </text>
          </svg>

          {/* 4 UNIFIED INTERACTIVE BUILDING BLOCKS */}
          {areas.map((area) => {
            const isSelected = area.id === selectedId;
            const isAvailable = area.status === 'AVAILABLE';
            const isLimited = area.status === 'LIMITED';
            const availableCount = area.slots.filter((s) => s.status === 'AVAILABLE').length;
            const totalCount = area.slots.length;
            const isFilkom = area.id === 'filkom-main';

            let dotColor = 'bg-emerald-500 ring-emerald-400';
            if (isLimited) dotColor = 'bg-amber-500 ring-amber-400';
            if (area.status === 'FULL') dotColor = 'bg-rose-500 ring-rose-400';

            return (
              <div
                key={area.id}
                onClick={() => handleSelect(area.id)}
                style={{
                  left: `${area.mapLocation.x}%`,
                  top: `${area.mapLocation.y}%`,
                }}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer select-none transition-all duration-200 group',
                  'w-48 sm:w-56 md:w-60 p-3 rounded-2xl border-2 backdrop-blur-md shadow-lg',
                  isSelected
                    ? 'bg-slate-900/95 border-blue-500 ring-4 ring-blue-500/25 shadow-blue-500/30 scale-105'
                    : 'bg-slate-950/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900/90 hover:scale-102'
                )}
              >
                {/* Header: Faculty Name & Status */}
                <div className="flex items-start justify-between gap-1.5 pb-2 border-b border-slate-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-2.5 h-2.5 rounded-full ring-2 shrink-0', dotColor)} />
                      <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                        {isFilkom
                          ? 'Gedung FILKOM'
                          : `Fakultas ${getShortFacultyName(area.facultyName)}`}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate pl-4">
                      {isFilkom ? 'ESP32 Node (2 Sensor)' : 'Zona Parkir Kampus'}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider shrink-0',
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isLimited
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {area.status}
                  </span>
                </div>

                {/* Metrics: Slot availability & Portal status */}
                <div className="pt-2 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Slot Tersedia</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={cn(
                          'text-base sm:text-lg font-bold font-mono',
                          availableCount > 0 ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {availableCount}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ {totalCount} Kosong</span>
                    </div>
                  </div>

                  {/* Portal badge */}
          
                </div>

          

              </div>
            );
          })}
        </div>

        {/* Side Inspector Card (Always visible on standby) */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-50/60">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Area Terpilih di Peta
              </span>
              <ParkingStatusBadge status={selectedArea.status} size="sm" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedArea.facultyName}
              </h3>
              {selectedArea.notes ? (
                <p className="text-xs text-blue-700 font-medium mt-1">
                  {selectedArea.notes}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">{selectedArea.description}</p>
              )}
            </div>

            {/* Kotak Info Tunggal (Unified Info Card) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              {/* Portal Gerbang Status */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      selectedArea.gate.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    )}
                  />
                  Portal Gerbang:
                </span>
                <span
                  className={cn(
                    'font-bold px-2.5 py-0.5 rounded-full text-[11px]',
                    selectedArea.gate.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  )}
                >
                  {selectedArea.gate.status === 'OPEN' ? 'TERBUKA' : 'TERTUTUP'}
                </span>
              </div>

              {selectedArea.gate.notes && (
                <p className="text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100 leading-snug">
                  <span className="font-bold">Catatan Portal:</span> {selectedArea.gate.notes}
                </p>
              )}

              {/* Slot Kosong & Slot Terisi berdampingan dalam 1 kotak */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 pt-0.5">
                <div className="pr-3">
                  <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Slot Kosong
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-700 font-mono">
                      {selectedArea.slots.filter((s) => s.status === 'AVAILABLE').length}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">/ {selectedArea.slots.length}</span>
                  </div>
                </div>

                <div className="pl-3">
                  <span className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Slot Terisi
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-rose-700 font-mono">
                      {selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length}
                    </span>
                    <span className="text-xs text-rose-600 font-medium">/ {selectedArea.slots.length}</span>
                  </div>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Tingkat Keterisian</span>
                  <span className="font-bold text-slate-700">
                    {Math.round(
                      (selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length /
                        selectedArea.slots.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-rose-500 transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length /
                          selectedArea.slots.length) *
                          100
                      )}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${
                        100 -
                        Math.round(
                          (selectedArea.slots.filter((s) => s.status === 'OCCUPIED').length /
                            selectedArea.slots.length) *
                            100
                        )
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Slot Visual Pill Matrix */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Status {selectedArea.slots.length} Slot Parkir:
              </span>
              <div
                className={cn(
                  'grid gap-1.5',
                  selectedArea.slots.length <= 4 ? 'grid-cols-2' : 'grid-cols-5'
                )}
              >
                {selectedArea.slots.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'py-1.5 text-center rounded-lg text-[11px] font-mono font-bold border',
                      s.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                    title={`Slot ${s.slotNumber}: ${s.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}`}
                  >
                    {s.slotNumber}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            {isAdmin ? (
              <a
                href={`#area-${selectedArea.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ubah Status Slot Area Ini</span>
              </a>
            ) : (
              <Link
                href={`/areas/${selectedArea.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Detail Slot & Sensor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
