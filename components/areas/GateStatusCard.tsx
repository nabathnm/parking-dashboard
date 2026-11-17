'use client';

import React from 'react';
import { GateInfo } from '@/lib/types';
import { DoorClosed, DoorOpen, ShieldCheck, Power, RefreshCw } from 'lucide-react';
import { TimeAgo } from '@/components/common/TimeAgo';

interface GateStatusCardProps {
  gates: GateInfo[];
  areaId: string;
  onToggleGate: (areaId: string, gateId: string) => void;
}

export function GateStatusCard({ gates, areaId, onToggleGate }: GateStatusCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Kontrol & Status Gerbang Barrier
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aktuator motor servo barrier gate otomatis masuk dan keluar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {gates.map((gate) => {
          const isOpen = gate.status === 'OPEN';

          return (
            <div
              key={gate.id}
              className={`p-4 rounded-xl border transition-all ${
                isOpen
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isOpen
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-700 text-white border-slate-600 shadow-xs'
                    }`}
                  >
                    {isOpen ? (
                      <DoorOpen className="w-5 h-5 animate-bounce" />
                    ) : (
                      <DoorClosed className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{gate.name}</h4>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      Tipe: {gate.type === 'ENTRY' ? 'Pintu Masuk' : 'Pintu Keluar'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isOpen
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {gate.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Posisi Servo:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {gate.servoAngle}° ({isOpen ? 'Terbuka / 90°' : 'Tertutup / 0°'})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Terakhir Diubah:</span>
                  <span className="text-slate-600 font-medium">
                    <TimeAgo date={gate.lastToggled} fallback="Baru saja" />
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onToggleGate(areaId, gate.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isOpen
                      ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-2xs'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isOpen ? 'Tutup Gerbang (0°)' : 'Buka Gerbang (90°)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

