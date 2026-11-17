'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Clock,
  Play,
  Pause,
  Shuffle,
  ChevronRight,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  X,
  Cpu,
} from 'lucide-react';
import { useParking } from '@/context/ParkingContext';
import { cn } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeAgo';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    simulationActive,
    setSimulationActive,
    triggerRandomEvent,
    lastSimEventMessage,
    searchQuery,
    setSearchQuery,
    areas,
  } = useParking();

  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live Clock (WIB Indonesia)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setCurrentDateTime(now.toLocaleDateString('id-ID', options) + ' WIB');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Breadcrumbs title determination
  const getBreadcrumbInfo = () => {
    if (pathname === '/') {
      return { title: 'Overview Dashboard', breadcrumbs: ['SmartCampus', 'Overview'] };
    }
    if (pathname === '/areas') {
      return { title: 'Parking Areas', breadcrumbs: ['SmartCampus', 'Parking Areas'] };
    }
    if (pathname.startsWith('/areas/')) {
      const areaId = pathname.replace('/areas/', '');
      const area = areas.find((a) => a.id === areaId);
      return {
        title: area ? area.facultyName : 'Detail Area Parkir',
        breadcrumbs: ['SmartCampus', 'Parking Areas', area ? area.code : 'Detail'],
      };
    }
    if (pathname === '/map') {
      return { title: 'Campus Parking Map', breadcrumbs: ['SmartCampus', 'Interactive Map'] };
    }
    if (pathname === '/history') {
      return { title: 'Parking Activity History', breadcrumbs: ['SmartCampus', 'History Log'] };
    }
    if (pathname === '/settings') {
      return { title: 'System Settings', breadcrumbs: ['SmartCampus', 'Settings & IoT'] };
    }
    return { title: 'SmartCampus Parking', breadcrumbs: ['SmartCampus'] };
  };

  const { title, breadcrumbs } = getBreadcrumbInfo();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? areas.filter(
        (a) =>
          a.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger button + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-700 font-semibold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Search, Live Clock, Simulation status, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search input with live popup */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari fakultas / area..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-48 lg:w-64 pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full mt-1.5 left-0 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                Hasil Pencarian ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  Tidak ada area parkir yang cocok.
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {searchResults.map((area) => (
                    <Link
                      key={area.id}
                      href={`/areas/${area.id}`}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="p-2 rounded-lg hover:bg-blue-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{area.facultyName}</p>
                        <p className="text-[11px] text-slate-500">{area.code} • {area.areaName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600">{area.availableSlots}</span>
                        <span className="text-slate-400">/{area.totalCapacity}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{currentDateTime || 'Memuat waktu...'}</span>
        </div>

        {/* Simulation Bar Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSimulationActive(!simulationActive)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs',
              simulationActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            )}
            title={simulationActive ? 'Klik untuk jeda simulasi otomatis' : 'Klik untuk aktifkan simulasi otomatis'}
          >
            {simulationActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="hidden sm:inline">Simulasi Live</span>
                <Pause className="w-3 h-3 ml-0.5" />
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Mulai Simulasi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={triggerRandomEvent}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-medium transition-all"
            title="Picu event perubahan slot acak (Test Event)"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            aria-label="Notifikasi"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-xs">Notifikasi Sistem</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Belum ada notifikasi terkini.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => markNotificationAsRead(item.id)}
                      className={cn(
                        'p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3',
                        !item.read ? 'bg-blue-50/40' : ''
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {item.type === 'success' && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'warning' && (
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.type === 'info' && (
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            <TimeAgo date={item.timestamp} fallback="Baru saja" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <Link
                  href="/history"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Lihat Riwayat Lengkap →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

