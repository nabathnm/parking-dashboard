'use client';

import React, { useState, useEffect } from 'react';
import { GateInfo } from '@/lib/types';
import { DoorClosed, DoorOpen, ShieldCheck, Power, FileText, Check, Loader2 } from 'lucide-react';
import { TimeAgo } from '@/components/common/TimeAgo';

interface GateStatusCardProps {
  gate: GateInfo;
  areaId: string;
  onToggleGate?: (areaId: string, gateId?: string) => void;
  onUpdateNotes?: (areaId: string, notes: string) => void;
  readOnly?: boolean;
}

export function GateStatusCard({
  gate,
  areaId,
  onToggleGate,
  onUpdateNotes,
  readOnly = false,
}: GateStatusCardProps) {
  const isOpen = gate.status === 'OPEN';
  const [notesInput, setNotesInput] = useState(gate.notes || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNotesInput(gate.notes || '');
  }, [gate.notes]);

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateNotes) {
      onUpdateNotes(areaId, notesInput);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Portal Gerbang Barrier Otomatis (1 Portal)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {readOnly
              ? 'Status palang portal masuk/keluar (Pemantauan Realtime)'
              : 'Aktuator servo motor palang portal (Dapat dikendalikan)'}
          </p>
        </div>

        {readOnly && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            View-Only
          </span>
        )}
      </div>

      <div className="mt-4">
        <div
          className={`p-4 rounded-xl border transition-all ${
            isOpen
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-slate-50/70 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  isOpen
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-slate-700 text-white border-slate-600 shadow-xs'
                }`}
              >
                {isOpen ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{gate.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Posisi Servo: {gate.servoAngle}° ({isOpen ? 'Palang Terangkat / 90°' : 'Palang Menutup / 0°'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {gate.isPendingConfirmation ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  Menunggu Konfirmasi ESP32...
                </span>
              ) : (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isOpen
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {isOpen ? 'TERBUKA (OPEN)' : 'TERTUTUP (CLOSED)'}
                </span>
              )}

              {!readOnly && onToggleGate && (
                <button
                  type="button"
                  disabled={gate.isPendingConfirmation}
                  onClick={() => onToggleGate(areaId, gate.id)}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                    gate.isPendingConfirmation
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : isOpen
                      ? 'bg-slate-800 text-white hover:bg-slate-900'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {gate.isPendingConfirmation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {gate.isPendingConfirmation
                      ? 'Memproses MQTT...'
                      : isOpen
                      ? 'Tutup Portal (0°)'
                      : 'Buka Portal (90°)'}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
            <span>Aktuator: Micro Servo Motor SG90 / MG996R</span>
            <span>
              Terakhir diubah: <TimeAgo date={gate.lastToggled} fallback="Baru saja" />
            </span>
          </div>

          {/* Kolom Input / Tampilan Notes Portal Gerbang */}
          <div className="mt-3 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Catatan Portal Gerbang:
              </label>
              {isSaved && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
                  <Check className="w-3.5 h-3.5" />
                  Tersimpan!
                </span>
              )}
            </div>

            {readOnly ? (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                {gate.notes ? (
                  <p className="font-medium text-slate-800">{gate.notes}</p>
                ) : (
                  <p className="italic text-slate-400">Belum ada catatan khusus untuk portal gerbang ini.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveNotes} className="flex gap-2">
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tulis catatan portal (cth: Dibuka sementara untuk drop-off / darurat)..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <span>Simpan Catatan</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
