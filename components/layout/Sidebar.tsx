'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquareParking,
  SlidersHorizontal,
  Cpu,
  Radio,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParking } from '@/context/ParkingContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { stats } = useParking();

  const isAdmin = pathname.startsWith('/admin');

  const NAV_ITEMS = [
    {
      name: 'Ketersediaan Parkir',
      role: 'Tampilan Mahasiswa',
      href: '/',
      icon: SquareParking,
      badge: 'User',
      description: 'Cek 40 slot & denah kampus standby',
      isActive: pathname === '/' || pathname === '/areas' || (pathname.startsWith('/areas/') && !isAdmin),
    },
    {
      name: 'Panel Kontrol Admin',
      role: 'Tampilan Admin IoT',
      href: '/admin',
      icon: SlidersHorizontal,
      badge: 'Admin',
      description: 'Kendalikan 10 slot/area & simulasi',
      isActive: isAdmin,
    },
  ];

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
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
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
              <p className="text-xs text-blue-600 font-medium">Monitoring Parkir</p>
            </div>
          </Link>
        </div>


        {/* Navigation list (EXACTLY 2 MENUS) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all group',
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white hover:bg-blue-50/40 text-slate-700 border-slate-200/80 hover:border-blue-200'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0 mt-0.5 transition-colors',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate leading-tight">
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase',
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-[11px] mt-1 leading-snug',
                      active ? 'text-blue-100' : 'text-slate-500'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}

        </div>
      </aside>
    </>
  );
}
