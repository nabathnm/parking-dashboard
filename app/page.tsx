'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { ParkingUsageChart } from '@/components/dashboard/ParkingUsageChart';
import { FacultyComparisonChart } from '@/components/dashboard/FacultyComparisonChart';
import { AreaSummaryTable } from '@/components/dashboard/AreaSummaryTable';
import { IotDeviceSummary } from '@/components/dashboard/IotDeviceSummary';
import { useParking } from '@/context/ParkingContext';
import {
  SquareParking,
  CheckCircle2,
  AlertCircle,
  Building2,
  Cpu,
  Radio,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

function OverviewContent() {
  const { stats, lastSimEventMessage, simulationActive } = useParking();

  return (
    <div className="space-y-6">
      {/* Simulation status banner */}
      {lastSimEventMessage && (
        <div className="p-3 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-blue-900 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="font-semibold text-blue-900">Aktivitas Terkini:</span>
            <span>{lastSimEventMessage}</span>
          </div>
          <span className="text-[11px] font-mono text-blue-600 hidden sm:inline">
            Status: {simulationActive ? 'Live Simulation Active' : 'Simulation Paused'}
          </span>
        </div>
      )}

      {/* Main 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Parking Areas"
          value={stats.totalAreas}
          subtitle="5 Fakultas Kampus"
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend={{ value: '1 Node ESP32 + 4 Sim', isNeutral: true }}
        />

        <StatCard
          title="Total Parking Slots"
          value={stats.totalSlots}
          subtitle="Kapasitas total kendaraan"
          icon={SquareParking}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          trend={{ value: '100% Terpetakan', isNeutral: true }}
        />

        <StatCard
          title="Available Slots"
          value={stats.totalAvailable}
          subtitle={`${Math.round((stats.totalAvailable / (stats.totalSlots || 1)) * 100)}% dari total kapasitas`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          badge={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Kosong
            </span>
          }
          trend={{ value: 'Siap Digunakan', isPositive: true }}
        />

        <StatCard
          title="Occupied Slots"
          value={stats.totalOccupied}
          subtitle={`Tingkat okupansi: ${stats.occupancyRate}%`}
          icon={AlertCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          badge={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              Terisi
            </span>
          }
          trend={{
            value: stats.occupancyRate >= 80 ? 'Kapasitas Tinggi' : 'Kapasitas Normal',
            isPositive: stats.occupancyRate < 80,
          }}
        />
      </div>

      {/* Visual Charts: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParkingUsageChart />
        <FacultyComparisonChart />
      </div>

      {/* IoT Hardware Node Spotlight */}
      <IotDeviceSummary />

      {/* Parking Area Summary Table */}
      <AreaSummaryTable />
    </div>
  );
}

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <OverviewContent />
    </DashboardLayout>
  );
}
