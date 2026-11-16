import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  FileText,
  FileDown,
  FileType2,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  Sigma,
  BarChart2,
  GraduationCap,
  Building2,
  Landmark,
  Lock,
} from 'lucide-react';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  JenisProdi,
  OverallAmiRecap,
  RtmDecisionItem,
  SpmiReportMeta,
  SpmiReportScopeLevel,
  SpmiReportType,
  StandardRecap,
  StandardUpgradeItem,
  StudyProgramIdentity,
} from '../../types/ami';
import {
  createDefaultEvaluation,
  getKategoriBadgeClasses,
  getKategoriTemuan,
} from '../../utils/amiCalculations';
import {
  createDefaultSpmiReportMeta,
  PpeppStatsData,
} from '../../utils/spmiReportDefaults';
import {
  exportSpmiReportToDocx,
  exportSpmiReportToPdf,
} from '../../utils/exportSpmiReports';
import { computeSpmiStatistics } from '../../utils/spmiStatistics';
import {
  computeAggregatedSpmiBundle,
  shortenFacultyName,
} from '../../utils/spmiAggregateReport';

interface TabLaporanSpmiProps {
  program: StudyProgramIdentity;
  allPrograms: StudyProgramIdentity[];
  faculties: string[];
  cycle: AmiCycle;
  cycles: AmiCycle[];
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  indicatorsByJenis: Record<JenisProdi, AmiIndicator[]>;
  evaluations: Record<string, AmiEvaluation>;
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  ppeppStats: PpeppStatsData;
  lockFakultas: boolean;
  lockProdi: boolean;
  canViewUniversityReport: boolean;
  roleDisplayName: string;
  canExport?: boolean;
}

const REPORT_CARDS: {
  id: SpmiReportType;
  num: string;
  shortTitle: string;
  fullTitle: string;
  desc: string;
}[] = [
  {
    id: 'ami',
    num: '01',
    shortTitle: 'Laporan AMI',
    fullTitle: 'LAPORAN AUDIT MUTU INTERNAL (AMI) PROGRAM STUDI',
    desc: 'Grafik Capaian & Temuan, Uji t-Test, Statistik Deskriptif, Matriks PLOR+CA & 6 Lampiran.',
  },
  {
    id: 'rtm',
    num: '02',
    shortTitle: 'Laporan RTM',
    fullTitle: 'LAPORAN RAPAT TINJAUAN MANAJEMEN (RTM) SPMI',
    desc: 'Diagram Gap Prioritas & Kesiapan PTK, Statistik Kepatuhan & Matriks Keputusan RTM.',
  },
  {
    id: 'efektivitas_ppepp',
    num: '03',
    shortTitle: 'Evaluasi & Efektivitas PPEPP',
    fullTitle: 'LAPORAN EVALUASI DAN ANALISIS EFEKTIVITAS SIKLUS PPEPP',
    desc: 'Radar 5 Tahap PPEPP, Tren Longitudinal Antar Siklus, Analisis Variabilitas & Sintesis.',
  },
  {
    id: 'perbaikan_peningkatan',
    num: '04',
    shortTitle: 'Perbaikan & Peningkatan Standar',
    fullTitle: 'LAPORAN PERBAIKAN DAN PENINGKATAN STANDAR SPMI',
    desc: 'Grafik Verifikasi Monev, Roadmap Peningkatan CQI, Closure Rate & Risk Reduction.',
  },
];

export const TabLaporanSpmi: React.FC<TabLaporanSpmiProps> = ({
  program,
  allPrograms = [],
  faculties = [],
  cycle,
  cycles = [],
  standards = [],
  indicators = [],
  indicatorsByJenis,
  evaluations = {},
  evaluationsByContext = {},
  recaps = [],
  overall,
  ppeppStats,
  lockFakultas = false,
  lockProdi = false,
  canViewUniversityReport = false,
  roleDisplayName = '',
  canExport = false,
}) => {
  const [scopeLevel, setScopeLevel] = useState<SpmiReportScopeLevel>('prodi');
  const [selectedFakultas, setSelectedFakultas] = useState<string>(
    program.fakultas
  );
  const [reportType, setReportType] = useState<SpmiReportType>('ami');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [busyDocx, setBusyDocx] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const canViewFacultyReport = !lockProdi && faculties.length > 0;

  useEffect(() => {
    setSelectedFakultas(program.fakultas);
  }, [program.fakultas]);

  useEffect(() => {
    if (scopeLevel === 'fakultas' && !canViewFacultyReport) {
      setScopeLevel('prodi');
    } else if (scopeLevel === 'universitas' && !canViewUniversityReport) {
      setScopeLevel(canViewFacultyReport ? 'fakultas' : 'prodi');
    }
  }, [scopeLevel, canViewFacultyReport, canViewUniversityReport]);

  const effectiveTargetFakultas = faculties.includes(selectedFakultas)
    ? selectedFakultas
    : faculties[0] ?? program.fakultas;

  const aggregateBundle = useMemo(() => {
    if (scopeLevel === 'prodi') return null;
    return computeAggregatedSpmiBundle({
      scopeLevel,
      activeProgram: program,
      targetFakultas: effectiveTargetFakultas,
      scopedPrograms: allPrograms,
      cycle,
      cycles,
      standards,
      defaultIndicators: indicators,
      indicatorsByJenis,
      evaluationsByContext,
    });
  }, [
    scopeLevel,
    program,
    effectiveTargetFakultas,
    allPrograms,
    cycle,
    cycles,
    standards,
    indicators,
    indicatorsByJenis,
    evaluationsByContext,
  ]);

  const effRecaps = aggregateBundle?.recaps ?? recaps;
  const effOverall = aggregateBundle?.overall ?? overall;
  const effPpeppStats = aggregateBundle?.ppeppStats ?? ppeppStats;

  const [meta, setMeta] = useState<SpmiReportMeta>(() =>
    createDefaultSpmiReportMeta(program, cycle, effRecaps, effOverall)
  );

  useEffect(() => {
    setMeta(
      createDefaultSpmiReportMeta(program, cycle, effRecaps, effOverall, {
        scopeLevel,
        targetFakultas: effectiveTargetFakultas,
        programCount: aggregateBundle?.programCount ?? 1,
        facultyCount: aggregateBundle?.facultyCount ?? 1,
      })
    );
    setFeedback(null);
  }, [
    program.id,
    cycle.id,
    scopeLevel,
    effectiveTargetFakultas,
    aggregateBundle?.programCount,
    aggregateBundle?.facultyCount,
  ]);

  const activeCard =
    REPORT_CARDS.find((c) => c.id === reportType) ?? REPORT_CARDS[0];

  const singleStats = useMemo(
    () =>
      computeSpmiStatistics({
        program,
        standards,
        indicators,
        evaluations,
        recaps,
        overall,
        ppeppStats,
        cycles,
        evaluationsByContext,
      }),
    [
      program,
      standards,
      indicators,
      evaluations,
      recaps,
      overall,
      ppeppStats,
      cycles,
      evaluationsByContext,
    ]
  );

  const stats = aggregateBundle?.stats ?? singleStats;

  const allItems = useMemo(() => {
    return indicators.map((ind) => {
      const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
      const std = standards.find((s) => s.id === ind.standard_id);
      const kategori = getKategoriTemuan(
        ev.nilai_capaian,
        ev.target_1_yr,
        ev.kategori_override
      );
      return { indicator: ind, evaluation: ev, standard: std, kategori };
    });
  }, [indicators, evaluations, standards]);

  const allFindings = useMemo(
    () =>
      allItems.filter(
        (x) => x.kategori !== null && x.kategori !== 'Sesuai (Baik)'
      ),
    [allItems]
  );

  const nonCompliant = useMemo(
    () =>
      allItems.filter(
        (x) =>
          x.kategori === 'Mayor' ||
          x.kategori === 'Minor' ||
          x.kategori === 'Observasi'
      ),
    [allItems]
  );

  const bestPractices = useMemo(
    () => allItems.filter((x) => x.kategori === 'Best Practice'),
    [allItems]
  );

  // Chart datasets for interactive preview
  const amiChartData = useMemo(
    () =>
      effRecaps.map((r) => ({
        name: `S${r.standardId}`,
        fullNama: r.nama,
        Capaian: r.nilaiCapaian,
        Target: r.nilaiTarget,
        Mayor: r.counts.Mayor,
        Minor: r.counts.Minor,
        Observasi: r.counts.Observasi,
        Sesuai: r.counts['Sesuai (Baik)'],
        BestPractice: r.counts['Best Practice'],
        TargetCqi: Math.min(
          100,
          Number((Math.max(r.nilaiCapaian, r.nilaiTarget) + 5).toFixed(1))
        ),
      })),
    [effRecaps]
  );

  const unitComparisonChartData = useMemo(() => {
    if (!aggregateBundle) return [];
    if (aggregateBundle.scopeLevel === 'universitas') {
      return aggregateBundle.facultyRows.map((f) => ({
        name: f.shortFakultas,
        SkorAMI: f.meanSkorAmi,
        IndeksPPEPP: f.meanIndeksPpepp,
        IndeksKualitas: f.meanIndeksKualitas,
      }));
    }
    return aggregateBundle.prodiRows.slice(0, 15).map((p) => ({
      name:
        p.program.nama_prodi.length > 18
          ? p.program.nama_prodi.slice(0, 16) + '…'
          : p.program.nama_prodi,
      SkorAMI: p.skorAmiTerbobot,
      IndeksPPEPP: p.indeksPpepp,
      IndeksKualitas: p.skorIndeksKualitas,
    }));
  }, [aggregateBundle]);

  const rtmReadinessData = useMemo(
    () => [
      {
        name: 'Sesuai / Best Practice',
        jumlah: stats.compliantCount,
        color: '#16a34a',
      },
      {
        name: 'PTK Closed - Verified',
        jumlah: stats.ptkClosedCount,
        color: '#0284c7',
      },
      {
        name: 'PTK In Progress',
        jumlah: stats.ptkInProgressCount,
        color: '#d97706',
      },
      {
        name: 'PTK Open',
        jumlah: stats.ptkOpenCount,
        color: '#dc2626',
      },
    ],
    [stats]
  );

  const ppeppRadarData = useMemo(
    () => [
      { stage: 'P1 Penetapan', Skor: effPpeppStats.penetapan, Ambang: 70 },
      { stage: 'P2 Pelaksanaan', Skor: effPpeppStats.pelaksanaan, Ambang: 70 },
      { stage: 'E Evaluasi', Skor: effPpeppStats.evaluasi, Ambang: 70 },
      { stage: 'P3 Pengendalian', Skor: effPpeppStats.pengendalian, Ambang: 70 },
      { stage: 'P4 Peningkatan', Skor: effPpeppStats.peningkatan, Ambang: 70 },
    ],
    [effPpeppStats]
  );

  const handleExportDocx = async () => {
    setBusyDocx(true);
    setFeedback(null);
    try {
      const fileName = await exportSpmiReportToDocx({
        reportType,
        program,
        cycle,
        cycles,
        standards,
        indicators,
        evaluations,
        evaluationsByContext,
        recaps: effRecaps,
        overall: effOverall,
        ppeppStats: effPpeppStats,
        meta,
        scopeBundle: aggregateBundle ?? undefined,
      });
      setFeedback({
        ok: true,
        text: `Dokumen Word resmi "${fileName}" lengkap dengan grafik & analisis statistik serta logo 2 cm berhasil diunduh.`,
      });
    } catch {
      setFeedback({
        ok: false,
        text: 'Gagal mengekspor dokumen .docx. Pastikan browser mengizinkan unduhan file.',
      });
    } finally {
      setBusyDocx(false);
    }
  };

  const handleExportPdf = async () => {
    setBusyPdf(true);
    setFeedback(null);
    try {
      const fileName = await exportSpmiReportToPdf({
        reportType,
        program,
        cycle,
        cycles,
        standards,
        indicators,
        evaluations,
        evaluationsByContext,
        recaps: effRecaps,
        overall: effOverall,
        ppeppStats: effPpeppStats,
        meta,
        scopeBundle: aggregateBundle ?? undefined,
      });
      setFeedback({
        ok: true,
        text: `Dokumen PDF resmi "${fileName}" lengkap dengan grafik & analisis statistik serta logo 2 cm berhasil diunduh.`,
      });
    } catch {
      setFeedback({
        ok: false,
        text: 'Gagal mengekspor dokumen .pdf.',
      });
    } finally {
      setBusyPdf(false);
    }
  };

  const addRtmDecision = () => {
    const item: RtmDecisionItem = {
      id: `rtm-${Date.now()}`,
      agenda: 'Isu Strategis Baru',
      keputusan: 'Keputusan tindak lanjut pimpinan...',
      sumberDaya: 'Anggaran / SDM Prodi',
      pic: program.kaprodi_nama || 'Ketua Program Studi',
      tenggat: 'Semester Berjalan',
    };
    setMeta((prev) => ({
      ...prev,
      rtmDecisions: [...prev.rtmDecisions, item],
    }));
  };

  const addStandardUpgrade = () => {
    const item: StandardUpgradeItem = {
      id: `upg-${Date.now()}`,
      namaStandar: 'Standar Proses / Penilaian',
      targetLama: 'Skor 6 (Baik)',
      targetBaru: 'Skor 7 (Sangat Baik / Melampaui SN-DIKTI)',
      alasanPeningkatan: 'Standar telah terpenuhi konsisten pada siklus berjalan.',
      dokumenRevisi: `Dokumen Revisi Standar ${program.nama_prodi}`,
    };
    setMeta((prev) => ({
      ...prev,
      standardUpgrades: [...prev.standardUpgrades, item],
    }));
  };

  return (
    <div className="space-y-5">
      {/* Top Control & Export Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-900 p-2.5 text-amber-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                10. Laporan AMI / RTM / Efektifitas & Peningkatan Standar SPMI
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                Dilengkapi grafik ilmiah relevan, statistik deskriptif & inferensial (Uji-t, Korelasi Pearson, CV%, Closure Rate), dan kop surat berlogo UNPATTI <strong>2 cm × 2 cm</strong> pada ekspor <strong>Word (.docx)</strong> & <strong>PDF (.pdf)</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditor((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                showEditor
                  ? 'border-blue-900 bg-blue-50 text-blue-950'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showEditor ? 'Tutup Editor Metadata' : 'Edit Metadata & Narasi'}
            </button>
            {canExport && (
              <>
                <button
                  type="button"
                  disabled={busyDocx}
                  onClick={handleExportDocx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-60 transition-colors"
                >
                  <FileType2 className="h-4 w-4 text-amber-300" />
                  {busyDocx ? 'Membuat Word...' : 'Export Word (.docx)'}
                </button>
                <button
                  type="button"
                  disabled={busyPdf}
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  {busyPdf ? 'Membuat PDF...' : 'Export PDF (.pdf)'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3 Report Scope Categories: Prodi | Fakultas/Pascasarjana/PSDKU | Universitas */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Kategori Cakupan Laporan (3 Tingkat)
            </span>
            <span className="text-[11px] text-slate-500">
              Peran aktif: <strong className="text-slate-700">{roleDisplayName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setScopeLevel('prodi')}
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                scopeLevel === 'prodi'
                  ? 'border-blue-900 bg-white ring-1 ring-blue-900 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div
                className={`rounded-md p-2 shrink-0 ${
                  scopeLevel === 'prodi'
                    ? 'bg-blue-900 text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  Tingkat Program Studi
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  Hanya 1 Prodi: <strong>{program.nama_prodi}</strong>
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={!canViewFacultyReport}
              onClick={() => canViewFacultyReport && setScopeLevel('fakultas')}
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                !canViewFacultyReport
                  ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                  : scopeLevel === 'fakultas'
                  ? 'border-blue-900 bg-white ring-1 ring-blue-900 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div
                className={`rounded-md p-2 shrink-0 ${
                  scopeLevel === 'fakultas'
                    ? 'bg-blue-900 text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-900">
                  <span className="truncate">Tingkat Fakultas / Pascasarjana / PSDKU</span>
                  {!canViewFacultyReport && (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  {canViewFacultyReport
                    ? `Semua Prodi dalam ${shortenFacultyName(effectiveTargetFakultas)} (${
                        allPrograms.filter(
                          (p) => p.fakultas === effectiveTargetFakultas
                        ).length
                      } Prodi)`
                    : 'Terkunci pada cakupan 1 Program Studi'}
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={!canViewUniversityReport}
              onClick={() =>
                canViewUniversityReport && setScopeLevel('universitas')
              }
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                !canViewUniversityReport
                  ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                  : scopeLevel === 'universitas'
                  ? 'border-blue-900 bg-white ring-1 ring-blue-900 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div
                className={`rounded-md p-2 shrink-0 ${
                  scopeLevel === 'universitas'
                    ? 'bg-blue-900 text-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Landmark className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-900">
                  <span>Tingkat Universitas (UNPATTI)</span>
                  {!canViewUniversityReport && (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  {canViewUniversityReport
                    ? `Gabungan ${faculties.length} Fakultas/Pascasarjana/PSDKU (${allPrograms.length} Prodi)`
                    : 'Khusus peran tingkat Universitas (Rektorat/LPMPP/Admin)'}
                </div>
              </div>
            </button>
          </div>

          {scopeLevel === 'fakultas' && canViewFacultyReport && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 text-xs">
              <label
                htmlFor="spmi-scope-faculty"
                className="font-semibold text-slate-700"
              >
                Pilih Unit Fakultas / Pascasarjana / PSDKU:
              </label>
              <select
                id="spmi-scope-faculty"
                disabled={lockFakultas}
                value={effectiveTargetFakultas}
                onChange={(e) => setSelectedFakultas(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {faculties.map((fac) => {
                  const cnt = allPrograms.filter(
                    (p) => p.fakultas === fac
                  ).length;
                  return (
                    <option key={fac} value={fac}>
                      {fac} ({cnt} Prodi)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* 4 Document Type Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {REPORT_CARDS.map((card) => {
            const active = reportType === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setReportType(card.id)}
                className={`text-left rounded-lg border p-3.5 transition-colors ${
                  active
                    ? 'border-blue-900 bg-blue-50/70 ring-1 ring-blue-900'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-blue-900">
                    DOKUMEN {card.num}
                  </span>
                  {active && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900">
                  {card.shortTitle}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                  {card.desc}
                </p>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs ${
              feedback.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Collapsible Metadata & Narrative Editor */}
      {showEditor && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pengaturan Metadata, Tim Auditor, Keputusan RTM & Narasi Laporan
              </h3>
              <p className="text-xs text-slate-500">
                Setiap perubahan otomatis masuk ke pratinjau dokumen, file Word (.docx), dan PDF (.pdf).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMeta(
                  createDefaultSpmiReportMeta(
                    program,
                    cycle,
                    effRecaps,
                    effOverall,
                    {
                      scopeLevel,
                      targetFakultas: effectiveTargetFakultas,
                      programCount: aggregateBundle?.programCount ?? 1,
                      facultyCount: aggregateBundle?.facultyCount ?? 1,
                    }
                  )
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ke Narasi Otomatis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Dokumen Resmi
              </label>
              <input
                type="text"
                value={meta.nomorDokumen}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, nomorDokumen: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. SK Penugasan Auditor / RTM
              </label>
              <input
                type="text"
                value={meta.noSkAuditor}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, noSkAuditor: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kepala LPMPP UNPATTI
              </label>
              <input
                type="text"
                value={meta.kepalaLpmppNama}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, kepalaLpmppNama: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ketua Tim Auditor AMI
              </label>
              <input
                type="text"
                value={meta.ketuaAuditor}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, ketuaAuditor: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Audit AMI / RTM
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={meta.tanggalAudit}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, tanggalAudit: e.target.value }))
                  }
                  placeholder="Tgl Audit"
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono"
                />
                <input
                  type="text"
                  value={meta.tanggalRtm}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, tanggalRtm: e.target.value }))
                  }
                  placeholder="Tgl RTM"
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pimpinan Rapat RTM
              </label>
              <input
                type="text"
                value={meta.pimpinanRtmNama}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, pimpinanRtmNama: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Faktor Pendukung Implementasi PPEPP
              </label>
              <textarea
                rows={2}
                value={meta.faktorPendukung}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, faktorPendukung: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Faktor Penghambat / Kendala
              </label>
              <textarea
                rows={2}
                value={meta.faktorPenghambat}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, faktorPenghambat: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kesimpulan Utama Laporan
              </label>
              <textarea
                rows={2}
                value={meta.kesimpulan}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, kesimpulan: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Saran & Rekomendasi Tindak Lanjut
              </label>
              <textarea
                rows={2}
                value={meta.saran}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, saran: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5"
              />
            </div>
          </div>

          {reportType === 'rtm' && (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Baris Matriks Keputusan Strategis RTM
                </h4>
                <button
                  type="button"
                  onClick={addRtmDecision}
                  className="inline-flex items-center gap-1 rounded border border-blue-800 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-900 hover:bg-blue-100"
                >
                  <Plus className="h-3 w-3" />
                  Tambah Keputusan RTM
                </button>
              </div>
              {meta.rtmDecisions.map((d, idx) => (
                <div
                  key={d.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs items-center"
                >
                  <input
                    className="md:col-span-3 rounded border border-slate-300 bg-white px-2 py-1"
                    value={d.agenda}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        rtmDecisions: p.rtmDecisions.map((x, i) =>
                          i === idx ? { ...x, agenda: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Agenda / Isu"
                  />
                  <input
                    className="md:col-span-4 rounded border border-slate-300 bg-white px-2 py-1"
                    value={d.keputusan}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        rtmDecisions: p.rtmDecisions.map((x, i) =>
                          i === idx ? { ...x, keputusan: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Keputusan Pimpinan"
                  />
                  <input
                    className="md:col-span-2 rounded border border-slate-300 bg-white px-2 py-1"
                    value={d.pic}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        rtmDecisions: p.rtmDecisions.map((x, i) =>
                          i === idx ? { ...x, pic: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="PIC"
                  />
                  <input
                    className="md:col-span-2 rounded border border-slate-300 bg-white px-2 py-1"
                    value={d.tenggat}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        rtmDecisions: p.rtmDecisions.map((x, i) =>
                          i === idx ? { ...x, tenggat: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Tenggat"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMeta((p) => ({
                        ...p,
                        rtmDecisions: p.rtmDecisions.filter((_, i) => i !== idx),
                      }))
                    }
                    className="md:col-span-1 inline-flex justify-center rounded border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                    title="Hapus baris"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {reportType === 'perbaikan_peningkatan' && (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Baris Matriks Peningkatan Standar (Continuous Improvement)
                </h4>
                <button
                  type="button"
                  onClick={addStandardUpgrade}
                  className="inline-flex items-center gap-1 rounded border border-blue-800 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-900 hover:bg-blue-100"
                >
                  <Plus className="h-3 w-3" />
                  Tambah Peningkatan Standar
                </button>
              </div>
              {meta.standardUpgrades.map((u, idx) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs items-center"
                >
                  <input
                    className="md:col-span-2 rounded border border-slate-300 bg-white px-2 py-1"
                    value={u.namaStandar}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        standardUpgrades: p.standardUpgrades.map((x, i) =>
                          i === idx ? { ...x, namaStandar: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Nama Standar"
                  />
                  <input
                    className="md:col-span-3 rounded border border-slate-300 bg-white px-2 py-1"
                    value={u.targetLama}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        standardUpgrades: p.standardUpgrades.map((x, i) =>
                          i === idx ? { ...x, targetLama: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Target Lama"
                  />
                  <input
                    className="md:col-span-3 rounded border border-slate-300 bg-white px-2 py-1"
                    value={u.targetBaru}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        standardUpgrades: p.standardUpgrades.map((x, i) =>
                          i === idx ? { ...x, targetBaru: e.target.value } : x
                        ),
                      }))
                    }
                    placeholder="Target Baru (Peningkatan)"
                  />
                  <input
                    className="md:col-span-3 rounded border border-slate-300 bg-white px-2 py-1"
                    value={u.dokumenRevisi}
                    onChange={(e) =>
                      setMeta((p) => ({
                        ...p,
                        standardUpgrades: p.standardUpgrades.map((x, i) =>
                          i === idx
                            ? { ...x, dokumenRevisi: e.target.value }
                            : x
                        ),
                      }))
                    }
                    placeholder="Dokumen Revisi"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMeta((p) => ({
                        ...p,
                        standardUpgrades: p.standardUpgrades.filter(
                          (_, i) => i !== idx
                        ),
                      }))
                    }
                    className="md:col-span-1 inline-flex justify-center rounded border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                    title="Hapus baris"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Official Document A4 Preview Sheet with 2 cm x 2 cm Kop Logo + Scientific Charts & Statistics */}
      <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-slate-300 bg-white p-6 sm:p-10 shadow-sm text-slate-900 space-y-6">
          {/* Official UNPATTI Kop Surat with EXACT 2 cm x 2 cm logo */}
          <div className="flex items-center gap-5 border-b-4 border-double border-slate-900 pb-4">
            <img
              src="/unpatti-logo.png"
              alt="Logo Universitas Pattimura (2 cm)"
              style={{ width: '2cm', height: '2cm' }}
              className="shrink-0 object-contain"
            />
            <div className="flex-1 text-center">
              <div className="text-[11px] font-bold tracking-wide text-slate-700 uppercase">
                Kementerian Pendidikan Tinggi, Sains, dan Teknologi
              </div>
              <div className="text-lg font-extrabold tracking-tight text-slate-950">
                UNIVERSITAS PATTIMURA
              </div>
              <div className="text-xs font-bold text-blue-900">
                LEMBAGA PENJAMINAN MUTU DAN PENGEMBANGAN PEMBELAJARAN (LPMPP)
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Jl. Ir. M. Putuhena, Kampus Poka, Ambon 97233 · Laman: https://unpatti.ac.id
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="text-center space-y-1 py-2">
            <div className="inline-block rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-900">
              {aggregateBundle?.scopeBadgeLabel ?? 'TINGKAT PROGRAM STUDI'}
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight">
              {activeCard.fullTitle}
            </h1>
            <div className="text-xs sm:text-sm font-bold text-blue-900">
              {aggregateBundle?.scopeHeading ??
                `PROGRAM STUDI ${program.nama_prodi.toUpperCase()} (${program.kode_ps})`}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              {aggregateBundle?.scopeSubheading ??
                `${program.fakultas} · Siklus PPEPP ${cycle.tahun_siklus}`}{' '}
              · No. Dokumen: {meta.nomorDokumen}
            </div>
          </div>

          {/* Administrative Metadata Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-400 px-3 py-2 text-left w-56">
                  Atribut Administratif
                </th>
                <th className="border border-slate-400 px-3 py-2 text-left">
                  Keterangan Resmi
                </th>
              </tr>
            </thead>
            {scopeLevel === 'prodi' ? (
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Perguruan Tinggi / Fakultas
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {program.kode_pt} — {program.nama_pt} · {program.fakultas}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Program Studi & Akreditasi
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {program.kode_ps} — {program.nama_prodi} ({program.jenis_prodi}) · Peringkat{' '}
                    <strong>{program.peringkat_akreditasi}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Ketua Program Studi
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {program.kaprodi_nama || '-'} (NIP. {program.kaprodi_nip || '-'})
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Tim Auditor & Dasar SK
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    Ketua: {meta.ketuaAuditor} | Anggota: {meta.anggotaAuditor1}, {meta.anggotaAuditor2} ({meta.noSkAuditor})
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Ringkasan Kuantitatif Mutu
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono">
                    Terbobot: <strong>{effOverall.rataRataCapaianTerbobot.toFixed(2)}</strong> ({effOverall.sebutanOverall}) · Kepatuhan: <strong>{stats.complianceRatePct}%</strong> · Indeks PPEPP: <strong>{effPpeppStats.indeks}%</strong> · Closure Rate: <strong>{stats.ptkClosureRatePct}%</strong>
                  </td>
                </tr>
              </tbody>
            ) : scopeLevel === 'fakultas' && aggregateBundle ? (
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Unit Fakultas / Pascasarjana / PSDKU
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {program.kode_pt} — {program.nama_pt} · <strong>{aggregateBundle.targetFakultas}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Cakupan Program Studi
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    <strong>{aggregateBundle.programCount} Program Studi</strong> dalam cakupan unit · Total {stats.nIndicators} butir indikator terevaluasi
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Sebaran Klaster Mutu Prodi
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    Unggul: <strong>{aggregateBundle.crossUnitStats.clusterCounts.Unggul}</strong> · Stabil: <strong>{aggregateBundle.crossUnitStats.clusterCounts.Stabil}</strong> · Menurun: <strong>{aggregateBundle.crossUnitStats.clusterCounts.Menurun}</strong> · Pembinaan: <strong>{aggregateBundle.crossUnitStats.clusterCounts.Pembinaan}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Tim Auditor & Dasar SK
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    Ketua: {meta.ketuaAuditor} | Kepala LPMPP: {meta.kepalaLpmppNama} ({meta.noSkAuditor})
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Agregat Kuantitatif Fakultas
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono">
                    Mean Terbobot: <strong>{effOverall.rataRataCapaianTerbobot.toFixed(2)}</strong> ({effOverall.sebutanOverall}) · Kepatuhan: <strong>{stats.complianceRatePct}%</strong> · Indeks PPEPP: <strong>{effPpeppStats.indeks}%</strong> · Closure Rate: <strong>{stats.ptkClosureRatePct}%</strong>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Institusi & Cakupan Laporan
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    {program.kode_pt} — <strong>{program.nama_pt}</strong> (Konsolidasi Tingkat Universitas)
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Cakupan Unit & Program Studi
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    <strong>{aggregateBundle?.facultyCount ?? 12} Fakultas / Pascasarjana / PSDKU</strong> · <strong>{aggregateBundle?.programCount ?? 118} Program Studi</strong> · {stats.nIndicators} indikator terevaluasi
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Sebaran Klaster Mutu UNPATTI
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    Unggul: <strong>{aggregateBundle?.crossUnitStats.clusterCounts.Unggul ?? 0}</strong> · Stabil: <strong>{aggregateBundle?.crossUnitStats.clusterCounts.Stabil ?? 0}</strong> · Menurun: <strong>{aggregateBundle?.crossUnitStats.clusterCounts.Menurun ?? 0}</strong> · Pembinaan: <strong>{aggregateBundle?.crossUnitStats.clusterCounts.Pembinaan ?? 0}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Pimpinan & Dasar SK
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5">
                    Rektorat & Kepala LPMPP ({meta.kepalaLpmppNama}) · {meta.noSkAuditor}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50">
                    Agregat Kuantitatif Universitas
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono">
                    Mean Terbobot: <strong>{effOverall.rataRataCapaianTerbobot.toFixed(2)}</strong> ({effOverall.sebutanOverall}) · Kepatuhan: <strong>{stats.complianceRatePct}%</strong> · Indeks PPEPP: <strong>{effPpeppStats.indeks}%</strong> · Closure Rate: <strong>{stats.ptkClosureRatePct}%</strong>
                  </td>
                </tr>
              </tbody>
            )}
          </table>

          {/* Cross-Unit Aggregate Comparison Chart & Matrix (Fakultas / Universitas) */}
          {aggregateBundle && scopeLevel !== 'prodi' && (
            <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {scopeLevel === 'universitas'
                      ? `REKAPITULASI GABUNGAN PER FAKULTAS / PASCASARJANA / PSDKU (${aggregateBundle.facultyRows.length} UNIT · ${aggregateBundle.programCount} PRODI)`
                      : `REKAPITULASI SELURUH PROGRAM STUDI DALAM ${aggregateBundle.targetFakultas.toUpperCase()} (${aggregateBundle.prodiRows.length} PRODI)`}
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Rata-rata skor antar {aggregateBundle.crossUnitStats.unitLabel}:{' '}
                    <strong className="font-mono">{aggregateBundle.crossUnitStats.meanSkor.toFixed(2)} ± {aggregateBundle.crossUnitStats.sdSkor.toFixed(2)}</strong>{' '}
                    (CV = {aggregateBundle.crossUnitStats.cvPct.toFixed(2)}%) · Tertinggi: <strong>{aggregateBundle.crossUnitStats.maxUnitName}</strong> ({aggregateBundle.crossUnitStats.maxUnitScore.toFixed(2)}) · Terendah: <strong>{aggregateBundle.crossUnitStats.minUnitName}</strong> ({aggregateBundle.crossUnitStats.minUnitScore.toFixed(2)})
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-900 mb-2">
                  {scopeLevel === 'universitas'
                    ? 'Grafik Komparasi Skor AMI, Indeks PPEPP & Indeks Kualitas Antar Fakultas / Pascasarjana / PSDKU'
                    : `Grafik Komparasi Skor AMI, Indeks PPEPP & Indeks Kualitas Antar Prodi (${aggregateBundle.targetFakultas})`}
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitComparisonChartData} margin={{ top: 8, right: 12, left: -12, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={52} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="SkorAMI" name="Skor AMI Terbobot" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="IndeksPPEPP" name="Indeks PPEPP (%)" fill="#059669" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="IndeksKualitas" name="Skor Indeks Kualitas" fill="#d97706" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                {scopeLevel === 'fakultas' ? (
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 px-2 py-1.5 text-center">No</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Kode</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Program Studi</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Skor AMI</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Indeks PPEPP</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Indeks Kualitas</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">M / Mn / Ob / BP</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">PTK Closed</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">Klaster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregateBundle.prodiRows.map((p, idx) => (
                        <tr key={p.program.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-mono">{p.program.kode_ps}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">{p.program.nama_prodi}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{p.skorAmiTerbobot.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{p.indeksPpepp.toFixed(1)}%</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-bold text-blue-900">{p.skorIndeksKualitas.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                            {p.ktsMayor} / {p.ktsMinor} / {p.observasi} / {p.bestPractice}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{p.ptkClosedPct}%</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">{p.cluster}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 px-2 py-1.5 text-center">No</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Fakultas / Pascasarjana / PSDKU</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">Prodi</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Mean AMI</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Indeks PPEPP</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">Indeks Kualitas</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">Total M/Mn/Ob/BP</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-right">PTK Closed</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center">Klaster (U/S/M/P)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregateBundle.facultyRows.map((f, idx) => (
                        <tr key={f.fakultas} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">{f.fakultas}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{f.prodiCount}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{f.meanSkorAmi.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{f.meanIndeksPpepp.toFixed(1)}%</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-bold text-blue-900">{f.meanIndeksKualitas.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                            {f.totalMayor}/{f.totalMinor}/{f.totalObservasi}/{f.totalBestPractice}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{f.ptkClosedPct}%</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                            {f.clusterCounts.Unggul}/{f.clusterCounts.Stabil}/{f.clusterCounts.Menurun}/{f.clusterCounts.Pembinaan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* REPORT 1: LAPORAN AMI */}
          {reportType === 'ami' && (
            <div className="space-y-6 text-xs leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  A. BAGIAN ADMINISTRATIF & BAB I–II PELAKSANAAN AMI
                </h2>
                <p>
                  Audit Mutu Internal (AMI) pada{' '}
                  <strong>
                    {scopeLevel === 'universitas'
                      ? `Universitas Pattimura (${aggregateBundle?.facultyCount ?? 12} Fakultas/Pascasarjana/PSDKU, ${aggregateBundle?.programCount ?? 118} Prodi)`
                      : scopeLevel === 'fakultas'
                      ? `${effectiveTargetFakultas} (${aggregateBundle?.programCount ?? 0} Program Studi)`
                      : program.nama_prodi}
                  </strong>{' '}
                  siklus <strong>{cycle.tahun_siklus}</strong> mengevaluasi {stats.nIndicators} butir indikator pada 10 Standar SPMI UNPATTI mengacu pada UU No. 12/2012, Permendikbudristek No. 53/2023, dan {meta.noSkAuditor}. Skor terbobot mencapai{' '}
                  <strong>{effOverall.rataRataCapaianTerbobot.toFixed(2)}</strong> ({effOverall.sebutanOverall}) dengan tingkat kepatuhan{' '}
                  <strong>{stats.complianceRatePct}%</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB III. HASIL AUDIT, VISUALISASI GRAFIK & ANALISIS STATISTIK
                </h2>

                {/* Scientific KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Mean ± SD (10 Standar)</div>
                    <div className="font-mono text-base font-bold text-slate-900 tabular-nums mt-0.5">
                      {stats.meanCapaian.toFixed(2)} ± {stats.sdCapaian.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-blue-900 font-medium">
                      CV = {stats.cvCapaianPct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Median & IQR</div>
                    <div className="font-mono text-base font-bold text-slate-900 tabular-nums mt-0.5">
                      {stats.medianCapaian.toFixed(2)} (IQR {stats.iqrCapaian.toFixed(2)})
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Q1={stats.q1Capaian.toFixed(1)} · Q3={stats.q3Capaian.toFixed(1)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Uji Beda Paired t-Test</div>
                    <div className="font-mono text-base font-bold text-slate-900 tabular-nums mt-0.5">
                      t({stats.pairedDf}) = {stats.pairedTStat.toFixed(3)}
                    </div>
                    <div className="text-[11px] text-amber-800 font-medium">
                      {stats.pairedPLabel}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] text-slate-500">Korelasi KTS vs Skor</div>
                    <div className="font-mono text-base font-bold text-slate-900 tabular-nums mt-0.5">
                      r = {stats.pearsonR_KtsVsCapaian.toFixed(3)}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {stats.pearsonInterpretation.split(' (')[0]}
                    </div>
                  </div>
                </div>

                {/* Figure 3.1 & 3.2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                      <BarChart2 className="h-4 w-4 text-blue-900" />
                      Gambar 3.1 Capaian vs Target 10 Standar SPMI
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={amiChartData} margin={{ top: 8, right: 12, left: -12, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <ReferenceLine
                            y={effOverall.rataRataCapaianTerbobot}
                            stroke="#dc2626"
                            strokeDasharray="4 4"
                          />
                          <Bar dataKey="Capaian" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Target" fill="#d97706" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 italic text-center">
                      Garis putus merah: Rata-rata Terbobot ({effOverall.rataRataCapaianTerbobot.toFixed(2)}).
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                      <BarChart2 className="h-4 w-4 text-amber-600" />
                      Gambar 3.2 Distribusi Kategori Temuan per Standar
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={amiChartData} margin={{ top: 8, right: 12, left: -12, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Mayor" stackId="a" fill="#dc2626" />
                          <Bar dataKey="Minor" stackId="a" fill="#ea580c" />
                          <Bar dataKey="Observasi" stackId="a" fill="#d97706" />
                          <Bar dataKey="Sesuai" stackId="a" fill="#16a34a" />
                          <Bar dataKey="BestPractice" name="Best Practice" stackId="a" fill="#0284c7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 italic text-center">
                      Kepatuhan Mutu: {stats.complianceRatePct}% · Non-Conformity Rate: {stats.nonConformityRatePct}%.
                    </p>
                  </div>
                </div>

                {/* Statistical Summary Table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center gap-2 text-xs font-semibold">
                    <Sigma className="h-4 w-4 text-amber-400" />
                    Tabel 3.1 Analisis Statistik Deskriptif & Inferensial Hasil AMI
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Parameter Statistik</th>
                        <th className="px-3 py-2 text-left">Nilai Empiris</th>
                        <th className="px-3 py-2 text-left">Interpretasi Ilmiah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="px-3 py-2 font-semibold">Mean & SD Capaian</td>
                        <td className="px-3 py-2 font-mono">
                          {stats.meanCapaian.toFixed(2)} ± {stats.sdCapaian.toFixed(2)} (CV = {stats.cvCapaianPct.toFixed(2)}%)
                        </td>
                        <td className="px-3 py-2">
                          {stats.cvCapaianPct <= 10
                            ? 'Sebaran capaian homogen (konsisten antar 10 standar).'
                            : 'Terdapat disparitas moderat antar standar yang perlu penyelarasan.'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">Ekstrem Minimum & Maksimum</td>
                        <td className="px-3 py-2 font-mono">
                          Min {stats.minCapaian.toFixed(2)} ({stats.minStandardName}) · Max {stats.maxCapaian.toFixed(2)} ({stats.maxStandardName})
                        </td>
                        <td className="px-3 py-2">Rentang (Range) kinerja sebesar {stats.rangeCapaian.toFixed(2)} poin.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">Paired Sample t-Test (Capaian vs Target)</td>
                        <td className="px-3 py-2 font-mono">
                          Mean Gap = -{stats.meanGap.toFixed(2)} | t({stats.pairedDf}) = {stats.pairedTStat.toFixed(3)} ({stats.pairedPLabel})
                        </td>
                        <td className="px-3 py-2">
                          {stats.pairedSignificant
                            ? 'Gap antara kondisi aktual dan target 1 tahun signifikan secara statistik.'
                            : 'Kondisi aktual mendekati target 1 tahun yang ditetapkan.'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">Korelasi Pearson (KTS vs Skor Standar)</td>
                        <td className="px-3 py-2 font-mono">{stats.pearsonInterpretation}</td>
                        <td className="px-3 py-2">Menguji hubungan kepadatan temuan ketidaksesuaian terhadap skor standar.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Matriks Temuan */}
                <h3 className="text-xs font-bold text-blue-900 pt-1">
                  Tabel 3.2 Matriks Temuan Audit (PLOR+CA) & RTL (
                  {scopeLevel === 'prodi'
                    ? `${allFindings.length} butir`
                    : `Menampilkan 15 prioritas dari ${aggregateBundle?.allUnitFindings.length ?? 0} temuan`}
                  )
                </h3>
                <div className="overflow-x-auto">
                  {scopeLevel === 'prodi' ? (
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="border border-slate-400 px-2 py-1.5">Kode</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Standar & Butir Mutu</th>
                          <th className="border border-slate-400 px-2 py-1.5">Kategori</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Uraian Temuan</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Akar Masalah/Penunjang</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">PTK / RTL & PIC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allFindings.slice(0, 12).map((item) => (
                          <tr key={item.indicator.id} className="align-top">
                            <td className="border border-slate-300 px-2 py-1.5 font-mono font-bold">
                              {item.indicator.code}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5">
                              <div className="font-semibold">{item.standard?.nama}</div>
                              <div className="text-slate-600">{item.indicator.uraian}</div>
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${getKategoriBadgeClasses(
                                  item.kategori
                                )}`}
                              >
                                {item.kategori}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5">
                              {item.evaluation.nilai_capaian !== null
                                ? `Skor ${item.evaluation.nilai_capaian}: ${item.indicator.rubric_levels[item.evaluation.nilai_capaian]}`
                                : 'Belum Dinilai'}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5">
                              {item.evaluation.akar_masalah || item.evaluation.plor_ca.problem || '-'}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5">
                              <div>{item.evaluation.ptk_rtl || '-'}</div>
                              <div className="text-slate-500 mt-0.5">
                                PIC: {item.evaluation.pic || '-'} ({item.evaluation.waktu_ptk || '-'})
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-800 text-white">
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Program Studi / Unit</th>
                          <th className="border border-slate-400 px-2 py-1.5">Kode & Standar</th>
                          <th className="border border-slate-400 px-2 py-1.5">Kategori</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Uraian Temuan</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">Akar Masalah/Penunjang</th>
                          <th className="border border-slate-400 px-2 py-1.5 text-left">PTK / RTL & PIC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(aggregateBundle?.allUnitFindings ?? [])
                          .slice(0, 15)
                          .map((f, i) => (
                            <tr key={`${f.prodiId}-${f.indicatorCode}-${i}`} className="align-top">
                              <td className="border border-slate-300 px-2 py-1.5">
                                <div className="font-semibold">{f.namaProdi}</div>
                                <div className="text-[10px] text-slate-500">
                                  {shortenFacultyName(f.fakultas)}
                                </div>
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5">
                                <div className="font-mono font-bold">{f.indicatorCode}</div>
                                <div className="text-[10px] text-slate-600">{f.standardName}</div>
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                                <span
                                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${getKategoriBadgeClasses(
                                    f.kategori
                                  )}`}
                                >
                                  {f.kategori}
                                </span>
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5">
                                Skor {f.skor}: {f.rubricDesc}
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5">
                                {f.akarMasalah}
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5">
                                <div>{f.ptkRtl}</div>
                                <div className="text-slate-500 mt-0.5">
                                  PIC: {f.pic} ({f.waktuPtk})
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB IV & V. REKOMENDASI, KESIMPULAN ({effOverall.totalCounts['Best Practice']} Best Practice) & 6 LAMPIRAN
                </h2>
                <p><strong>Kesimpulan:</strong> {meta.kesimpulan}</p>
                <p><strong>Saran:</strong> {meta.saran}</p>
              </section>
            </div>
          )}

          {/* REPORT 2: LAPORAN RTM */}
          {reportType === 'rtm' && (
            <div className="space-y-6 text-xs leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB I & II. PENDAHULUAN DAN PELAKSANAAN RTM
                </h2>
                <p>
                  RTM dilaksanakan pada <strong className="font-mono">{meta.tanggalRtm}</strong> di{' '}
                  <strong>{meta.tempatRtm}</strong>, dipimpin oleh <strong>{meta.pimpinanRtmNama}</strong> ({meta.pimpinanRtmJabatan}) membahas 7 agenda pokok SPMI.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB III. EVALUASI KINERJA MUTU, GRAFIK PRIORITAS GAP & ANALISIS STATISTIK
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 3.1 Peringkat Gap Kesenjangan (Target − Capaian) per Standar
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.standardGapRanking}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="shortName" width={125} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="gap" name="Gap Target−Capaian" radius={[0, 3, 3, 0]}>
                            {stats.standardGapRanking.map((entry) => (
                              <Cell
                                key={entry.standardId}
                                fill={
                                  entry.urgency === 'Prioritas Tinggi'
                                    ? '#dc2626'
                                    : entry.urgency === 'Prioritas Sedang'
                                    ? '#d97706'
                                    : '#1e3a8a'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 italic text-center">
                      Prioritas utama: {stats.maxGapStandardName} (Δ = {stats.maxGap.toFixed(2)}).
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 3.2 Profil Kepatuhan Standar & Kesiapan PTK/RTL
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rtmReadinessData} margin={{ top: 8, right: 16, left: -10, bottom: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="jumlah" name="Jumlah Indikator" radius={[4, 4, 0, 0]}>
                            {rtmReadinessData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 italic text-center">
                      Kepatuhan: {stats.complianceRatePct}% · Kelengkapan Rencana PTK: {stats.ptkPlanCompletenessPct}%.
                    </p>
                  </div>
                </div>

                {/* RTM Statistical Analysis */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sigma className="h-4 w-4 text-blue-900" />
                    Ringkasan Analisis Statistik RTM
                  </div>
                  <p>
                    Mean Gap antar standar sebesar <strong>{stats.meanGap.toFixed(2)} ± {stats.sdGap.toFixed(2)}</strong> poin (t({stats.pairedDf}) = {stats.pairedTStat.toFixed(3)}, {stats.pairedPLabel}). Rasio Kepatuhan Mutu mencapai <strong>{stats.complianceRatePct}%</strong> ({stats.compliantCount}/{stats.nIndicators} indikator) sementara korelasi jumlah KTS terhadap skor standar bernilai <strong>{stats.pearsonInterpretation}</strong>.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB IV & V. KEPUTUSAN STRATEGIS & MATRIKS TINDAK LANJUT RTM
                </h2>
                <p><strong>Arahan Pimpinan:</strong> {meta.arahanPimpinanRtm}</p>
                <p><strong>Alokasi Sumber Daya:</strong> {meta.alokasiSumberDayaRtm}</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 px-2 py-1.5 text-center">No</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Agenda / Isu Strategis</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Keputusan Pimpinan</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Sumber Daya</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">PIC</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Tenggat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meta.rtmDecisions.map((d, idx) => (
                        <tr key={d.id} className="align-top">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                            {d.agenda}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">{d.keputusan}</td>
                          <td className="border border-slate-300 px-2 py-1.5">{d.sumberDaya}</td>
                          <td className="border border-slate-300 px-2 py-1.5">{d.pic}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-mono">{d.tenggat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* REPORT 3: EVALUASI & EFEKTIVITAS PPEPP */}
          {reportType === 'efektivitas_ppepp' && (
            <div className="space-y-6 text-xs leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  1 & 2. PENDAHULUAN, METODOLOGI & ANALISIS VARIABILITAS SIKLUS PPEPP
                </h2>
                <p>
                  Indeks Komposit Efektivitas Siklus PPEPP mencapai <strong>{effPpeppStats.indeks}%</strong> ({effPpeppStats.label}) dengan rata-rata tahap <strong>{stats.ppeppMean}% ± {stats.ppeppSd}%</strong> (Koefisien Variasi <strong>CV = {stats.ppeppCvPct}%</strong>). Tahap terkuat adalah <strong>{stats.strongestStage.label} ({stats.strongestStage.score}%)</strong>, sedangkan titik kendala (bottleneck) berada pada <strong>{stats.bottleneckStage.label} ({stats.bottleneckStage.score}%)</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  3. VISUALISASI RADAR PPEPP, TREN ANTAR SIKLUS & MATRIKS EFEKTIVITAS
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 3.1 Diagram Radar Keseimbangan 5 Tahap PPEPP
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={ppeppRadarData}>
                          <PolarGrid stroke="#cbd5e1" />
                          <PolarAngleAxis dataKey="stage" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="Skor PPEPP (%)"
                            dataKey="Skor"
                            stroke="#1e3a8a"
                            fill="#1e3a8a"
                            fillOpacity={0.28}
                          />
                          <Radar
                            name="Ambang Efektif (70%)"
                            dataKey="Ambang"
                            stroke="#d97706"
                            fill="none"
                            strokeDasharray="4 4"
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 3.2 Tren Longitudinal Capaian & Efektivitas PTK Antar Siklus
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats.cycleTrend} margin={{ top: 8, right: 12, left: -12, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="siklus" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="capaian" name="Capaian Mutu" fill="#1e3a8a" barSize={18} />
                          <Bar dataKey="target" name="Target Mutu" fill="#d97706" barSize={18} />
                          <Line
                            type="monotone"
                            dataKey="efektivitasPtk"
                            name="Efektivitas PTK (%)"
                            stroke="#16a34a"
                            strokeWidth={2.5}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 px-2.5 py-2 text-left">Tahapan Siklus</th>
                        <th className="border border-slate-400 px-2.5 py-2 text-left">Fokus Evaluasi</th>
                        <th className="border border-slate-400 px-2.5 py-2 text-left">Indikator Efektivitas</th>
                        <th className="border border-slate-400 px-2.5 py-2 text-left">Temuan & Analisis Kesenjangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          stage: `1. Penetapan (${effPpeppStats.penetapan}%)`,
                          fokus: 'Dokumen kebijakan, VMTS, CPL & target standar >= 5.',
                          ind: 'Kelengkapan Identitas Prodi & Target Mutu 10 Standar.',
                          gap: 'Profil & target standar terdefinisi; sinkronkan berkala SN-DIKTI terbaru.',
                        },
                        {
                          stage: `2. Pelaksanaan (${effPpeppStats.pelaksanaan}%)`,
                          fokus: 'Implementasi tridharma & ketersediaan bukti digital.',
                          ind: 'Skor Terbobot AMI & rasio indikator berbukti dokumen.',
                          gap: `Skor terbobot AMI ${effOverall.rataRataCapaianTerbobot.toFixed(2)}. Perlu pemerataan arsip digital.`,
                        },
                        {
                          stage: `3. Evaluasi (${effPpeppStats.evaluasi}%)`,
                          fokus: 'Pelaksanaan AMI & analisis akar masalah (PLOR+CA).',
                          ind: 'Rasio temuan KTS/OB yang dilengkapi analisis PLOR+CA.',
                          gap: `${stats.nonCompliantCount} temuan KTS/OB teridentifikasi; perlu ketajaman objective evidence.`,
                        },
                        {
                          stage: `4. Pengendalian (${effPpeppStats.pengendalian}%)`,
                          fokus: 'Penyusunan PTK/RTL, PIC & batas waktu koreksi.',
                          ind: 'Kelengkapan rencana PTK/RTL dan PIC pada temuan.',
                          gap: `Kelengkapan rencana PTK ${stats.ptkPlanCompletenessPct}%.`,
                        },
                        {
                          stage: `5. Peningkatan (${effPpeppStats.peningkatan}%)`,
                          fokus: 'Penutupan Monev & pelampauan standar (Best Practice).',
                          ind: 'Persentase Closed - Verified & capaian Best Practice.',
                          gap: `${effOverall.totalCounts['Best Practice']} butir Best Practice tercatat.`,
                        },
                      ].map((row) => (
                        <tr key={row.stage} className="align-top">
                          <td className="border border-slate-300 px-2.5 py-2 font-bold text-blue-900">
                            {row.stage}
                          </td>
                          <td className="border border-slate-300 px-2.5 py-2">{row.fokus}</td>
                          <td className="border border-slate-300 px-2.5 py-2">{row.ind}</td>
                          <td className="border border-slate-300 px-2.5 py-2">{row.gap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  4. FAKTOR PENDUKUNG & PENGHAMBAT · 5. SINTESIS & REKOMENDASI
                </h2>
                <p><strong>Faktor Pendukung:</strong> {meta.faktorPendukung}</p>
                <p><strong>Faktor Penghambat:</strong> {meta.faktorPenghambat}</p>
                <p><strong>Sintesis Efektivitas Sistemik & Substantif:</strong> {meta.kesimpulan}</p>
              </section>
            </div>
          )}

          {/* REPORT 4: PERBAIKAN & PENINGKATAN STANDAR */}
          {reportType === 'perbaikan_peningkatan' && (
            <div className="space-y-6 text-xs leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB I & II. PENDAHULUAN, STATISTIK PENGENDALIAN & HASIL RTM
                </h2>
                <p>
                  Dari {stats.nonCompliantCount} temuan KTS/Observasi, tingkat penutupan (<strong>Closure Rate</strong>) mencapai <strong>{stats.ptkClosureRatePct}%</strong> ({stats.ptkClosedCount} Closed, {stats.ptkInProgressCount} In Progress, {stats.ptkOpenCount} Open) dengan <strong>Indeks Reduksi Risiko KTS = {stats.riskReductionIndexPct}%</strong> dan rasio pelampauan standar (<strong>Best Practice</strong>) sebesar <strong>{stats.bestPracticeRatioPct}%</strong>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB III & IV. VISUALISASI MONEV PTK & ROADMAP PENINGKATAN STANDAR (CQI)
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 3.1 Status Verifikasi Monev PTK per Standar
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.standardMonevBreakdown}
                          layout="vertical"
                          margin={{ top: 5, right: 16, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="shortName" width={120} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="closedCount" name="Closed" stackId="m" fill="#16a34a" />
                          <Bar dataKey="inProgressCount" name="In Progress" stackId="m" fill="#d97706" />
                          <Bar dataKey="openCount" name="Open" stackId="m" fill="#dc2626" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-white">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Gambar 4.1 Roadmap Peningkatan Target Standar (CQI)
                    </div>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={amiChartData} margin={{ top: 8, right: 12, left: -12, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Capaian" name="Capaian Saat Ini" fill="#1e3a8a" />
                          <Bar dataKey="Target" name="Target Siklus Ini" fill="#d97706" />
                          <Bar dataKey="TargetCqi" name="Target Peningkatan CQI" fill="#059669" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="border border-slate-400 px-2 py-1.5 text-center">No</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Nama Standar</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Target Lama</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Target Baru (Peningkatan)</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Alasan Peningkatan</th>
                        <th className="border border-slate-400 px-2 py-1.5 text-left">Dokumen Revisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meta.standardUpgrades.map((u, idx) => (
                        <tr key={u.id} className="align-top">
                          <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                            {u.namaStandar}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">{u.targetLama}</td>
                          <td className="border border-slate-300 px-2 py-1.5 font-medium text-blue-950">
                            {u.targetBaru}
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5">{u.alasanPeningkatan}</td>
                          <td className="border border-slate-300 px-2 py-1.5">{u.dokumenRevisi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900 border-b border-blue-900 pb-1">
                  BAB V & VI. KENDALA, REKOMENDASI, KESIMPULAN & LAMPIRAN
                </h2>
                <p><strong>Kendala:</strong> {meta.faktorPenghambat}</p>
                <p><strong>Kesimpulan & Saran:</strong> {meta.kesimpulan} {meta.saran}</p>
              </section>
            </div>
          )}

          {/* Official Sign-Off Block */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">
                {scopeLevel === 'universitas'
                  ? 'Rektor Universitas Pattimura'
                  : scopeLevel === 'fakultas'
                  ? meta.pimpinanRtmJabatan
                  : `Dekan ${program.fakultas}`}
              </p>
              <div className="h-14" />
              <p className="font-bold underline underline-offset-4">
                {scopeLevel === 'universitas' || scopeLevel === 'fakultas'
                  ? meta.pimpinanRtmNama
                  : program.dekan_nama || '........................................'}
              </p>
              <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                NIP.{' '}
                {scopeLevel === 'universitas'
                  ? '........................'
                  : program.dekan_nip || '........................'}
              </p>
            </div>
            <div className="text-right">
              <p>
                {program.tempat_pengesahan || 'Ambon'},{' '}
                {reportType === 'rtm' || reportType === 'perbaikan_peningkatan'
                  ? meta.tanggalRtm
                  : meta.tanggalAudit}
              </p>
              <p className="font-bold">
                {scopeLevel === 'universitas'
                  ? 'Kepala LPMPP Universitas Pattimura'
                  : scopeLevel === 'fakultas'
                  ? reportType === 'ami'
                    ? 'Ketua Tim Auditor AMI LPMPP'
                    : `Ketua GJM ${shortenFacultyName(effectiveTargetFakultas)}`
                  : reportType === 'ami'
                  ? 'Ketua Tim Auditor AMI LPMPP'
                  : `Ketua Program Studi ${program.nama_prodi}`}
              </p>
              <div className="h-14" />
              <p className="font-bold underline underline-offset-4">
                {scopeLevel === 'universitas'
                  ? meta.kepalaLpmppNama
                  : scopeLevel === 'fakultas'
                  ? reportType === 'ami'
                    ? meta.ketuaAuditor
                    : meta.anggotaAuditor1
                  : reportType === 'ami'
                  ? meta.ketuaAuditor
                  : program.kaprodi_nama || '........................................'}
              </p>
              <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                NIP.{' '}
                {scopeLevel === 'universitas'
                  ? meta.kepalaLpmppNip
                  : scopeLevel === 'fakultas'
                  ? reportType === 'ami'
                    ? meta.ketuaAuditorNip
                    : '........................'
                  : reportType === 'ami'
                  ? meta.ketuaAuditorNip
                  : program.kaprodi_nip || '........................'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
