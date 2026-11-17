'use client';

import React, { Suspense, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ParkingProvider } from '@/context/ParkingContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ParkingProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Suspense fallback={<aside className="fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200/80 hidden lg:block" />}>
          <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </Suspense>

        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          <Suspense fallback={<header className="sticky top-0 h-16 bg-white border-b border-slate-200" />}>
            <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          </Suspense>
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
