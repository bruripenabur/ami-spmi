import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  FileDown,
  Search,
  RotateCcw,
  ArrowUpRight,
  Layers,
  Info,
  Scale,
  Star,
  ShieldCheck,
  Minus,
  Plus,
  Equal,
} from 'lucide-react';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  JenisProdi,
  PpeppCluster,
  ProdiRankingEntry,
  RankingTier,
  StudyProgramIdentity,
} from '../../types/ami';
import {
  getClusterBadgeClasses,
  rankProgramsForCycle,
} from '../../utils/ppeppRanking';
import {
  exportRankingToExcel,
  exportRankingToPdf,
} from '../../utils/exportAmi';

interface TabPerengkinganKlasterProps {
  programs: StudyProgramIdentity[];
  activeProgramId: string;
  activeCycle: AmiCycle;
  cycles: AmiCycle[];
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  indicatorsByJenis?: Record<JenisProdi, AmiIndicator[]>;
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>;
  canExport?: boolean;
  onSelectCycle: (cycleId: string) => void;
  onSelectProgram: (programId: string) => void;
}

const CLUSTERS: {
  id: PpeppCluster;
  label: string;
  criteria: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'Unggul',
    label: 'Klaster Unggul',
    criteria: 'Skor Indeks Kualitas >= 83.0 · 0 KTS Mayor · Tidak Menurun',
    accentText: 'text-emerald-800',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-300',
    icon: Award,
  },
  {
    id: 'Stabil',
    label: 'Klaster Stabil',
    criteria: 'Skor Indeks Kualitas >= 68.0 · <= 1 KTS Mayor · Tren Stabil/Positif',
    accentText: 'text-blue-900',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-300',
    icon: CheckCircle2,
  },
  {
    id: 'Menurun',
    label: 'Klaster Menurun',
    criteria: 'Penurunan Skor Indeks Kualitas <= -2.0 poin vs Siklus Lalu',
    accentText: 'text-amber-800',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-300',
    icon: TrendingDown,
  },
  {
    id: 'Pembinaan',
    label: 'Klaster Pembinaan',
    criteria: 'Skor Indeks Kualitas < 68.0 atau terdapat >= 2 KTS Mayor',
    accentText: 'text-red-800',
    accentBg: 'bg-red-50',
    accentBorder: 'border-red-300',
    icon: AlertTriangle,
  },
];

const TIER_OPTIONS: { id: RankingTier; label: string; limit: number | null }[] = [
  { id: 'all', label: 'Semua Prodi', limit: null },
  { id: 'top10', label: 'Top 10 Terbaik', limit: 10 },
  { id: 'top25', label: 'Top 25 Terbaik', limit: 25 },
  { id: 'top50', label: 'Top 50 Terbaik', limit: 50 },
];

export const TabPerengkinganKlaster: React.FC<TabPerengkinganKlasterProps> = ({
  programs,
  activeProgramId,
  activeCycle,
  cycles,
  standards,
  indicators,
  indicatorsByJenis,
  evaluationsByContext,
  canExport = true,
  onSelectCycle,
  onSelectProgram,
}) => {
  const [tier, setTier] = useState<RankingTier>('all');
  const [clusterFilter, setClusterFilter] = useState<'all' | PpeppCluster>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMethodInfo, setShowMethodInfo] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const rankedAll = useMemo(
    () =>
      rankProgramsForCycle({
        programs,
        targetCycle: activeCycle,
        allCycles: cycles,
        standards,
        indicators,
        indicatorsByJenis,
        evaluationsByContext,
      }),
    [
      programs,
      activeCycle,
      cycles,
      standards,
      indicators,
      indicatorsByJenis,
      evaluationsByContext,
    ]
  );

  const faculties = useMemo(() => {
    const unique = Array.from(
      new Set(programs.map((p) => p.fakultas).filter(Boolean))
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const clusterStats = useMemo(() => {
    const total = rankedAll.length || 1;
    const map: Record<PpeppCluster, { count: number; pct: number }> = {
      Unggul: { count: 0, pct: 0 },
      Stabil: { count: 0, pct: 0 },
      Menurun: { count: 0, pct: 0 },
      Pembinaan: { count: 0, pct: 0 },
    };
    rankedAll.forEach((e) => {
      map[e.cluster].count += 1;
    });
    (Object.keys(map) as PpeppCluster[]).forEach((k) => {
      map[k].pct = Number(((map[k].count / total) * 100).toFixed(1));
    });
    return map;
  }, [rankedAll]);

  const tierOption = useMemo(
    () => TIER_OPTIONS.find((t) => t.id === tier) ?? TIER_OPTIONS[0],
    [tier]
  );

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rankedAll.filter((entry) => {
      if (tierOption.limit !== null && entry.rank > tierOption.limit) {
        return false;
      }
      if (clusterFilter !== 'all' && entry.cluster !== clusterFilter) {
        return false;
      }
      if (facultyFilter !== 'all' && entry.program.fakultas !== facultyFilter) {
        return false;
      }
      if (q) {
        const hay = `${entry.program.kode_ps} ${entry.program.nama_prodi} ${entry.program.fakultas} ${entry.program.jenis_prodi}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rankedAll, tierOption, clusterFilter, facultyFilter, searchQuery]);

  // Chart 1: Faculty stacked distribution across clusters (for the active cycle)
  const facultyChartData = useMemo(() => {
    const byFac = new Map<
      string,
      {
        fakultas: string;
        shortName: string;
        Unggul: number;
        Stabil: number;
        Menurun: number;
        Pembinaan: number;
        total: number;
      }
    >();

    rankedAll.forEach((e) => {
      const fac = e.program.fakultas || 'Lainnya';
      const existing = byFac.get(fac) ?? {
        fakultas: fac,
        shortName: fac
          .replace(/^Fakultas\s+/i, 'F. ')
          .replace(/^Pascasarjana/i, 'Pasca')
          .slice(0, 18),
        Unggul: 0,
        Stabil: 0,
        Menurun: 0,
        Pembinaan: 0,
        total: 0,
      };
      existing[e.cluster] += 1;
      existing.total += 1;
      byFac.set(fac, existing);
    });

    return Array.from(byFac.values()).sort((a, b) => b.total - a.total);
  }, [rankedAll]);

  // Chart 2: Top 10 best programs in active cycle
  const top10ChartData = useMemo(() => {
    return rankedAll.slice(0, 10).map((e) => ({
      name: `#${e.rank} ${
        e.program.nama_prodi.length > 22
          ? `${e.program.nama_prodi.slice(0, 22)}...`
          : e.program.nama_prodi
      }`,
      fullName: `${e.program.nama_prodi} (${e.program.fakultas})`,
      skorIndeksKualitas: e.skorIndeksKualitas,
      skorAwal: e.skorAwal,
    }));
  }, [rankedAll]);

  const cycleAverageQualityIndex = useMemo(() => {
    if (rankedAll.length === 0) return 0;
    const sum = rankedAll.reduce((acc, e) => acc + e.skorIndeksKualitas, 0);
    return Number((sum / rankedAll.length).toFixed(2));
  }, [rankedAll]);

  const hasActiveFilters =
    tier !== 'all' ||
    clusterFilter !== 'all' ||
    facultyFilter !== 'all' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setTier('all');
    setClusterFilter('all');
    setFacultyFilter('all');
    setSearchQuery('');
  };

  const handleExportExcel = () => {
    exportRankingToExcel({
      cycle: activeCycle,
      entries: filteredEntries,
      tierLabel: tierOption.label,
      clusterFilter,
    });
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportRankingToPdf({
        cycle: activeCycle,
        entries: filteredEntries,
        tier,
        clusterFilter,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const renderClusterIcon = (cluster: PpeppCluster) => {
    switch (cluster) {
      case 'Unggul':
        return <Award className="h-3.5 w-3.5 shrink-0" />;
      case 'Stabil':
        return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
      case 'Menurun':
        return <TrendingDown className="h-3.5 w-3.5 shrink-0" />;
      case 'Pembinaan':
        return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Cycle Controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                Perengkingan &amp; Klasterisasi Mutu PPEPP Program Studi
              </h1>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800">
                Siklus {activeCycle.tahun_siklus}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Pemeringkatan objektif per siklus 1 tahun menggunakan{' '}
              <span className="font-semibold text-slate-800">
                Skor Indeks Kualitas
              </span>{' '}
              (keseimbangan Rata-rata Capaian, Penalti Temuan KTS, dan Bonus Best Practice) serta
              klasterisasi{' '}
              <span className="font-semibold text-slate-800">
                Unggul, Stabil, Menurun, dan Pembinaan
              </span>{' '}
              untuk {rankedAll.length} Program Studi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <label
                htmlFor="ranking-cycle-select"
                className="text-xs font-semibold text-slate-700 whitespace-nowrap"
              >
                Tahun Siklus:
              </label>
              <select
                id="ranking-cycle-select"
                disabled={cycles.length <= 1}
                value={activeCycle.id}
                onChange={(e) => onSelectCycle(e.target.value)}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-100"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tahun_siklus} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMethodInfo((prev) => !prev)}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Info className="h-3.5 w-3.5 text-blue-800" />
              {showMethodInfo ? 'Sembunyikan Keterangan' : 'Tampilkan Keterangan Metodologi'}
            </button>

            {canExport && (
              <>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={filteredEntries.length === 0}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                  Ekspor Excel
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={filteredEntries.length === 0 || isExportingPdf}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5 text-amber-400" />
                  {isExportingPdf ? 'Menyiapkan PDF...' : 'Cetak / Unduh PDF'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Keterangan Metodologi Skor Indeks Kualitas */}
        {showMethodInfo && (
          <div className="mt-5 border-t border-slate-200 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Metodologi Skor Indeks Kualitas: Menilai Keseimbangan Mutu Secara Objektif
                </h2>
                <p className="text-xs text-slate-600">
                  Formula resmi pemeringkatan Program Studi setiap 1 tahun siklus PPEPP di Universitas Pattimura
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-900">
                <Scale className="h-3.5 w-3.5 text-blue-800" />
                Skor = Capaian (%) − 2.0(M) − 0.5(m) − 0.1(OB) + 0.5(BP)
              </span>
            </div>

            {/* Visual Formula Flow Bar matching Skor Indeks Kualitas infographic */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
              {/* 1. Skor Awal */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-teal-200 bg-white px-2.5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900">Skor Awal</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  Rata-rata Capaian (%) Program Studi
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-500 py-0.5 lg:px-0.5">
                <Minus className="h-4 w-4 shrink-0" />
              </div>

              {/* 2. Penalti Mayor */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-red-300 bg-white px-2.5 py-3">
                <div className="flex h-9 min-w-[44px] px-2 items-center justify-center rounded-lg bg-red-800 font-mono text-xs font-bold text-white">
                  2.0
                </div>
                <div className="mt-2 text-xs font-bold text-red-900">Penalti Mayor</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  Dikurangi <span className="font-mono font-semibold text-red-800">2.0 poin</span>{' '}
                  (ketidaksesuaian kritis)
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-500 py-0.5 lg:px-0.5">
                <Minus className="h-4 w-4 shrink-0" />
              </div>

              {/* 3. Penalti Minor */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-3">
                <div className="flex h-9 min-w-[44px] px-2 items-center justify-center rounded-lg bg-red-600 font-mono text-xs font-bold text-white">
                  0.5
                </div>
                <div className="mt-2 text-xs font-bold text-red-800">Penalti Minor</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  Dikurangi <span className="font-mono font-semibold text-red-700">0.5 poin</span>
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-500 py-0.5 lg:px-0.5">
                <Minus className="h-4 w-4 shrink-0" />
              </div>

              {/* 4. Penalti Observasi */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-white px-2.5 py-3">
                <div className="flex h-9 min-w-[44px] px-2 items-center justify-center rounded-lg bg-rose-400 font-mono text-xs font-bold text-white">
                  0.1
                </div>
                <div className="mt-2 text-xs font-bold text-rose-900">Penalti Observasi</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  Dikurangi <span className="font-mono font-semibold text-rose-800">0.1 poin</span>
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-500 py-0.5 lg:px-0.5">
                <Plus className="h-4 w-4 shrink-0" />
              </div>

              {/* 5. Bonus Best Practice */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-amber-300 bg-white px-2.5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                  <Star className="h-4 w-4" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900">Bonus Best Practice</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  Ditambah <span className="font-mono font-semibold text-amber-800">0.5 poin</span>{' '}
                  (praktik keunggulan)
                </div>
              </div>

              <div className="flex items-center justify-center text-slate-600 py-0.5 lg:px-0.5">
                <Equal className="h-4 w-4 shrink-0" />
              </div>

              {/* 6. Hasil: Skor Indeks Kualitas */}
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-3 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-800 text-amber-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold tracking-wide text-amber-300">
                  SKOR INDEKS KUALITAS
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-300">
                  Dasar Peringkat &amp; Klaster Mutu
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Keterangan Penentuan Klaster:</span>{' '}
              Prodi dikategorikan <span className="font-semibold text-amber-800">Menurun</span> jika
              Skor Indeks Kualitas turun &le; −2.0 poin dibanding siklus tahun sebelumnya;{' '}
              <span className="font-semibold text-red-800">Pembinaan</span> jika Skor Indeks Kualitas
              &lt; 68.0 atau terdapat &ge; 2 KTS Mayor;{' '}
              <span className="font-semibold text-emerald-800">Unggul</span> jika Skor Indeks Kualitas
              &ge; 83.0 dengan 0 KTS Mayor; serta{' '}
              <span className="font-semibold text-blue-900">Stabil</span> apabila memenuhi standar mutu
              (&ge; 68.0) secara konsisten.
            </div>
          </div>
        )}
      </section>

      {/* 4 Interactive Cluster Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CLUSTERS.map((cl) => {
          const Icon = cl.icon;
          const stat = clusterStats[cl.id];
          const isSelected = clusterFilter === cl.id;
          return (
            <button
              key={cl.id}
              type="button"
              onClick={() =>
                setClusterFilter((prev) => (prev === cl.id ? 'all' : cl.id))
              }
              className={`text-left rounded-xl border p-4 transition-colors ${
                isSelected
                  ? `${cl.accentBorder} ${cl.accentBg}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${cl.accentText}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {cl.label}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-600">
                  {stat.pct}%
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {stat.count}
                </span>
                <span className="text-xs text-slate-500">Program Studi</span>
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-slate-600">
                {cl.criteria}
              </div>
              <div className="mt-2.5 text-[11px] font-semibold text-blue-800">
                {isSelected
                  ? 'Filter Aktif · Klik untuk tampilkan semua'
                  : 'Klik untuk saring klaster'}
              </div>
            </button>
          );
        })}
      </section>

      {/* Tier Segmented Controls + Faculty + Search Filter Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Tier Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              Urutan Terbaik:
            </span>
            {TIER_OPTIONS.map((opt) => {
              const active = tier === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTier(opt.id)}
                  className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Cluster, Faculty, and Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter Klaster Mutu"
              value={clusterFilter}
              onChange={(e) =>
                setClusterFilter(e.target.value as 'all' | PpeppCluster)
              }
              className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none"
            >
              <option value="all">Semua Klaster (4)</option>
              <option value="Unggul">Klaster Unggul</option>
              <option value="Stabil">Klaster Stabil</option>
              <option value="Menurun">Klaster Menurun</option>
              <option value="Pembinaan">Klaster Pembinaan</option>
            </select>

            <select
              aria-label="Filter Fakultas"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-800 focus:outline-none max-w-[220px]"
            >
              <option value="all">Semua Fakultas ({faculties.length})</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px] sm:min-w-[230px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode PS atau nama prodi..."
                className="min-h-[36px] w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
          <span>
            Menampilkan{' '}
            <span className="font-mono font-bold text-slate-900">
              {filteredEntries.length}
            </span>{' '}
            dari{' '}
            <span className="font-mono font-semibold text-slate-800">
              {rankedAll.length}
            </span>{' '}
            Program Studi · Cakupan:{' '}
            <span className="font-semibold text-slate-800">{tierOption.label}</span>
          </span>
          <span>
            Rata-rata Skor Indeks Kualitas Cakupan:{' '}
            <span className="font-mono font-bold text-blue-900">
              {cycleAverageQualityIndex.toFixed(2)}
            </span>
          </span>
        </div>
      </section>

      {/* Analytical Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Chart: Stacked Cluster Distribution by Faculty */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Sebaran Klaster Mutu PPEPP per Fakultas
            </h2>
            <p className="text-xs text-slate-500">
              Komposisi jumlah Program Studi pada masing-masing klaster mutu (Siklus{' '}
              {activeCycle.tahun_siklus})
            </p>
          </div>
          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={facultyChartData}
                margin={{ top: 8, right: 12, left: -12, bottom: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={56}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: '#CBD5E1',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Unggul" stackId="a" fill="#16A34A" name="Unggul" />
                <Bar dataKey="Stabil" stackId="a" fill="#1D4ED8" name="Stabil" />
                <Bar dataKey="Menurun" stackId="a" fill="#D97706" name="Menurun" />
                <Bar
                  dataKey="Pembinaan"
                  stackId="a"
                  fill="#DC2626"
                  name="Pembinaan"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Top 10 Ranked Programs Comparison */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Top 10 Program Studi Terbaik · Siklus {activeCycle.tahun_siklus}
            </h2>
            <p className="text-xs text-slate-500">
              Perbandingan Skor Indeks Kualitas (setelah penalti &amp; bonus) vs Skor Awal Capaian (%)
            </p>
          </div>
          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10ChartData}
                layout="vertical"
                margin={{ top: 4, right: 18, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  domain={[0, 110]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 10, fill: '#1E293B' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: '#CBD5E1',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="skorIndeksKualitas"
                  fill="#0F172A"
                  name="Skor Indeks Kualitas"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="skorAwal"
                  fill="#0D9488"
                  name="Skor Awal (Capaian %)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* High-Density Ranking & Clustering Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Peringkat Skor Indeks Kualitas &amp; Klasterisasi Program Studi
            </h2>
            <p className="text-xs text-slate-500">
              Klik &quot;Pilih Prodi&quot; untuk membuka data detail Prodi di seluruh modul instrumen &amp; laporan
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            −2.0/Mayor · −0.5/Minor · −0.1/Observasi · +0.5/Best Practice
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada Program Studi yang sesuai dengan kombinasi filter saat ini.
            </p>
            <p className="text-xs text-slate-500">
              Coba ubah cakupan peringkat (Top 10 / Top 25 / Top 50 / Semua) atau hapus kata kunci pencarian.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1140px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="px-3.5 py-3 w-16 text-center">Rank</th>
                  <th className="px-3.5 py-3">Program Studi &amp; Fakultas</th>
                  <th className="px-3 py-3 w-24 text-right">Skor Awal</th>
                  <th className="px-3 py-3 w-52">Penalti &amp; Bonus Mutu</th>
                  <th className="px-3 py-3 w-32 text-right">Indeks Kualitas</th>
                  <th className="px-3 py-3 w-24 text-right">Indeks PPEPP</th>
                  <th className="px-3 py-3 w-24 text-right">Tren YoY</th>
                  <th className="px-3 py-3 min-w-[230px]">Klaster &amp; Analisis Mutu</th>
                  <th className="px-3.5 py-3 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry: ProdiRankingEntry) => {
                  const isActiveProdi = entry.program.id === activeProgramId;
                  const deltaPositive = entry.deltaKualitas > 0;
                  const deltaNegative = entry.deltaKualitas < 0;

                  return (
                    <tr
                      key={entry.program.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isActiveProdi ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-3.5 py-3 text-center">
                        <span
                          className={`inline-flex h-7 min-w-[32px] items-center justify-center rounded-md px-1.5 font-mono text-xs font-bold tabular-nums ${
                            entry.rank <= 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : entry.rank <= 10
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-900">
                          {entry.program.nama_prodi}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono">{entry.program.kode_ps}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.program.fakultas}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 font-medium">
                            {entry.program.peringkat_akreditasi}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-teal-800">
                        {entry.skorAwal.toFixed(1)}%
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] tabular-nums">
                          <span
                            title={`${entry.ktsMayor} temuan Mayor × -2.0`}
                            className={`rounded px-1.5 py-0.5 ${
                              entry.ktsMayor > 0
                                ? 'bg-red-100 text-red-900 font-bold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            M:{entry.ktsMayor} (−{entry.penaltiMayor.toFixed(1)})
                          </span>
                          <span
                            title={`${entry.ktsMinor} temuan Minor × -0.5`}
                            className={`rounded px-1.5 py-0.5 ${
                              entry.ktsMinor > 0
                                ? 'bg-rose-50 text-rose-800 font-semibold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            m:{entry.ktsMinor} (−{entry.penaltiMinor.toFixed(1)})
                          </span>
                          <span
                            title={`${entry.observasi} temuan Observasi × -0.1`}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700"
                          >
                            OB:{entry.observasi} (−{entry.penaltiObservasi.toFixed(1)})
                          </span>
                          <span
                            title={`${entry.bestPractice} Best Practice × +0.5`}
                            className={`rounded px-1.5 py-0.5 ${
                              entry.bestPractice > 0
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            BP:{entry.bestPractice} (+{entry.bonusBestPractice.toFixed(1)})
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <span className="inline-block rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-bold tabular-nums text-white">
                          {entry.skorIndeksKualitas.toFixed(2)}
                        </span>
                      </td>

                      <td
                        title={`P1:${entry.penetapan} P2:${entry.pelaksanaan} P3:${entry.evaluasi} P4:${entry.pengendalian} P5:${entry.peningkatan}`}
                        className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-slate-700"
                      >
                        {entry.indeksPpepp.toFixed(1)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {entry.prevSkorIndeksKualitas === null ? (
                          <span className="text-slate-400">Baseline</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 font-semibold ${
                              deltaPositive
                                ? 'text-emerald-700'
                                : deltaNegative
                                ? 'text-red-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {deltaPositive && (
                              <TrendingUp className="h-3 w-3 shrink-0" />
                            )}
                            {deltaNegative && (
                              <TrendingDown className="h-3 w-3 shrink-0" />
                            )}
                            {deltaPositive ? '+' : ''}
                            {entry.deltaKualitas.toFixed(1)}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${getClusterBadgeClasses(
                              entry.cluster
                            )}`}
                          >
                            {renderClusterIcon(entry.cluster)}
                            {entry.cluster}
                          </span>
                          <span className="text-[11px] leading-snug text-slate-600">
                            {entry.clusterReason}
                          </span>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectProgram(entry.program.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                            isActiveProdi
                              ? 'bg-blue-900 text-white'
                              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isActiveProdi ? 'Prodi Aktif' : 'Pilih Prodi'}
                          {!isActiveProdi && (
                            <ArrowUpRight className="h-3 w-3 shrink-0" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
