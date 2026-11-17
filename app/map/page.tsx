'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CampusParkingMap } from '@/components/map/CampusParkingMap';

export default function ParkingMapPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Peta Parkir Kampus Terpusat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi geospasial dan zonasi parkir antar fakultas di lingkungan universitas
          </p>
        </div>

        <CampusParkingMap />
      </div>
    </DashboardLayout>
  );
}

