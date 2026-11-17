'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  SquareParking,
  MapPin,
  History,
  Settings,
  Cpu,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParking } from '@/context/ParkingContext';

const NAV_ITEMS = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    description: 'Ringkasan Kampus & IoT',
  },
  {
    name: 'Parking Areas',
    href: '/areas',
    icon: SquareParking,
    description: 'Daftar Area Fakultas',
  },
  {
    name: 'Parking Map',
    href: '/map',
    icon: MapPin,
    description: 'Denah & Lokasi Parkir',
  },
  {
    name: 'Parking History',
    href: '/history',
    icon: History,
    description: 'Log Keluar & Masuk',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Simulasi & Konfigurasi IoT',
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { stats, simulationActive } = useParking();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <SquareParking className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
                SmartCampus
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  IoT
                </span>
              </span>
              <p className="text-xs text-slate-500 font-medium">Parking System</p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-500" />}
              </Link>
            );
          })}

          {/* Quick Real Device Spotlight */}
          <div className="pt-6">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Hardware Testbed</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <Link
              href="/areas/fasilkom-main"
              onClick={onClose}
              className={cn(
                'block p-3 rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/60 to-indigo-50/40 hover:border-blue-300 hover:shadow-xs transition-all',
                pathname === '/areas/fasilkom-main' ? 'ring-2 ring-blue-500/20 border-blue-300' : ''
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Fasilkom Live Node</p>
                    <p className="text-[11px] text-blue-700 font-mono">ESP32 (4 Sensors)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  REAL
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center justify-between text-[11px] text-slate-600">
                <span>Latensi: 18ms</span>
                <span className="text-blue-600 font-medium inline-flex items-center gap-0.5">
                  Inspect <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-blue-600" /> Status Sistem
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {stats.onlineDevicesCount} Node Aktif
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Simulasi Loop:</span>
                <span className={simulationActive ? 'text-blue-600 font-semibold' : 'text-slate-400 font-medium'}>
                  {simulationActive ? 'Berjalan (Live)' : 'Dijeda'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Kapasitas:</span>
                <span className="font-semibold text-slate-700">{stats.totalSlots} Slot</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

