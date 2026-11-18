'use client';

import React from 'react';
import { ParkingSlot } from '@/lib/types';
import { Car, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeAgo';

interface ParkingSlotItemProps {
  slot: ParkingSlot;
  areaId: string;
  onToggle?: (areaId: string, slotId: string) => void;
  isRealDevice?: boolean;
  readOnly?: boolean;
}

export function ParkingSlotItem({
  slot,
  areaId,
  onToggle,
  isRealDevice = false,
  readOnly = false,
}: ParkingSlotItemProps) {
  const isAvailable = slot.status === 'AVAILABLE';
  const isOccupied = slot.status === 'OCCUPIED';

  const handleClick = () => {
    if (!readOnly && onToggle) {
      onToggle(areaId, slot.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={readOnly ? 'article' : 'button'}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
          handleClick();
        }
      }}
      className={cn(
        'relative group rounded-xl p-4 border transition-all duration-200 select-none flex flex-col justify-between overflow-hidden',
        readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md',
        isAvailable
          ? cn(
              'bg-emerald-50/40 border-emerald-200',
              !readOnly && 'hover:border-emerald-400 hover:bg-emerald-50'
            )
          : isOccupied
          ? cn(
              'bg-rose-50/40 border-rose-200',
              !readOnly && 'hover:border-rose-400 hover:bg-rose-50'
            )
          : 'bg-slate-50 border-slate-200'
      )}
    >
      {/* Top row: Slot ID & Status Badge */}
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
          <span className="text-[10px] font-medium text-slate-500">
            Sensor {slot.slotNumber}
          </span>
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
      <div className="my-3 py-3 border-y border-dashed border-slate-200/90 flex flex-col items-center justify-center">
        {isOccupied ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-13 h-13 rounded-2xl bg-rose-600/10 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
              <Car className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-rose-700 mt-2">
              Mobil Terparkir
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1.5 animate-in zoom-in-95 duration-200">
            <div className="w-13 h-13 rounded-2xl bg-emerald-600/10 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
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

      {/* Timestamp & Action hint */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <TimeAgo date={slot.lastChanged} fallback="Baru saja" />
        </span>

        {readOnly ? (
          <span className="text-slate-400 font-medium text-[10px]">
            Sensor Aktif
          </span>
        ) : (
          <span className="text-blue-600 font-bold group-hover:underline text-[10px]">
            Klik ubah status
          </span>
        )}
      </div>
    </div>
  );
}
