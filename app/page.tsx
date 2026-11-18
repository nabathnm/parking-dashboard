'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ParkingAreaCard } from '@/components/areas/ParkingAreaCard';
import { CampusParkingMap } from '@/components/map/CampusParkingMap';
import { useParking } from '@/context/ParkingContext';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { ConnectionStatusBar } from '@/components/common/ConnectionStatusBar';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import {
  Search,
  Grid,
  List,
  X,
  CheckCircle2,
  AlertCircle,
  SquareParking,
  Cpu,
  GraduationCap,
  Eye,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  ArrowRight,
} from 'lucide-react';

function UserParkingContent() {
  const { areas, stats } = useParking();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('AVAILABLE_DESC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedMapAreaId, setSelectedMapAreaId] = useState<string>('filkom-main');

  // Filter & Sort for the 4 parking areas
  const filteredAreas = useMemo(() => {
    return areas
      .filter((area) => {
        const matchesSearch =
          area.facultyName.toLowerCase().includes(search.toLowerCase()) ||
          (area.notes && area.notes.toLowerCase().includes(search.toLowerCase())) ||
          area.description.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' || area.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aAvail = a.slots.filter((s) => s.status === 'AVAILABLE').length;
        const bAvail = b.slots.filter((s) => s.status === 'AVAILABLE').length;
        if (sortBy === 'AVAILABLE_DESC') return bAvail - aAvail;
        if (sortBy === 'AVAILABLE_ASC') return aAvail - bAvail;
        if (sortBy === 'CAPACITY_DESC') return b.slots.length - a.slots.length;
        if (sortBy === 'NAME_ASC') return a.facultyName.localeCompare(b.facultyName);
        return 0;
      });
  }, [areas, search, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSortBy('AVAILABLE_DESC');
  };

  const hasActiveFilters =
    search !== '' || statusFilter !== 'ALL' || sortBy !== 'AVAILABLE_DESC';

  return (
    <div className="space-y-6">
      {/* Realtime IoT & Database Connection Status Bar */}
      <ConnectionStatusBar />

      {/* Top Header Card (Consistent Blue SaaS Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Portal Mahasiswa & Pengunjung
            </span>
            <span className="text-xs text-slate-500 font-medium">
              • Mode Pemantauan (View-Only)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ketersediaan Tempat Parkir Kampus
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Pantau ketersediaan slot parkir di 4 area fakultas secara realtime sebelum berangkat ke kampus.
          </p>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] text-blue-800 font-semibold block">Total Kapasitas</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{stats.totalSlots}</span>
              <span className="text-xs text-slate-600 font-medium">Slot (4 Area)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Total Slot Kosong
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-700">{stats.totalAvailable}</span>
              <span className="text-xs text-emerald-600 font-semibold">Slot Siap</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Slot Terisi
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-700">{stats.totalOccupied}</span>
              <span className="text-xs text-rose-600 font-medium">({stats.occupancyRate}%)</span>
            </div>
          </div>

        </div>
      </div>

      {/* STANDBY CAMPUS MAP (Permanen Tampil, No Toggle) */}
      <CampusParkingMap
        selectedAreaId={selectedMapAreaId}
        onSelectArea={setSelectedMapAreaId}
        isAdmin={false}
      />


      {/* 4 Area Display: Cards or Table */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Area parkir tidak ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada area parkir yang sesuai dengan filter pencarian.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAreas.map((area) => (
            <ParkingAreaCard key={area.id} area={area} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        </div>
      )}
    </div>
  );
}

export default function UserParkingPage() {
  return (
    <DashboardLayout>
      <UserParkingContent />
    </DashboardLayout>
  );
}
