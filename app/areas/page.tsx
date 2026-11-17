'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ParkingAreaCard } from '@/components/areas/ParkingAreaCard';
import { useParking } from '@/context/ParkingContext';
import { ParkingArea, AreaStatus, DataSource } from '@/lib/types';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  ArrowUpDown,
  X,
  Building2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

function ParkingAreasContent() {
  const { areas } = useParking();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('AVAILABLE_DESC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter & Sort
  const filteredAreas = useMemo(() => {
    return areas
      .filter((area) => {
        const matchesSearch =
          area.facultyName.toLowerCase().includes(search.toLowerCase()) ||
          area.areaName.toLowerCase().includes(search.toLowerCase()) ||
          area.code.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL' || area.status === statusFilter;

        const matchesSource =
          sourceFilter === 'ALL' || area.dataSource === sourceFilter;

        return matchesSearch && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'AVAILABLE_DESC') return b.availableSlots - a.availableSlots;
        if (sortBy === 'AVAILABLE_ASC') return a.availableSlots - b.availableSlots;
        if (sortBy === 'CAPACITY_DESC') return b.totalCapacity - a.totalCapacity;
        if (sortBy === 'NAME_ASC') return a.facultyName.localeCompare(b.facultyName);
        return 0;
      });
  }, [areas, search, statusFilter, sourceFilter, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setSortBy('AVAILABLE_DESC');
  };

  const hasActiveFilters =
    search !== '' || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || sortBy !== 'AVAILABLE_DESC';

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Area Parkir Fakultas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring realtime ketersediaan seluruh area parkir di lingkungan universitas
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Tampilan Grid Card"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Tampilan Tabel"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama fakultas, kode, atau area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">Tersedia (Hijau)</option>
              <option value="LIMITED">Terbatas (Kuning)</option>
              <option value="FULL">Penuh (Merah)</option>
              <option value="OFFLINE">Offline (Abu-abu)</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="md:col-span-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="REAL DEVICE">Real Device (ESP32)</option>
              <option value="SIMULATED">Simulated</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="AVAILABLE_DESC">Paling Banyak Kosong</option>
              <option value="AVAILABLE_ASC">Paling Sedikit Kosong</option>
              <option value="CAPACITY_DESC">Kapasitas Terbesar</option>
              <option value="NAME_ASC">Nama Fakultas (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Status Pills Quick Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Status Cepat:</span>
            {[
              { label: 'Semua', value: 'ALL' },
              { label: 'Tersedia', value: 'AVAILABLE' },
              { label: 'Terbatas', value: 'LIMITED' },
              { label: 'Penuh', value: 'FULL' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  statusFilter === tab.value
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">
              Menampilkan <strong>{filteredAreas.length}</strong> dari {areas.length} area
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-1 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content display: Grid or Table */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Tidak ada area parkir yang ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau bersihkan filter status dan sumber data.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Bersihkan Semua Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAreas.map((area) => (
            <ParkingAreaCard key={area.id} area={area} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Fakultas & Area</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4">Slot Kosong</th>
                  <th className="py-3 px-4">Slot Terisi</th>
                  <th className="py-3 px-4">Total Kapasitas</th>
                  <th className="py-3 px-4">Penggunaan (%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.map((area) => {
                  const percent = Math.round(
                    (area.occupiedSlots / area.totalCapacity) * 100
                  );
                  return (
                    <tr
                      key={area.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {area.facultyName}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {area.code} • {area.areaName}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <DataSourceBadge source={area.dataSource} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                        {area.availableSlots}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600">
                        {area.occupiedSlots}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {area.totalCapacity}
                      </td>
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-slate-600">
                            {percent}%
                          </span>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent >= 90
                                  ? 'bg-rose-500'
                                  : percent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ParkingStatusBadge status={area.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/areas/${area.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-all"
                        >
                          Lihat Detail
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParkingAreasPage() {
  return (
    <DashboardLayout>
      <ParkingAreasContent />
    </DashboardLayout>
  );
}

