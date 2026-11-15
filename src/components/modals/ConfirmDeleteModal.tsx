import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { AmiIndicator } from '../../types/ami';

interface ConfirmDeleteModalProps {
  indicator: AmiIndicator | null;
  onCancel: () => void;
  onConfirm: (indicatorId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  indicator,
  onCancel,
  onConfirm,
}) => {
  if (!indicator) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-red-50 px-5 py-3.5">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <h3 className="text-sm font-bold">Konfirmasi Hapus Indikator</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-slate-900"
            aria-label="Tutup konfirmasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs text-slate-700">
          <p>
            Anda akan menghapus butir indikator{' '}
            <strong className="font-mono text-slate-900">{indicator.code}</strong>:
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 leading-relaxed">
            {indicator.uraian}
          </div>
          <p className="text-[11px] text-slate-500">
            Penghapusan akan memperbarui kalkulasi Rekap Standar, Daftar Temuan, PTK/RTL, dan Laporan secara otomatis.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(indicator.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Indikator
          </button>
        </div>
      </div>
    </div>
  );
};
