'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useParking } from '@/context/ParkingContext';
import { TrendingUp, Clock } from 'lucide-react';

export function ParkingUsageChart() {
  const { hourlyUsage } = useParking();

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Tren Penggunaan Parkir Kampus</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
              24 Jam Terakhir
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tingkat okupansi slot rata-rata di seluruh fakultas berdasarkan waktu
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Okupansi (%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            <span>Kapasitas Tersedia</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={hourlyUsage}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Pukul {label} WIB</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1.5 space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Tingkat Okupansi:</span>
                          <span className="font-bold text-blue-400">{data.occupancyRate}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Slot Terisi:</span>
                          <span className="font-semibold text-rose-400">{data.occupied} slot</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Slot Kosong:</span>
                          <span className="font-semibold text-emerald-400">{data.available} slot</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="occupancyRate"
              stroke="#2563EB"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#usageGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1 text-amber-600 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Jam Padat Kampus: 10:00 - 14:00 WIB (Puncak 91% Okupansi)</span>
        </div>
        <span>Pembaruan otomatis tiap interval simulasi</span>
      </div>
    </div>
  );
}

