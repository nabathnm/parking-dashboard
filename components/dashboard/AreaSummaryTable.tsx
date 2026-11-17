'use client';

import React from 'react';
import Link from 'next/link';
import { useParking } from '@/context/ParkingContext';
import { ParkingStatusBadge } from '@/components/common/ParkingStatusBadge';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { ArrowRight, Cpu, Car, Layers } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export function AreaSummaryTable() {
  const { areas } = useParking();

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Ringkasan Area Parkir Fakultas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring realtime kapasitas dan ketersediaan slot di setiap fakultas
          </p>
        </div>

        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Lihat Semua Area ({areas.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4 sm:px-6">Fakultas & Area</th>
              <th className="py-3 px-4">Sumber Data</th>
              <th className="py-3 px-4">Ketersediaan</th>
              <th className="py-3 px-4">Okupansi (%)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {areas.map((area) => {
              const occupancyPercent = Math.round(
                (area.occupiedSlots / area.totalCapacity) * 100
              );

              return (
                <tr
                  key={area.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3.5 px-4 sm:px-6">
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        {area.facultyName}
                        {area.dataSource === 'REAL DEVICE' && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {area.code} • {area.areaName}
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <DataSourceBadge source={area.dataSource} size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-emerald-600">
                        {area.availableSlots}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600 font-medium">
                        {area.totalCapacity} Slot
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Terisi {area.occupiedSlots}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-600">{occupancyPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancyPercent >= 90
                              ? 'bg-rose-500'
                              : occupancyPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors border border-transparent hover:border-blue-200"
                    >
                      Detail
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

