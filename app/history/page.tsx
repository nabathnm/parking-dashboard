'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ParkingHistoryTable } from '@/components/history/ParkingHistoryTable';
import { History, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ParkingHistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Riwayat Aktivitas Parkir Kampus
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log lengkap pergerakan kendaraan masuk dan keluar di seluruh fakultas secara realtime
          </p>
        </div>

        <ParkingHistoryTable />
      </div>
    </DashboardLayout>
  );
}

