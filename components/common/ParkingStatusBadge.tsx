import React from 'react';
import { AreaStatus, SlotStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ParkingStatusBadgeProps {
  status: AreaStatus | SlotStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function ParkingStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: ParkingStatusBadgeProps) {
  let colorStyles = '';
  let dotColor = '';
  let label = '';

  switch (status) {
    case 'AVAILABLE':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
      dotColor = 'bg-emerald-500';
      label = 'Tersedia';
      break;
    case 'LIMITED':
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
      dotColor = 'bg-amber-500';
      label = 'Terbatas';
      break;
    case 'FULL':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
      dotColor = 'bg-rose-500';
      label = 'Penuh';
      break;
    case 'OCCUPIED':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
      dotColor = 'bg-rose-500';
      label = 'Terisi';
      break;
    case 'OFFLINE':
    case 'UNKNOWN':
    default:
      colorStyles = 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10';
      dotColor = 'bg-slate-400';
      label = status === 'OFFLINE' ? 'Offline' : 'Tidak Diketahui';
      break;
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border ring-1 transition-all shadow-xs',
        sizeStyles[size],
        colorStyles,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {status === 'AVAILABLE' && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColor
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}

