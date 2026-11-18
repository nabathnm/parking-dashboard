'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useParking } from '@/context/ParkingContext';

export function FacultyComparisonChart() {
  const { areas } = useParking();

  const chartData = areas.map((area) => {
    const total = area.slots.length;
    const occupied = area.slots.filter((s) => s.status === 'OCCUPIED').length;
    const available = area.slots.filter((s) => s.status === 'AVAILABLE').length;

    return {
      name: area.facultyName.replace('Fakultas ', ''),
      fullName: area.facultyName,
      available,
      occupied,
      total,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Perbandingan Ketersediaan Antar Fakultas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi slot terisi vs slot kosong di setiap area parkir
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800">
                        <p className="font-bold text-slate-200">{data.fullName}</p>
                        <p className="text-[10px] text-blue-400 font-mono uppercase">
                          Sumber: {data.source}
                        </p>
                        <div className="border-t border-slate-800 pt-1.5 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-400">Tersedia:</span>
                            <span className="font-bold">{data.available} slot</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-rose-400">Terisi:</span>
                            <span className="font-bold">{data.occupied} slot</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400">
                            <span>Total Kapasitas:</span>
                            <span>{data.total} slot</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
              />
              <Bar
                dataKey="available"
                name="Tersedia"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="occupied"
                name="Terisi"
                fill="#F43F5E"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          FILKOM terkoneksi langsung ke modul ESP32 (2 Sensor Asli)
        </span>
      </div>
    </div>
  );
}

