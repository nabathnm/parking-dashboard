'use client';

import React from 'react';
import { ParkingSlot } from '@/lib/types';
import { Car, CheckCircle2, AlertCircle, HelpCircle, Radio, Clock, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeAgo';

interface ParkingSlotItemProps {
  slot: ParkingSlot;
  areaId: string;
  onToggle: (areaId: string, slotId: string) => void;
  isRealDevice?: boolean;
}

export function ParkingSlotItem({
  slot,
  areaId,
  onToggle,
  isRealDevice = false,
}: ParkingSlotItemProps) {
  const isAvailable = slot.status === 'AVAILABLE';
  const isOccupied = slot.status === 'OCCUPIED';

  return (
    <div
      onClick={() => onToggle(areaId, slot.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onToggle(areaId, slot.id);
        }
      }}
      className={cn(
        'relative group rounded-xl p-4 border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between overflow-hidden',
        isAvailable
          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md'
          : isOccupied
          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:bg-rose-50 hover:shadow-md'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      )}
    >
      {/* Top row: Slot ID & Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-mono shadow-2xs transition-colors',
              isAvailable
                ? 'bg-emerald-600 text-white'
                : isOccupied
                ? 'bg-rose-600 text-white'
                : 'bg-slate-400 text-white'
            )}
          >
            {slot.slotNumber}
          </span>
          {slot.sensorId && (
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              {slot.sensorId}
            </span>
          )}
        </div>

        <span
          className={cn(
            'text-[11px] font-semibold px-2 py-0.5 rounded-full border ring-1 flex items-center gap-1',
            isAvailable
              ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200 ring-emerald-500/10'
              : isOccupied
              ? 'bg-rose-100/80 text-rose-800 border-rose-200 ring-rose-500/10'
              : 'bg-slate-200 text-slate-700 border-slate-300 ring-slate-500/10'
          )}
        >
          {isAvailable ? 'KOSONG' : isOccupied ? 'TERISI' : 'UNKNOWN'}
        </span>
      </div>

      {/* Center visual: Parking Bay illustration */}
      <div className="my-4 py-3 border-y border-dashed border-slate-200/90 flex flex-col items-center justify-center">
        {isOccupied ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
              <Car className="w-8 h-8 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-rose-700 mt-2">
              Mobil Terparkir
            </span>
            {slot.notes && (
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 text-center px-1">
                {slot.notes}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-emerald-700 mt-2">
              Slot Tersedia
            </span>
            <span className="text-[10px] text-emerald-600/80 mt-0.5">
              Siap ditempati
            </span>
          </div>
        )}
      </div>

      {/* Sensor reading in cm & timestamp */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
            <Radio className="w-3 h-3 text-blue-500" />
            Jarak Sensor:
          </span>
          <span
            className={cn(
              'font-mono font-bold text-xs px-2 py-0.5 rounded-md border',
              isOccupied
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            )}
          >
            {slot.distanceCm} cm
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <TimeAgo date={slot.lastChanged} fallback="Baru saja" />
          </span>
          <span className="text-blue-600 font-medium group-hover:underline text-[10px]">
            Klik ubah status
          </span>
        </div>
      </div>
    </div>
  );
}

