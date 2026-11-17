import React from 'react';
import { X, Check, Target } from 'lucide-react';
import { AmiIndicator, KategoriTemuan, RubricLevelKey, UserRole } from '../../types/ami';
import {
  getKategoriBadgeClasses,
  getKategoriTemuan,
  getSebutan,
} from '../../utils/amiCalculations';
import {
  Language,
  translateIndicatorUraian,
  translateRubricText,
  translateSebutan,
  translateKategori,
} from '../../utils/i18n';

interface RubricDrawerProps {
  indicator: AmiIndicator | null;
  currentScore: RubricLevelKey | null;
  currentTarget: RubricLevelKey | null;
  kategoriOverride: KategoriTemuan | null;
  role: UserRole;
  canEditScore?: boolean;
  canEditTarget?: boolean;
  roleLabel?: string;
  showToast?: (msg: string) => void;
  onClose: () => void;
  onUpdate: (
    indicatorId: string,
    score: RubricLevelKey | null,
    target: RubricLevelKey | null
  ) => void;
  lang?: Language;
}

const LEVELS: RubricLevelKey[] = [1, 2, 3, 4, 5, 6, 7];

export const RubricDrawer: React.FC<RubricDrawerProps> = ({
  indicator,
  currentScore,
  currentTarget,
  kategoriOverride,
  role,
  canEditScore = true,
  canEditTarget = true,
  roleLabel,
  showToast,
  onClose,
  onUpdate,
  lang = 'ID',
}) => {
  if (!indicator) return null;

  const kategori = getKategoriTemuan(currentScore, currentTarget, kategoriOverride);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-white border-l border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono tabular-nums">
              <span>{lang === 'EN' ? 'Indicator' : 'Indikator'} {indicator.code}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'EN' ? 'Rubric Scale 1–7' : 'Skala Rubrik 1–7'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {roleLabel ||
                  (lang === 'EN'
                    ? role === 'auditor'
                      ? 'Auditor Mode'
                      : 'Auditee Mode'
                    : role === 'auditor'
                    ? 'Mode Auditor'
                    : 'Mode Auditee')}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-semibold leading-snug text-white">
              {translateIndicatorUraian(indicator.uraian, lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
            aria-label={lang === 'EN' ? 'Close rubric panel' : 'Tutup panel rubrik'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Calculation Summary Bar */}
        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3.5 text-xs">
          <div>
            <div className="text-slate-500">
              {lang === 'EN' ? 'Current Achievement Score' : 'Nilai Capaian Saat Ini'}
            </div>
            <div className="mt-0.5 font-semibold text-slate-900 font-mono tabular-nums">
              {currentScore !== null
                ? `${currentScore} — ${translateSebutan(getSebutan(currentScore), lang)}`
                : lang === 'EN'
                ? 'Not Scored'
                : 'Belum Dinilai'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">
              {lang === 'EN' ? 'Target in 1 Year' : 'Target 1 Tahun yad'}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <select
                disabled={!canEditTarget}
                value={currentTarget ?? ''}
                onChange={(e) =>
                  onUpdate(
                    indicator.id,
                    currentScore,
                    e.target.value
                      ? (Number(e.target.value) as RubricLevelKey)
                      : null
                  )
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-semibold text-slate-900 focus:border-blue-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">
                  {lang === 'EN' ? '-- Select Target --' : '-- Pilih Target --'}
                </option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl} — {translateSebutan(getSebutan(lvl), lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div className="text-slate-500">
              {lang === 'EN' ? 'Finding Category (Auto)' : 'Kategori Temuan (Auto)'}
            </div>
            <div className="mt-1">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getKategoriBadgeClasses(
                  kategori
                )}`}
              >
                {kategori ? translateKategori(kategori, lang) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Rubric Level Selector List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
          <div className="text-xs font-medium text-slate-500 pb-1">
            {canEditScore
              ? lang === 'EN'
                ? 'Select the description that best fits the Study Program current condition (Score 1 to 7):'
                : 'Pilih deskripsi kondisi Program Studi yang paling sesuai saat ini (Skor 1 hingga 7):'
              : lang === 'EN'
              ? 'Read-Only Mode: Achievement score can only be modified by AMI Auditor / Admin.'
              : 'Mode Hanya Baca: Penilaian skor capaian hanya dapat diubah oleh Auditor AMI / Admin.'}
          </div>

          {LEVELS.map((lvl) => {
            const isSelected = currentScore === lvl;
            const isTarget = currentTarget === lvl;

            return (
              <button
                key={lvl}
                type="button"
                disabled={!canEditScore}
                onClick={() => canEditScore && onUpdate(indicator.id, lvl, currentTarget)}
                className={`w-full text-left rounded-lg border p-3.5 transition-colors flex items-start gap-3.5 disabled:cursor-default ${
                  isSelected
                    ? 'border-blue-800 bg-blue-50/70'
                    : canEditScore
                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50/50 opacity-85'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold tabular-nums border ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {translateSebutan(getSebutan(lvl), lang)}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {isTarget && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Target className="h-3.5 w-3.5" />
                          {lang === 'EN' ? 'Target in 1 Yr' : 'Target 1 Th yad'}
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-blue-800 font-semibold">
                          <Check className="h-3.5 w-3.5" />
                          {lang === 'EN' ? 'Selected' : 'Dipilih'}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {translateRubricText(indicator.rubric_levels[lvl], lang, lvl)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            {lang === 'EN'
              ? 'Score changes automatically update Standard Recaps, Charts, & Findings List.'
              : 'Perubahan nilai otomatis memperbarui Rekap Standar, Grafik, & Daftar Temuan.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {lang === 'EN' ? 'Done' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
};
