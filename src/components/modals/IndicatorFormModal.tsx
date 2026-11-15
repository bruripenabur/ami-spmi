import React, { useEffect, useState } from 'react';
import { X, Sparkles, Save, PlusCircle } from 'lucide-react';
import {
  AmiIndicator,
  AmiStandard,
  RubricLevelKey,
} from '../../types/ami';

interface IndicatorFormModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  standards: AmiStandard[];
  initialIndicator: AmiIndicator | null;
  defaultStandardId?: number;
  existingIndicators: AmiIndicator[];
  onClose: () => void;
  onSubmit: (indicator: AmiIndicator) => void;
}

const LEVELS: RubricLevelKey[] = [1, 2, 3, 4, 5, 6, 7];

const LEVEL_HINTS: Record<RubricLevelKey, string> = {
  1: 'Perbaikan menyeluruh dan mendesak (Skor 1)',
  2: 'Perbaikan mayor (Skor 2)',
  3: 'Perbaikan minor (Skor 3)',
  4: 'Cukup (Skor 4)',
  5: 'Lebih dari Cukup (Skor 5)',
  6: 'Baik (Skor 6)',
  7: 'Sangat Baik / Melampaui Standar (Skor 7)',
};

function buildDefaultRubric(subjectText: string): Record<RubricLevelKey, string> {
  const clean = subjectText.trim() || 'indikator mutu ini';
  return {
    1: `Tidak terdapat kebijakan, pedoman, maupun implementasi terkait ${clean}.`,
    2: `Terdapat praktik insidental terkait ${clean}, namun belum memiliki dokumen kebijakan dan pedoman tertulis.`,
    3: `Terdapat dokumen kebijakan tertulis mengenai ${clean}, tetapi implementasinya belum menyeluruh dan belum konsisten.`,
    4: `Terdapat dokumen kebijakan dan pedoman ${clean} yang memadai serta mulai diimplementasikan pada sebagian unit/mata kuliah.`,
    5: `Implementasi ${clean} berjalan konsisten sesuai pedoman, namun evaluasi dan tindak lanjutnya belum terdokumentasi berkala.`,
    6: `Implementasi ${clean} berjalan baik, terdokumentasi lengkap, dan dievaluasi secara berkala setiap tahun akademik.`,
    7: `Implementasi ${clean} berjalan sangat baik, terintegrasi sistem informasi mutu, dievaluasi berkelanjutan, dan menunjukkan peningkatan capaian nyata.`,
  };
}

export const IndicatorFormModal: React.FC<IndicatorFormModalProps> = ({
  isOpen,
  mode,
  standards,
  initialIndicator,
  defaultStandardId,
  existingIndicators,
  onClose,
  onSubmit,
}) => {
  const [standardId, setStandardId] = useState<number>(defaultStandardId ?? 1);
  const [code, setCode] = useState<string>('');
  const [uraian, setUraian] = useState<string>('');
  const [rubrics, setRubrics] = useState<Record<RubricLevelKey, string>>(() =>
    buildDefaultRubric('')
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (mode === 'edit' && initialIndicator) {
      setStandardId(initialIndicator.standard_id);
      setCode(initialIndicator.code);
      setUraian(initialIndicator.uraian);
      setRubrics({ ...initialIndicator.rubric_levels });
    } else {
      const targetStd = defaultStandardId ?? 1;
      const inStd = existingIndicators.filter((i) => i.standard_id === targetStd);
      const suggestedCode = `${targetStd}.${inStd.length + 1}`;
      setStandardId(targetStd);
      setCode(suggestedCode);
      setUraian('');
      setRubrics(buildDefaultRubric(''));
    }
  }, [isOpen, mode, initialIndicator, defaultStandardId, existingIndicators]);

  if (!isOpen) return null;

  const handleStdChange = (nextStd: number) => {
    setStandardId(nextStd);
    if (mode === 'add') {
      const inStd = existingIndicators.filter((i) => i.standard_id === nextStd);
      setCode(`${nextStd}.${inStd.length + 1}`);
    }
  };

  const handleAutoFillRubrics = () => {
    setRubrics(buildDefaultRubric(uraian));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Kode butir indikator wajib diisi (contoh: 1.11).');
      return;
    }
    if (!uraian.trim()) {
      setError('Uraian indikator wajib diisi.');
      return;
    }
    for (const lvl of LEVELS) {
      if (!rubrics[lvl]?.trim()) {
        setError(`Deskripsi rubrik skor ${lvl} wajib diisi.`);
        return;
      }
    }

    const id =
      mode === 'edit' && initialIndicator
        ? initialIndicator.id
        : `ind-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    onSubmit({
      id,
      standard_id: standardId,
      code: code.trim(),
      uraian: uraian.trim(),
      rubric_levels: {
        1: rubrics[1].trim(),
        2: rubrics[2].trim(),
        3: rubrics[3].trim(),
        4: rubrics[4].trim(),
        5: rubrics[5].trim(),
        6: rubrics[6].trim(),
        7: rubrics[7].trim(),
      },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            {mode === 'add' ? (
              <PlusCircle className="h-5 w-5 text-amber-400" />
            ) : (
              <Save className="h-5 w-5 text-amber-400" />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {mode === 'add'
                  ? 'Tambah Indikator Standar SPMI Baru'
                  : `Edit Indikator ${initialIndicator?.code ?? ''}`}
              </h3>
              <p className="text-xs text-slate-300">
                Modul 02 · Pengaturan butir evaluasi & rubrik penilaian skala 1–7
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Tutup modal indikator"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Standar SPMI
              </label>
              <select
                value={standardId}
                onChange={(e) => handleStdChange(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              >
                {standards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.nama} ({s.kode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kode / No. Butir
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: 1.11"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Uraian Indikator Mutu
            </label>
            <textarea
              rows={2}
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="Tuliskan pernyataan indikator mutu secara jelas..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Deskripsi Rubrik Penilaian (Skala 1 – 7)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Menentukan deskripsi "Keadaan Prodi Saat Ini" untuk tiap tingkatan skor.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillRubrics}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Isi Template Rubrik Otomatis
              </button>
            </div>

            <div className="space-y-2.5">
              {LEVELS.map((lvl) => (
                <div
                  key={lvl}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Skor {lvl} — {LEVEL_HINTS[lvl]}
                  </label>
                  <textarea
                    rows={2}
                    value={rubrics[lvl]}
                    onChange={(e) =>
                      setRubrics((prev) => ({ ...prev, [lvl]: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Save className="h-3.5 w-3.5 text-amber-400" />
              {mode === 'add' ? 'Simpan Indikator Baru' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
