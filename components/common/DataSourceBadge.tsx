import React from 'react';
import { DataSource } from '@/lib/types';
import { Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSourceBadgeProps {
  source: DataSource;
  size?: 'sm' | 'md';
  className?: string;
}

export function DataSourceBadge({
  source,
  size = 'md',
  className,
}: DataSourceBadgeProps) {
  const isReal = source === 'REAL DEVICE';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-mono tracking-tight shadow-2xs',
        isReal
          ? 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10'
          : 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10',
        sizeStyles[size],
        className
      )}
      title={
        isReal
          ? 'Data bersumber langsung dari ESP32 Hardware Node'
          : 'Data disimulasikan oleh sistem'
      }
    >
      {isReal ? (
        <>
          <Cpu className={cn('text-blue-600', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
          <span>REAL DEVICE</span>
        </>
      ) : (
        <>
          <Sparkles className={cn('text-purple-600', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
          <span>SIMULATED</span>
        </>
      )}
    </span>
  );
}

