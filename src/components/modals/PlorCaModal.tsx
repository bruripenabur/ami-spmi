import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  KategoriTemuan,
  PlorCaData,
  UserRole,
} from '../../types/ami';
import {
  buildPlorCaNarrative,
  getKategoriBadgeClasses,
  getKategoriTemuan,
} from '../../utils/amiCalculations';

interface PlorCaModalProps {
  indicator: AmiIndicator | null;
  evaluation: AmiEvaluation | null;
  role: UserRole;
  canEditPlorCa?: boolean;
  canEditPtkDraft?: boolean;
  roleNote?: string;
  onClose: () => void;
  onSave: (
    indicatorId: string,
    updates: {
      akar_masalah: string;
      plor_ca: PlorCaData;
      ptk_rtl: string;
      pic: string;
      waktu_ptk: string;
      waktu_monev: string;
      kategori_override: KategoriTemuan | null;
    }
  ) => void;
}

const KATEGORI_OPTIONS: KategoriTemuan[] = [
  'Mayor',
  'Minor',
  'Observasi',
  'Sesuai (Baik)',
  'Best Practice',
];

export const PlorCaModal: React.FC<PlorCaModalProps> = ({
  indicator,
  evaluation,
  role,
  canEditPlorCa,
  canEditPtkDraft = true,
  roleNote,
  onClose,
  onSave,
}) => {
  const [akarMasalah, setAkarMasalah] = useState('');
  const [plorCa, setPlorCa] = useState<PlorCaData>({
    problem: '',
    location: '',
    objectiveEvidence: '',
    reference: '',
    correction: '',
    action: '',
  });
  const [ptkRtl, setPtkRtl] = useState('');
  const [pic, setPic] = useState('');
  const [waktuPtk, setWaktuPtk] = useState('');
  const [waktuMonev, setWaktuMonev] = useState('');
  const [kategoriOverride, setKategoriOverride] = useState<KategoriTemuan | null>(
    null
  );

  useEffect(() => {
    if (evaluation) {
      setAkarMasalah(evaluation.akar_masalah);
      setPlorCa(evaluation.plor_ca);
      setPtkRtl(evaluation.ptk_rtl);
      setPic(evaluation.pic);
      setWaktuPtk(evaluation.waktu_ptk);
      setWaktuMonev(evaluation.waktu_monev);
      setKategoriOverride(evaluation.kategori_override);
    }
  }, [evaluation, indicator]);

  if (!indicator || !evaluation) return null;

  const isAuditor = canEditPlorCa !== undefined ? canEditPlorCa : role === 'auditor';
  const canSaveAny = isAuditor || canEditPtkDraft;
  const autoKategori = getKategoriTemuan(
    evaluation.nilai_capaian,
    evaluation.target_1_yr,
    null
  );
  const effectiveKategori = kategoriOverride ?? autoKategori;

  const handleSyncNarrativeFromPlor = () => {
    const generated = buildPlorCaNarrative(plorCa);
    if (generated) {
      setAkarMasalah(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(indicator.id, {
      akar_masalah: akarMasalah,
      plor_ca: plorCa,
      ptk_rtl: ptkRtl,
      pic,
      waktu_ptk: waktuPtk,
      waktu_monev: waktuMonev,
      kategori_override: kategoriOverride,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <span>PLOR+CA & PTK/RTL Editor</span>
              <span aria-hidden="true">·</span>
              <span>Indikator {indicator.code}</span>
            </div>
            <h3 className="mt-1 text-sm font-semibold text-white leading-snug">
              {indicator.uraian}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Tutup modal PLOR+CA"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {(!isAuditor || !canEditPtkDraft) && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                {roleNote ||
                  (!canEditPtkDraft
                    ? 'Mode Hanya Baca aktif: Analisis PLOR+CA & PTK tidak dapat diubah oleh peran ini.'
                    : 'Anda berada pada Mode Auditee. Field penetapan temuan PLOR+CA & override kategori dikunci untuk Auditor AMI. Anda tetap dapat mengusulkan RTL & PIC.')}
              </span>
            </div>
          )}

          {/* Kategori Temuan & Auditor Override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Kategori Temuan Terhitung
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${getKategoriBadgeClasses(
                    effectiveKategori
                  )}`}
                >
                  {effectiveKategori ?? '-'}
                </span>
                {kategoriOverride && (
                  <span className="text-xs text-slate-500">
                    (Override dari: {autoKategori ?? '-'})
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Penetapan Manual Auditor (Opsional)
              </label>
              <select
                disabled={!isAuditor}
                value={kategoriOverride ?? ''}
                onChange={(e) =>
                  setKategoriOverride(
                    e.target.value ? (e.target.value as KategoriTemuan) : null
                  )
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Otomatis ({autoKategori ?? '-'})</option>
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Structured PLOR+CA Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Analisis Temuan Terstruktur (PLOR + CA)
              </h4>
              {isAuditor && (
                <button
                  type="button"
                  onClick={handleSyncNarrativeFromPlor}
                  className="text-xs font-medium text-blue-800 hover:text-blue-950 underline"
                >
                  Gabungkan ke Narasi Akar Masalah
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  P — Problem (Masalah Utama)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.problem}
                  onChange={(e) =>
                    setPlorCa((p) => ({ ...p, problem: e.target.value }))
                  }
                  placeholder="Ketidaksesuaian atau kesenjangan yang ditemukan..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  L — Location (Lokasi / Dokumen / Unit)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.location}
                  onChange={(e) =>
                    setPlorCa((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="Contoh: Arsip Kurikulum Prodi / SIAKAD..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  O — Objective Evidence (Bukti Objektif)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.objectiveEvidence}
                  onChange={(e) =>
                    setPlorCa((p) => ({
                      ...p,
                      objectiveEvidence: e.target.value,
                    }))
                  }
                  placeholder="Fakta terverifikasi saat audit dokumen/wawancara..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  R — Reference (Standar / Regulasi Acuan)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.reference}
                  onChange={(e) =>
                    setPlorCa((p) => ({ ...p, reference: e.target.value }))
                  }
                  placeholder="Contoh: Standar SPMI UNPATTI / Permendikbudristek 53/2023..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  C — Correction (Koreksi Segera)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.correction}
                  onChange={(e) =>
                    setPlorCa((p) => ({ ...p, correction: e.target.value }))
                  }
                  placeholder="Tindakan perbaikan cepat atas temuan..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  A — Action (Tindakan Pencegahan Sistemik)
                </label>
                <textarea
                  rows={2}
                  disabled={!isAuditor}
                  value={plorCa.action}
                  onChange={(e) =>
                    setPlorCa((p) => ({ ...p, action: e.target.value }))
                  }
                  placeholder="Langkah pencegahan agar tidak berulang..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Narrative Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Narasi Akar Masalah / Faktor Penunjang (Tampil di Daftar Temuan & PTK)
            </label>
            <textarea
              rows={3}
              disabled={!isAuditor}
              value={akarMasalah}
              onChange={(e) => setAkarMasalah(e.target.value)}
              placeholder="Ringkasan akar masalah atau faktor penunjang capaian..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          {/* PTK / RTL & Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PTK / RTL (Permintaan Tindakan Koreksi / Rencana Tindak Lanjut)
              </label>
              <textarea
                rows={2}
                disabled={!canEditPtkDraft}
                value={ptkRtl}
                onChange={(e) => setPtkRtl(e.target.value)}
                placeholder="Rencana tindakan koreksi konkret yang disepakati..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PIC (Penanggung Jawab)
              </label>
              <input
                type="text"
                disabled={!canEditPtkDraft}
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Contoh: Kaprodi & GJM Prodi"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Selesai PTK
                </label>
                <input
                  type="date"
                  disabled={!isAuditor}
                  value={waktuPtk}
                  onChange={(e) => setWaktuPtk(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jadwal Monev
                </label>
                <input
                  type="date"
                  disabled={!isAuditor}
                  value={waktuMonev}
                  onChange={(e) => setWaktuMonev(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs font-mono text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {canSaveAny ? 'Batal' : 'Tutup'}
            </button>
            {canSaveAny && (
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Simpan Perubahan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
