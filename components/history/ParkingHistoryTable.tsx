'use client';

import React, { useState, useMemo } from 'react';
import { useParking } from '@/context/ParkingContext';
import { ParkingActivity } from '@/lib/types';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import {
  Search,
  Filter,
  Download,
  Calendar,
  X,
  ArrowUpDown,
  Car,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeAgo';

export function ParkingHistoryTable() {
  const { activities, areas } = useParking();

  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  // Filter logic
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // Search keyword
      const matchesSearch =
        item.faculty.toLowerCase().includes(search.toLowerCase()) ||
        item.parkingArea.toLowerCase().includes(search.toLowerCase()) ||
        item.slotId.toLowerCase().includes(search.toLowerCase()) ||
        (item.vehiclePlate && item.vehiclePlate.toLowerCase().includes(search.toLowerCase()));

      // Faculty filter
      const matchesFaculty =
        facultyFilter === 'ALL' || item.areaId === facultyFilter;

      // Activity filter
      const matchesActivity =
        activityFilter === 'ALL' || item.activity === activityFilter;

      // Date range filter
      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        const itemDate = new Date(item.timestamp).toDateString();
        const today = new Date().toDateString();
        matchesDate = itemDate === today;
      }

      return matchesSearch && matchesFaculty && matchesActivity && matchesDate;
    });
  }, [activities, search, facultyFilter, activityFilter, dateFilter]);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Faculty', 'Parking Area', 'Slot ID', 'Activity', 'Status', 'Vehicle Plate', 'Duration (Min)'];
    const rows = filteredActivities.map((act) => [
      act.timestamp,
      `"${act.faculty}"`,
      `"${act.parkingArea}"`,
      act.slotId,
      act.activity,
      act.status,
      act.vehiclePlate || '-',
      act.durationMinutes || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartcampus-parking-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch('');
    setFacultyFilter('ALL');
    setActivityFilter('ALL');
    setDateFilter('ALL');
  };

  const hasActiveFilters =
    search !== '' || facultyFilter !== 'ALL' || activityFilter !== 'ALL' || dateFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Filters & Actions Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari slot (A1), plat (B 1234), atau fakultas..."
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

          {/* Faculty Select */}
          <div className="lg:col-span-3">
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Fakultas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.facultyName} ({a.code})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Select */}
          <div className="lg:col-span-2">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Aktivitas</option>
              <option value="IN">Kendaraan Masuk (IN)</option>
              <option value="OUT">Kendaraan Keluar (OUT)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="lg:col-span-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Tanggal</option>
              <option value="TODAY">Hari Ini</option>
            </select>
          </div>

          {/* Export CSV button */}
          <div className="lg:col-span-1 flex items-center">
            <button
              type="button"
              onClick={exportToCSV}
              className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
              title="Ekspor data ke file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {/* Filter count summary */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Ditemukan <strong>{filteredActivities.length}</strong> riwayat aktivitas
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 sm:px-6">Waktu (WIB)</th>
                <th className="py-3 px-4">Fakultas & Area</th>
                <th className="py-3 px-4">ID Slot</th>
                <th className="py-3 px-4">Aktivitas</th>
                <th className="py-3 px-4">Status Akhir</th>
                <th className="py-3 px-4">Plat Kendaraan</th>
                <th className="py-3 px-4 text-right">Durasi Parkir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada aktivitas parkir yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isEntry = act.activity === 'IN';

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-900" suppressHydrationWarning>
                          {new Date(act.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}{' '}
                          WIB
                        </div>
                        <div className="text-[10px] text-slate-400">
                          <TimeAgo date={act.timestamp} fallback="Baru saja" />
                        </div>
                      </td>

                      {/* Faculty */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {act.faculty}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">
                          {act.parkingArea}
                        </p>
                      </td>

                      {/* Slot ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {act.slotId}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isEntry
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isEntry ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>{isEntry ? 'MASUK' : 'KELUAR'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <ParkingStatusBadge status={act.status} size="sm" />
                      </td>

                      {/* Vehicle Plate */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {act.vehiclePlate || 'B 1234 XY'}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-right">
                        {act.durationMinutes ? (
                          <span className="font-medium text-slate-600">
                            {act.durationMinutes} menit
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

