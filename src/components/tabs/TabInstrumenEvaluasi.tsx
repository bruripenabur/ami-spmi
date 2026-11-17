import React, { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  SlidersHorizontal,
  ClipboardEdit,
  BookOpen,
  Download,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  AuditLogEntry,
  JenisProdi,
  KategoriTemuan,
  RbacRole,
  RubricLevelKey,
  UserRole,
} from '../../types/ami';
import {
  createDefaultEvaluation,
  getKategoriBadgeClasses,
  getKategoriTemuan,
  getScoreCellClasses,
  getSebutan,
} from '../../utils/amiCalculations';
import { IndicatorFormModal } from '../modals/IndicatorFormModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import {
  Language,
  translateStandardName,
  translateKategori,
  translateIndicatorUraian,
  translateRubricText,
  translateSebutan,
} from '../../utils/i18n';

interface TabInstrumenEvaluasiProps {
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  auditLogs?: AuditLogEntry[];
  jenisProdi?: JenisProdi;
  role: UserRole;
  userRbacRole?: RbacRole;
  canScore?: boolean;
  canEditEvidence?: boolean;
  canCrudIndicators?: boolean;
  canEditPtk?: boolean;
  canEditPlorCa?: boolean;
  allowedStandardIds?: number[] | 'all';
  roleSummaryNote?: string;
  activeStandardFilter: number | 'all';
  onChangeStandardFilter: (val: number | 'all') => void;
  onOpenRubric: (indicator: AmiIndicator) => void;
  onOpenPlorCa: (indicator: AmiIndicator) => void;
  onUpdateEvaluation: (
    indicatorId: string,
    patch: Partial<AmiEvaluation>
  ) => void;
  onDownloadTemplate: () => void;
  onAddIndicator: (indicator: AmiIndicator) => void;
  onUpdateIndicator: (indicator: AmiIndicator) => void;
  onDeleteIndicator: (indicatorId: string) => void;
  canExport?: boolean;
  lang?: Language;
}

const SCORE_LEVELS: RubricLevelKey[] = [1, 2, 3, 4, 5, 6, 7];
const KATEGORI_OPTIONS: KategoriTemuan[] = [
  'Mayor',
  'Minor',
  'Observasi',
  'Sesuai (Baik)',
  'Best Practice',
];

export const TabInstrumenEvaluasi: React.FC<TabInstrumenEvaluasiProps> = ({
  standards,
  indicators,
  evaluations,
  auditLogs,
  jenisProdi = 'Non-Kependidikan',
  role,
  userRbacRole,
  canScore,
  canEditEvidence,
  canCrudIndicators = true,
  canEditPtk,
  canEditPlorCa,
  allowedStandardIds = 'all',
  roleSummaryNote,
  activeStandardFilter,
  onChangeStandardFilter,
  onOpenRubric,
  onOpenPlorCa,
  onUpdateEvaluation,
  onDownloadTemplate,
  onAddIndicator,
  onUpdateIndicator,
  onDeleteIndicator,
  canExport = false,
  lang = 'ID',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('all');
  const [formModalState, setFormModalState] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    indicator: AmiIndicator | null;
  }>({ open: false, mode: 'add', indicator: null });
  const [deleteTarget, setDeleteTarget] = useState<AmiIndicator | null>(null);

  const isAuditor = canScore !== undefined ? canScore : role === 'auditor';
  const allowEvidence =
    canEditEvidence !== undefined ? canEditEvidence : role === 'auditee';
  const isKaprodi =
    userRbacRole === 'kaprodi' || (!isAuditor && role === 'auditee');
  const allowPtk = canEditPtk !== undefined ? canEditPtk : true;
  const allowDates = canEditPlorCa !== undefined ? canEditPlorCa : isAuditor;

  const visibleStandards = useMemo(() => {
    if (allowedStandardIds === 'all') return standards;
    return standards.filter((s) => allowedStandardIds.includes(s.id));
  }, [standards, allowedStandardIds]);

  const groupedByStandard = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleStandards
      .filter((s) => activeStandardFilter === 'all' || s.id === activeStandardFilter)
      .map((std) => {
        const rows = indicators.filter((ind) => {
          if (ind.standard_id !== std.id) return false;
          const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
          const kat = getKategoriTemuan(
            ev.nilai_capaian,
            ev.target_1_yr,
            ev.kategori_override
          );
          if (!isKaprodi && kategoriFilter !== 'all' && kat !== kategoriFilter) return false;
          if (!q) return true;
          return (
            ind.code.toLowerCase().includes(q) ||
            ind.uraian.toLowerCase().includes(q) ||
            ev.akar_masalah.toLowerCase().includes(q) ||
            ev.ptk_rtl.toLowerCase().includes(q)
          );
        });
        return { standard: std, rows };
      })
      .filter((g) => g.rows.length > 0);
  }, [visibleStandards, indicators, evaluations, activeStandardFilter, searchQuery, kategoriFilter, isKaprodi]);

  return (
    <div className="space-y-4">
      {/* Control & Standard Filter Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isKaprodi
                  ? (lang === 'EN'
                      ? `Study Program Self-Evaluation Instrument (${visibleStandards.length} SPMI Standards)`
                      : `Instrumen Evaluasi Diri Program Studi (${visibleStandards.length} Standar SPMI)`)
                  : (lang === 'EN'
                      ? `Self-Evaluation & Auditor Assessment Instrument (${visibleStandards.length} SPMI Standards)`
                      : `Instrumen Evaluasi Diri & Penilaian Auditor (${visibleStandards.length} Standar SPMI)`)}
              </h2>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                  jenisProdi === 'Kependidikan'
                    ? 'border-blue-300 bg-blue-50 text-blue-900'
                    : 'border-slate-300 bg-slate-100 text-slate-700'
                }`}
              >
                {lang === 'EN'
                  ? `${jenisProdi === 'Kependidikan' ? 'Educational' : 'Non-Educational'} Instrument (${indicators.length} Indicators)`
                  : `Instrumen ${jenisProdi} (${indicators.length} Indikator)`}
              </span>
              {isKaprodi && (
                <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900">
                  {lang === 'EN' ? 'Study Program Head View (6 Columns)' : 'Tampilan Kaprodi (6 Kolom Mutu)'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {roleSummaryNote ||
                (isKaprodi
                  ? (lang === 'EN'
                      ? 'Study Program Head (Auditee) access active: Select current condition (rubric 1-7), achievement score, target in 1 year, and upload document evidence.'
                      : 'Hak Akses Kaprodi (Auditee) aktif: Isi opsi keadaan prodi saat ini (rubrik 1–7), nilai capaian, target 1 tahun yad, dan unggah tautan bukti dokumen.')
                  : isAuditor
                  ? (lang === 'EN'
                      ? 'Auditor Evaluation active: score, rubric condition, PLOR+CA root cause, and CAR schedule can be filled.'
                      : 'Hak Akses Penilaian aktif: skor capaian, opsi keadaan prodi saat ini, analisis PLOR+CA, dan jadwal PTK dapat diisi.')
                  : allowEvidence
                  ? (lang === 'EN'
                      ? 'Study Program access active: upload evidence link/file, target in 1 year, and CAR action plan.'
                      : 'Hak Akses Prodi aktif: unggah tautan bukti dokumen, target 1 tahun, dan rencana PTK/RTL.')
                  : (lang === 'EN'
                      ? 'Inspection / Monitoring mode active: reviewing standards achievement and documentary evidence.'
                      : 'Mode Inspeksi / Monitoring aktif: peninjauan capaian standar & kelengkapan dokumen bukti.'))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isKaprodi && canCrudIndicators && (
              <button
                type="button"
                onClick={() =>
                  setFormModalState({ open: true, mode: 'add', indicator: null })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                {lang === 'EN' ? 'Add Indicator' : 'Tambah Indikator'}
              </button>
            )}
            {(userRbacRole === 'admin' || canExport) && (
              <button
                type="button"
                onClick={onDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-900 bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-950 transition-colors whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                {lang === 'EN' ? 'Download Instrument Template (.xlsx)' : 'Unduh Template Instrumen (.xlsx)'}
              </button>
            )}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'EN'
                    ? 'Search indicator, description...'
                    : (isKaprodi ? 'Cari indikator, uraian...' : 'Cari indikator, uraian, PTK...')
                }
                className="w-56 rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            {!isKaprodi && (
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none"
                >
                  <option value="all">{lang === 'EN' ? 'All Categories' : 'Semua Kategori'}</option>
                  <option value="Mayor">{translateKategori('Mayor', lang)}</option>
                  <option value="Minor">{translateKategori('Minor', lang)}</option>
                  <option value="Observasi">{translateKategori('Observasi', lang)}</option>
                  <option value="Sesuai (Baik)">{translateKategori('Sesuai (Baik)', lang)}</option>
                  <option value="Best Practice">Best Practice</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Standard Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onChangeStandardFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeStandardFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {lang === 'EN' ? `All Standards (${visibleStandards.length})` : `Semua Standar (${visibleStandards.length})`}
          </button>
          {visibleStandards.map((std) => (
            <button
              key={std.id}
              type="button"
              onClick={() => onChangeStandardFilter(std.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeStandardFilter === std.id
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {std.id}. {translateStandardName(std.nama, lang).replace(/^(Standar|Standard)\s+/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main High-Density Evaluation Table(s) */}
      {groupedByStandard.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Tidak ada indikator yang cocok dengan filter pencarian Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setKategoriFilter('all');
              onChangeStandardFilter('all');
            }}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Tampilkan Semua Indikator
          </button>
        </div>
      ) : (
        groupedByStandard.map(({ standard, rows }) => (
          <div
            key={standard.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3 text-white">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-amber-400">
                  {standard.kode}
                </span>
                <h3 className="text-sm font-semibold">
                  {standard.id}. {translateStandardName(standard.nama, lang).toUpperCase()}
                </h3>
              </div>
              <span className="text-xs text-slate-300 font-mono tabular-nums">
                {rows.length} {lang === 'EN' ? 'Indicators' : 'Indikator'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table
                className={`w-full ${
                  isKaprodi ? 'min-w-[960px]' : 'min-w-[1460px]'
                } border-collapse text-left text-xs`}
              >
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 border-b border-slate-200">
                  {isKaprodi ? (
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-16">No</th>
                      <th className="px-3 py-2.5 font-semibold w-80">
                        {lang === 'EN' ? 'Indicator Description' : 'Uraian Indikator'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-96">
                        {lang === 'EN' ? 'Current State (Click Rubric 1–7)' : 'Keadaan Prodi Saat Ini (Klik Rubrik 1–7)'}
                      </th>
                      <th className="px-2.5 py-2.5 font-semibold text-center w-24">
                        {lang === 'EN' ? 'Achievement' : 'Nilai Capaian'}
                      </th>
                      <th className="px-2.5 py-2.5 font-semibold text-center w-24">
                        {lang === 'EN' ? 'Target in 1 Yr' : 'Target 1 Th yad'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-72">
                        {lang === 'EN' ? 'Evidence Link / File' : 'Bukti Link Dokumen (opsional)'}
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2.5 font-semibold w-14">No</th>
                      <th className="px-3 py-2.5 font-semibold w-64">
                        {lang === 'EN' ? 'Indicator Description' : 'Uraian Indikator'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-72">
                        {lang === 'EN' ? 'Current State (Click Rubric 1–7)' : 'Keadaan Prodi Saat Ini (Klik Rubrik 1–7)'}
                      </th>
                      <th className="px-2.5 py-2.5 font-semibold text-center w-20">
                        {lang === 'EN' ? 'Score' : 'Nilai Capaian'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-36">
                        {lang === 'EN' ? 'Predicate' : 'Sebutan Capaian'}
                      </th>
                      <th className="px-2.5 py-2.5 font-semibold text-center w-20">
                        {lang === 'EN' ? 'Target 1 Yr' : 'Target 1 Th yad'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-36">
                        {lang === 'EN' ? 'Target Predicate' : 'Sebutan Target'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-32">
                        {lang === 'EN' ? 'Findings' : 'Kategori Temuan'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-56">
                        {lang === 'EN' ? 'Root Cause (PLOR+CA)' : 'Akar Masalah / Penunjang (PLOR+CA)'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-48">
                        {lang === 'EN' ? 'CAR / RTL Plan' : 'PTK / RTL'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-36">
                        {lang === 'EN' ? 'PIC' : 'PIC'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-32">
                        {lang === 'EN' ? 'CAR Schedule' : 'Waktu Selesai PTK'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-32">
                        {lang === 'EN' ? 'Monev Schedule' : 'Waktu Monev'}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-44">
                        {lang === 'EN' ? 'Evidence Link / File' : 'Bukti Link Dokumen'}
                      </th>
                      {canCrudIndicators && (
                        <th className="px-3 py-2.5 font-semibold text-center w-24">
                          {lang === 'EN' ? 'Actions' : 'Aksi'}
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((ind) => {
                    const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
                    const kategori = getKategoriTemuan(
                      ev.nilai_capaian,
                      ev.target_1_yr,
                      ev.kategori_override
                    );
                    const hasPlor = Boolean(
                      ev.plor_ca.problem ||
                        ev.plor_ca.objectiveEvidence ||
                        ev.plor_ca.action
                    );

                    if (isKaprodi) {
                      return (
                        <tr
                          key={ind.id}
                          className="align-top hover:bg-slate-50/70 transition-colors"
                        >
                          {/* 1. No */}
                          <td className="px-3 py-3 font-mono font-semibold text-slate-900 tabular-nums">
                            {ind.code}
                          </td>

                          {/* 2. Uraian Indikator */}
                          <td className="px-3 py-3 text-slate-800 leading-relaxed">
                            {translateIndicatorUraian(ind.uraian, lang)}
                          </td>

                          {/* 3. Keadaan Prodi Saat Ini (Klik Rubrik 1–7) */}
                          <td className="px-3 py-3">
                            <div className="space-y-1.5">
                              <select
                                aria-label={`Opsi Keadaan Prodi ${ind.code}`}
                                value={ev.nilai_capaian ?? ''}
                                onChange={(e) =>
                                  onUpdateEvaluation(ind.id, {
                                    nilai_capaian: e.target.value
                                      ? (Number(e.target.value) as RubricLevelKey)
                                      : null,
                                  })
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                              >
                                <option value="">
                                  {lang === 'EN'
                                    ? '-- Select Current Condition (1-7) --'
                                    : '-- Pilih Kondisi Prodi Saat Ini (1-7) --'}
                                </option>
                                {SCORE_LEVELS.map((lvl) => (
                                  <option key={lvl} value={lvl}>
                                    {lvl}. {translateRubricText(ind.rubric_levels[lvl], lang, lvl)}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => onOpenRubric(ind)}
                                className="group w-full text-left rounded-md border border-slate-200 bg-slate-50/60 hover:border-blue-700 hover:bg-blue-50/40 p-2 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-blue-900 mb-1">
                                  <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {ev.nilai_capaian !== null
                                      ? (lang === 'EN' ? `Score ${ev.nilai_capaian}` : `Skor ${ev.nilai_capaian}`)
                                      : (lang === 'EN' ? 'Not Scored' : 'Belum Dinilai')}
                                  </span>
                                  <span className="text-slate-400 group-hover:text-blue-700">
                                    {lang === 'EN' ? 'View Rubric →' : 'Lihat Rubrik →'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-snug line-clamp-3">
                                  {ev.nilai_capaian !== null
                                    ? translateRubricText(ind.rubric_levels[ev.nilai_capaian], lang, ev.nilai_capaian)
                                    : (lang === 'EN'
                                        ? 'No score filled yet. Click to view rubric scale 1–7 description.'
                                        : 'Belum ada isian nilai capaian. Klik untuk melihat deskripsi rubrik skala 1–7.')}
                                </p>
                              </button>
                            </div>
                          </td>

                          {/* 4. Nilai Capaian */}
                          <td className="px-2.5 py-3 text-center">
                            <select
                              aria-label={`Nilai capaian ${ind.code}`}
                              value={ev.nilai_capaian ?? ''}
                              onChange={(e) =>
                                onUpdateEvaluation(ind.id, {
                                  nilai_capaian: e.target.value
                                    ? (Number(e.target.value) as RubricLevelKey)
                                    : null,
                                })
                              }
                              className={`w-14 rounded-md border px-1.5 py-1.5 text-center font-mono font-bold tabular-nums focus:outline-none ${getScoreCellClasses(
                                ev.nilai_capaian
                              )}`}
                            >
                              <option value="">-</option>
                              {SCORE_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 5. Target 1 Th yad */}
                          <td className="px-2.5 py-3 text-center">
                            <select
                              aria-label={`Target 1 tahun ${ind.code}`}
                              value={ev.target_1_yr ?? ''}
                              onChange={(e) =>
                                onUpdateEvaluation(ind.id, {
                                  target_1_yr: e.target.value
                                    ? (Number(e.target.value) as RubricLevelKey)
                                    : null,
                                })
                              }
                              className={`w-14 rounded-md border px-1.5 py-1.5 text-center font-mono font-bold tabular-nums focus:outline-none ${getScoreCellClasses(
                                ev.target_1_yr
                              )}`}
                            >
                              <option value="">-</option>
                              {SCORE_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 6. Bukti Link Dokumen (opsional) */}
                          <td className="px-3 py-3 space-y-1.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="url"
                                value={ev.bukti_link}
                                onChange={(e) =>
                                  onUpdateEvaluation(ind.id, {
                                    bukti_link: e.target.value,
                                  })
                                }
                                placeholder="https://drive.google.com/..."
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none"
                              />
                              {ev.bukti_link && (
                                <a
                                  href={ev.bukti_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded border border-slate-200 bg-slate-50 p-1.5 text-blue-800 hover:bg-blue-50 shrink-0"
                                  title="Buka tautan dokumen bukti"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <label className="cursor-pointer inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-slate-700 font-medium">
                                <span>{lang === 'EN' ? 'Upload File' : 'Unggah File'}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (uploadEvent) => {
                                      const base64String = uploadEvent.target?.result as string;
                                      onUpdateEvaluation(ind.id, {
                                        bukti_file_name: file.name,
                                        bukti_file_data: base64String,
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                              {ev.bukti_file_name && (
                                <div className="flex items-center gap-1 truncate">
                                  <a
                                    href={ev.bukti_file_data || '#'}
                                    download={ev.bukti_file_name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 underline truncate max-w-[110px]"
                                    title={ev.bukti_file_name}
                                  >
                                    {ev.bukti_file_name}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateEvaluation(ind.id, {
                                        bukti_file_name: undefined,
                                        bukti_file_data: undefined,
                                      })
                                    }
                                    className="text-red-600 hover:text-red-800 font-bold px-1"
                                    title="Hapus file"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={ind.id}
                        className="align-top hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-3 py-3 font-mono font-semibold text-slate-900 tabular-nums">
                          {ind.code}
                        </td>
                        <td className="px-3 py-3 text-slate-800 leading-relaxed">
                          {translateIndicatorUraian(ind.uraian, lang)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1.5">
                            {isAuditor && (
                              <select
                                aria-label={`Opsi Keadaan Prodi ${ind.code}`}
                                value={ev.nilai_capaian ?? ''}
                                onChange={(e) =>
                                  onUpdateEvaluation(ind.id, {
                                    nilai_capaian: e.target.value
                                      ? (Number(e.target.value) as RubricLevelKey)
                                      : null,
                                  })
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
                              >
                                <option value="">
                                  {lang === 'EN' ? '-- Select Condition (1-7) --' : '-- Pilih Kondisi (1-7) --'}
                                </option>
                                {SCORE_LEVELS.map((lvl) => (
                                  <option key={lvl} value={lvl}>
                                    {lvl}. {translateRubricText(ind.rubric_levels[lvl], lang, lvl)}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenRubric(ind)}
                              className="group w-full text-left rounded-md border border-slate-200 bg-slate-50/60 hover:border-blue-700 hover:bg-blue-50/40 p-2 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-blue-900 mb-1">
                                <span className="inline-flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {ev.nilai_capaian !== null
                                    ? (lang === 'EN' ? `Score ${ev.nilai_capaian}` : `Skor ${ev.nilai_capaian}`)
                                    : (lang === 'EN' ? 'Not Scored' : 'Belum Dinilai')}
                                </span>
                                <span className="text-slate-400 group-hover:text-blue-700">
                                  {isAuditor
                                    ? (lang === 'EN' ? 'Rubric Details →' : 'Detail Rubrik →')
                                    : (lang === 'EN' ? 'View Rubric →' : 'Lihat Rubrik →')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-snug line-clamp-3">
                                {ev.nilai_capaian !== null
                                  ? translateRubricText(ind.rubric_levels[ev.nilai_capaian], lang, ev.nilai_capaian)
                                  : (lang === 'EN'
                                      ? 'No score filled yet. Click to view rubric scale 1–7 description.'
                                      : 'Belum ada isian nilai capaian. Klik untuk melihat deskripsi rubrik skala 1–7.')}
                              </p>
                            </button>
                          </div>
                        </td>
                        <td className="px-2.5 py-3 text-center">
                          <select
                            aria-label={`Nilai capaian ${ind.code}`}
                            disabled={!isAuditor}
                            value={ev.nilai_capaian ?? ''}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, {
                                nilai_capaian: e.target.value
                                  ? (Number(e.target.value) as RubricLevelKey)
                                  : null,
                              })
                            }
                            className={`w-14 rounded-md border px-1.5 py-1.5 text-center font-mono font-bold tabular-nums focus:outline-none disabled:opacity-80 ${getScoreCellClasses(
                              ev.nilai_capaian
                            )}`}
                          >
                            <option value="">-</option>
                            {SCORE_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium">
                          {translateSebutan(getSebutan(ev.nilai_capaian), lang)}
                        </td>
                        <td className="px-2.5 py-3 text-center">
                          <select
                            aria-label={`Target 1 tahun ${ind.code}`}
                            disabled={!allowEvidence && !isAuditor}
                            value={ev.target_1_yr ?? ''}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, {
                                target_1_yr: e.target.value
                                  ? (Number(e.target.value) as RubricLevelKey)
                                  : null,
                              })
                            }
                            className={`w-14 rounded-md border px-1.5 py-1.5 text-center font-mono font-bold tabular-nums focus:outline-none disabled:opacity-80 ${getScoreCellClasses(
                              ev.target_1_yr
                            )}`}
                          >
                            <option value="">-</option>
                            {SCORE_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium">
                          {translateSebutan(getSebutan(ev.target_1_yr), lang)}
                        </td>
                        <td className="px-3 py-3">
                          {isAuditor ? (
                            <div className="space-y-1">
                              <select
                                aria-label={`Kategori Temuan ${ind.code}`}
                                value={ev.kategori_override ?? ''}
                                onChange={(e) =>
                                  onUpdateEvaluation(ind.id, {
                                    kategori_override: e.target.value
                                      ? (e.target.value as KategoriTemuan)
                                      : null,
                                  })
                                }
                                className={`rounded px-2 py-1 text-[11px] font-semibold focus:outline-none ${getKategoriBadgeClasses(
                                  kategori
                                )}`}
                              >
                                <option value="">
                                  {getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, null)
                                    ? translateKategori(getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, null)!, lang)
                                    : '-'}{' '}
                                  (Auto)
                                </option>
                                {KATEGORI_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {translateKategori(opt, lang)}
                                  </option>
                                ))}
                              </select>
                              {ev.kategori_override && (
                                <div className="text-[10px] text-slate-500">
                                  {lang === 'EN' ? 'Auditor Override' : 'Manual Auditor'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <span
                                className={`inline-block rounded px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${getKategoriBadgeClasses(
                                  kategori
                                )}`}
                              >
                                {kategori ? translateKategori(kategori, lang) : '-'}
                              </span>
                              {ev.kategori_override && (
                                <div className="mt-1 text-[10px] text-slate-500">
                                  {lang === 'EN' ? 'Auditor Override' : 'Manual Auditor'}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => onOpenPlorCa(ind)}
                            className="w-full text-left rounded-md border border-slate-200 bg-white hover:border-blue-700 p-2 transition-colors"
                          >
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                              <span className="inline-flex items-center gap-1">
                                <ClipboardEdit className="h-3 w-3 text-blue-800" />
                                {hasPlor
                                  ? (lang === 'EN' ? 'CAR+PLOR Filled' : 'PLOR+CA Terisi')
                                  : (lang === 'EN' ? 'Fill CAR+PLOR' : 'Isi PLOR+CA')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {ev.akar_masalah ||
                                ev.plor_ca.problem ||
                                (lang === 'EN'
                                  ? 'Click to record root causes / driving factors...'
                                  : 'Klik untuk mencatat akar masalah / faktor penunjang...')}
                            </p>
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <textarea
                            rows={2}
                            disabled={!allowPtk}
                            value={ev.ptk_rtl}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, {
                                ptk_rtl: e.target.value,
                              })
                            }
                            placeholder={lang === 'EN' ? 'CAR / RTL Action Plan...' : 'Rencana PTK / RTL...'}
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            disabled={!allowPtk}
                            value={ev.pic}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, { pic: e.target.value })
                            }
                            placeholder={lang === 'EN' ? 'Person in charge' : 'Penanggung jawab'}
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            disabled={!allowDates}
                            value={ev.waktu_ptk}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, {
                                waktu_ptk: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            disabled={!allowDates}
                            value={ev.waktu_monev}
                            onChange={(e) =>
                              onUpdateEvaluation(ind.id, {
                                waktu_monev: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </td>
                        <td className="px-3 py-3 space-y-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="url"
                              disabled={!allowEvidence && !isAuditor}
                              value={ev.bukti_link}
                              onChange={(e) =>
                                onUpdateEvaluation(ind.id, {
                                  bukti_link: e.target.value,
                                })
                              }
                              placeholder="https://drive.google.com/..."
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                            />
                            {ev.bukti_link && (
                              <a
                                href={ev.bukti_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-slate-200 bg-slate-50 p-1.5 text-blue-800 hover:bg-blue-50 shrink-0"
                                title="Buka tautan dokumen bukti"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <label className={`cursor-pointer inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-slate-700 font-medium ${!allowEvidence && !isAuditor ? 'opacity-50 pointer-events-none' : ''}`}>
                              <span>{lang === 'EN' ? 'Upload File' : 'Unggah File'}</span>
                              <input
                                type="file"
                                disabled={!allowEvidence && !isAuditor}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    const base64String = uploadEvent.target?.result as string;
                                    onUpdateEvaluation(ind.id, {
                                      bukti_file_name: file.name,
                                      bukti_file_data: base64String,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                            {ev.bukti_file_name && (
                              <div className="flex items-center gap-1 truncate">
                                <a
                                  href={ev.bukti_file_data || '#'}
                                  download={ev.bukti_file_name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 underline truncate max-w-[110px]"
                                  title={ev.bukti_file_name}
                                >
                                  {ev.bukti_file_name}
                                </a>
                                <button
                                  type="button"
                                  disabled={!allowEvidence && !isAuditor}
                                  onClick={() =>
                                    onUpdateEvaluation(ind.id, {
                                      bukti_file_name: undefined,
                                      bukti_file_data: undefined,
                                    })
                                  }
                                  className="text-red-600 hover:text-red-800 font-bold px-1"
                                  title="Hapus file"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        {canCrudIndicators && (
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormModalState({
                                    open: true,
                                    mode: 'edit',
                                    indicator: ind,
                                  })
                                }
                                title={`Edit indikator ${ind.code}`}
                                aria-label={`Edit indikator ${ind.code}`}
                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-blue-800 hover:text-blue-900 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(ind)}
                                title={`Hapus indikator ${ind.code}`}
                                aria-label={`Hapus indikator ${ind.code}`}
                                className="inline-flex items-center justify-center rounded border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <IndicatorFormModal
        isOpen={formModalState.open}
        mode={formModalState.mode}
        standards={standards}
        initialIndicator={formModalState.indicator}
        defaultStandardId={
          activeStandardFilter === 'all' ? 1 : activeStandardFilter
        }
        existingIndicators={indicators}
        onClose={() =>
          setFormModalState({ open: false, mode: 'add', indicator: null })
        }
        onSubmit={(ind) => {
          if (formModalState.mode === 'add') {
            onAddIndicator(ind);
          } else {
            onUpdateIndicator(ind);
          }
        }}
      />

      <ConfirmDeleteModal
        indicator={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(id) => {
          onDeleteIndicator(id);
          setDeleteTarget(null);
        }}
      />

      {/* Audit Log / Riwayat Perubahan Panel */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Riwayat Perubahan (Log Audit) — Instrumen & Evaluasi
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {auditLogs.length} Aktivitas Tercatat
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">
                    {log.userName} <span className="text-slate-500 font-normal">({log.roleDisplayName})</span> — <span className="text-blue-900 font-mono">{log.indicatorCode}</span>: {log.action}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Sebelum: <span className="font-mono text-slate-800">{log.beforeVal}</span> → Sesudah: <span className="font-mono text-slate-900 font-semibold">{log.afterVal}</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
