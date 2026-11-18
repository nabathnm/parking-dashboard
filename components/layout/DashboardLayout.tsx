'use client';

import React, { Suspense, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ParkingProvider } from '@/context/ParkingContext';
import { Menu, SquareParking } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ParkingProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Suspense fallback={<aside className="fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200/80 hidden lg:block" />}>
          <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          {/* Mobile Header: hanya tampil di layar kecil/mobile untuk buka sidebar */}
          <div className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <SquareParking className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">SmartCampus Parking</span>
            </div>
            <div className="w-8" />
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat konten...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </ParkingProvider>
  );
}
