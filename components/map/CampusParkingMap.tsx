'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParking } from '@/context/ParkingContext';
import { ParkingArea } from '@/lib/types';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import {
  MapPin,
  Building2,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  SquareParking,
  Compass,
  Layers,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CampusParkingMap() {
  const { areas } = useParking();
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || 'fasilkom-main');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || areas[0];

  const filteredAreas = areas.filter((area) => {
    if (filterStatus === 'ALL') return true;
    return area.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Filter Peta:
          </span>
          {[
            { label: 'Semua Area', value: 'ALL' },
            { label: 'Tersedia (Hijau)', value: 'AVAILABLE' },
            { label: 'Terbatas (Kuning)', value: 'LIMITED' },
            { label: 'Penuh (Merah)', value: 'FULL' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer',
                filterStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Perbesar Peta"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Perkecil Peta"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors text-xs font-medium"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map & Inspector Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Campus Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden min-h-[460px] sm:min-h-[560px] flex items-center justify-center select-none">
          {/* Compass / Orientation badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 text-xs font-semibold shadow-md">
            <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
            <span>SmartCampus Interactive Blueprint</span>
          </div>

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Tersedia (&gt;25%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Terbatas (&le;25%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Penuh (0 Slot)
            </span>
          </div>

          {/* SVG Map Canvas with Zoom transform */}
          <div
            className="w-full h-full absolute inset-0 transition-transform duration-300 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg
              viewBox="0 0 1000 650"
              className="w-full h-full object-cover"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.6" />
                </pattern>
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
              </defs>

              {/* Background grid */}
              <rect width="1000" height="650" fill="#0B0F19" />
              <rect width="1000" height="650" fill="url(#campusGrid)" />

              {/* Campus Green Park Areas */}
              <path
                d="M 120 180 Q 250 140 380 200 T 520 220 Q 420 340 300 320 Z"
                fill="#064E3B"
                opacity="0.35"
              />
              <path
                d="M 620 380 Q 820 340 900 450 T 700 580 Z"
                fill="#064E3B"
                opacity="0.35"
              />

              {/* Campus Roads Network */}
              {/* Main Ring Road */}
              <path
                d="M 80 325 C 80 120, 920 120, 920 325 C 920 530, 80 530, 80 325 Z"
                fill="none"
                stroke="url(#roadGrad)"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M 80 325 C 80 120, 920 120, 920 325 C 920 530, 80 530, 80 325 Z"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="10 10"
              />

              {/* Cross Campus Boulevard */}
              <line x1="80" y1="325" x2="920" y2="325" stroke="url(#roadGrad)" strokeWidth="22" strokeLinecap="round" />
              <line x1="80" y1="325" x2="920" y2="325" stroke="#64748B" strokeWidth="1.2" strokeDasharray="8 8" />
              <line x1="500" y1="120" x2="500" y2="530" stroke="url(#roadGrad)" strokeWidth="22" strokeLinecap="round" />
              <line x1="500" y1="120" x2="500" y2="530" stroke="#64748B" strokeWidth="1.2" strokeDasharray="8 8" />

              {/* Central Roundabout */}
              <circle cx="500" cy="325" r="48" fill="#1E293B" stroke="#475569" strokeWidth="4" />
              <circle cx="500" cy="325" r="28" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
              <text x="500" y="329" textAnchor="middle" fill="#A7F3D0" fontSize="10" fontWeight="bold">
                Tugu Kampus
              </text>

              {/* Campus Buildings Visual Blocks */}
              {/* Rektorat & Perpustakaan Pusat */}
              <rect x="420" y="200" width="160" height="70" rx="8" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
              <text x="500" y="240" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontWeight="bold">
                Gedung Rektorat & Lib
              </text>

              {/* Building Blocks for Faculties */}
              {/* Fasilkom */}
              <rect x="230" y="150" width="160" height="85" rx="8" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
              <text x="310" y="195" textAnchor="middle" fill="#93C5FD" fontSize="12" fontWeight="bold">
                Gedung Fasilkom
              </text>
              <text x="310" y="212" textAnchor="middle" fill="#60A5FA" fontSize="9" fontFamily="monospace">
                [ESP32 IoT TESTBED]
              </text>

              {/* Teknik */}
              <rect x="610" y="130" width="170" height="85" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <text x="695" y="178" textAnchor="middle" fill="#CBD5E1" fontSize="12" fontWeight="bold">
                Fakultas Teknik
              </text>

              {/* FEB */}
              <rect x="680" y="380" width="160" height="85" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <text x="760" y="428" textAnchor="middle" fill="#CBD5E1" fontSize="12" fontWeight="bold">
                Fakultas Ekonomi (FEB)
              </text>

              {/* FISIP */}
              <rect x="160" y="420" width="160" height="80" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <text x="240" y="465" textAnchor="middle" fill="#CBD5E1" fontSize="12" fontWeight="bold">
                Kompleks FISIP
              </text>

              {/* Pertanian */}
              <rect x="420" y="450" width="160" height="80" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <text x="500" y="495" textAnchor="middle" fill="#CBD5E1" fontSize="12" fontWeight="bold">
                Fakultas Pertanian
              </text>
            </svg>

            {/* Interactive HTML Overlay Pins mapped directly over SVG */}
            {filteredAreas.map((area) => {
              const isSelected = area.id === selectedAreaId;
              const isAvailable = area.status === 'AVAILABLE';
              const isLimited = area.status === 'LIMITED';
              const isFull = area.status === 'FULL';

              let pinColor = 'bg-emerald-500 ring-emerald-400';
              if (isLimited) pinColor = 'bg-amber-500 ring-amber-400';
              if (isFull) pinColor = 'bg-rose-500 ring-rose-400';

              return (
                <div
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  style={{
                    left: `${area.mapLocation.x}%`,
                    top: `${area.mapLocation.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer transition-transform duration-200 hover:scale-110 group"
                >
                  {/* Pin button */}
                  <div className="relative flex flex-col items-center">
                    {/* Pulsing ring if selected or available */}
                    {isSelected && (
                      <span className="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping" />
                    )}

                    <div
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl border-2 flex items-center gap-1.5 shadow-xl transition-all',
                        isSelected
                          ? 'bg-blue-600 text-white border-white scale-110'
                          : 'bg-slate-900/90 text-white border-slate-700 hover:border-slate-500'
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full ring-2', pinColor)} />
                      <div className="text-left font-mono">
                        <span className="text-[10px] block font-bold leading-none">
                          {area.code}
                        </span>
                        <span className="text-xs font-bold leading-none">
                          {area.availableSlots} / {area.totalCapacity}
                        </span>
                      </div>
                      {area.dataSource === 'REAL DEVICE' && (
                        <Cpu className="w-3 h-3 text-cyan-300 ml-0.5" />
                      )}
                    </div>

                    {/* Pin tail */}
                    <div
                      className={cn(
                        'w-2 h-2 rotate-45 -mt-1',
                        isSelected ? 'bg-blue-600' : 'bg-slate-900'
                      )}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute top-full mt-2 hidden group-hover:flex flex-col items-center z-40 whitespace-nowrap">
                      <div className="bg-slate-950 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-800 shadow-xl">
                        {area.facultyName} ({area.availableSlots} Kosong)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Area Inspector Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" /> Detail Marker Terpilih
              </span>
              <ParkingStatusBadge status={selectedArea.status} size="sm" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {selectedArea.code}
                </span>
                <DataSourceBadge source={selectedArea.dataSource} size="sm" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {selectedArea.facultyName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedArea.areaName}</p>
              <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedArea.description}
              </p>
            </div>

            {/* Quick capacity stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Slot Tersedia
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-700">
                    {selectedArea.availableSlots}
                  </span>
                  <span className="text-xs text-emerald-600">
                    / {selectedArea.totalCapacity}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Slot Terisi
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-rose-700">
                    {selectedArea.occupiedSlots}
                  </span>
                  <span className="text-xs text-rose-600">Mobil</span>
                </div>
              </div>
            </div>

            {/* Slot Preview Pills */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Pratinjau Status Slot:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {selectedArea.slots.map((s) => (
                  <span
                    key={s.id}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-mono font-bold border',
                      s.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    {s.slotNumber}: {s.status === 'AVAILABLE' ? 'KOSONG' : 'TERISI'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action button leading to Area Detail */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              href={`/areas/${selectedArea.id}`}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>Buka Detail & Grid Interaktif</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

