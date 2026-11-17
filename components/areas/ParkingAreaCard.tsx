'use client';

import React from 'react';
import Link from 'next/link';
import { ParkingArea } from '@/lib/types';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { TimeAgo } from '@/components/common/TimeAgo';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Cpu,
  Radio,
  DoorClosed,
  Clock,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface ParkingAreaCardProps {
  area: ParkingArea;
}

export function ParkingAreaCard({ area }: ParkingAreaCardProps) {
  const occupancyPercent = Math.round(
    (area.occupiedSlots / area.totalCapacity) * 100
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header: Faculty Name, Code, Badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {area.code}
              </span>
              <DataSourceBadge source={area.dataSource} size="sm" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-2 group-hover:text-blue-600 transition-colors">
              {area.facultyName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{area.areaName}</p>
          </div>

          <ParkingStatusBadge status={area.status} size="sm" />
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-3 line-clamp-2">
          {area.description}
        </p>

        {/* Capacity statistics */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Slot Kosong
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-700">
                {area.availableSlots}
              </span>
              <span className="text-xs text-emerald-600">/ {area.totalCapacity}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100">
            <span className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Slot Terisi
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-rose-700">
                {area.occupiedSlots}
              </span>
              <span className="text-xs text-rose-600">Slot</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium">Tingkat Penggunaan</span>
            <span className="font-bold text-slate-700">{occupancyPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent >= 90
                  ? 'bg-rose-500'
                  : occupancyPercent >= 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Mini tags / quick info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-blue-500" />
            {area.dataSource === 'REAL DEVICE' ? 'Node Live (ESP32)' : 'Simulated Node'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <TimeAgo date={area.lastUpdated} fallback="Baru saja" />
          </span>
        </div>
      </div>

      {/* Button link to details */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <Link
          href={`/areas/${area.id}`}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 group/btn border border-slate-200/80 hover:border-transparent shadow-2xs hover:shadow-xs"
        >
          <span>Buka Detail & Grid Slot</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

