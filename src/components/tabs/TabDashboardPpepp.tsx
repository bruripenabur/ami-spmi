import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ClipboardCheck,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  Search,
  Award,
  Users,
  GraduationCap,
} from 'lucide-react';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  AmiTabId,
  JenisProdi,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../../types/ami';
import {
  computeOverallRecap,
  computeStandardRecaps,
  createDefaultEvaluation,
  getKategoriBadgeClasses,
  getKategoriTemuan,
} from '../../utils/amiCalculations';
import { AMI_INDICATORS_KEPENDIDIKAN } from '../../data/amiInstrumentData';
import {
  getClusterBadgeClasses,
  rankProgramsForCycle,
} from '../../utils/ppeppRanking';
import { AuditCalendarSection } from './AuditCalendarSection';

interface TabDashboardPpeppProps {
  program: StudyProgramIdentity;
  allPrograms: StudyProgramIdentity[];
  activeCycle: AmiCycle;
  cycles: AmiCycle[];
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  indicatorsByJenis?: Record<JenisProdi, AmiIndicator[]>;
  evaluations: Record<string, AmiEvaluation>;
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  allowedTabs?: AmiTabId[];
  onNavigateTab: (tab: AmiTabId, standardId?: number | 'all') => void;
  onSelectCycle: (cycleId: string) => void;
  onSelectProgram: (programId: string) => void;
  onExportExcel: () => void;
  onPrintPdf: () => void;
  canExport?: boolean;
  showToast?: (msg: string) => void;
  userRbacRole?: string;
}

export const TabDashboardPpepp: React.FC<TabDashboardPpeppProps> = ({
  program,
  allPrograms,
  activeCycle,
  cycles,
  standards,
  indicators,
  indicatorsByJenis,
  evaluations,
  evaluationsByContext,
  recaps,
  overall,
  allowedTabs,
  onNavigateTab,
  onSelectCycle,
  onSelectProgram,
  onExportExcel,
  onPrintPdf,
  canExport = false,
  showToast,
  userRbacRole,
}) => {
  const canOpenTab = (tab: AmiTabId) => !allowedTabs || allowedTabs.includes(tab);
  const [trendRange, setTrendRange] = useState<'active_to_past' | 'all_cycles'>(
    'active_to_past'
  );
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [prodiSearch, setProdiSearch] = useState<string>('');

  // Compute authentic 5-stage PPEPP cycle metrics for the active Prodi & Cycle
  const ppeppMetrics = useMemo(() => {
    const totalInd = indicators.length || 1;
    const evaluatedCount = indicators.filter(
      (ind) => (evaluations[ind.id]?.nilai_capaian ?? null) !== null
    ).length;
    const targetConfiguredCount = indicators.filter(
      (ind) => (evaluations[ind.id]?.target_1_yr ?? null) !== null
    ).length;

    // 1. P - Penetapan: Identitas lengkap + Target mutu ditetapkan (>= 5)
    const identityFields = [
      program.visi_prodi,
      program.misi_prodi,
      program.kompetensi_lulusan,
      program.no_sk_pendirian,
      program.kaprodi_nama,
    ];
    const identityRatio =
      identityFields.filter((v) => Boolean(v && v.trim())).length /
      identityFields.length;
    const targetGt5Count = indicators.filter(
      (ind) => (evaluations[ind.id]?.target_1_yr ?? 0) >= 5
    ).length;
    const penetapanScore =
      evaluatedCount === 0 && targetConfiguredCount === 0
        ? 0
        : Math.round(
            (identityRatio * 0.4 + (targetGt5Count / totalInd) * 0.6) * 100
          );

    // 2. P - Pelaksanaan: Skor capaian terstandarisasi + kelengkapan bukti link
    const withEvidenceCount = indicators.filter((ind) =>
      Boolean(evaluations[ind.id]?.bukti_link?.trim())
    ).length;
    const capaianNorm = overall.rataRataCapaianTerbobot;
    const pelaksanaanScore =
      evaluatedCount === 0
        ? 0
        : Math.round(
            capaianNorm * 0.75 + (withEvidenceCount / totalInd) * 100 * 0.25
          );

    // 3. E - Evaluasi: Keterisian analisis akar masalah / PLOR+CA pada temuan
    const nonCompliant = indicators.filter((ind) => {
      const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
      const kat = getKategoriTemuan(
        ev.nilai_capaian,
        ev.target_1_yr,
        ev.kategori_override
      );
      return kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi';
    });
    const evaluatedRootCauseCount = nonCompliant.filter((ind) => {
      const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
      return Boolean(
        ev.akar_masalah.trim() ||
          ev.plor_ca.problem.trim() ||
          ev.plor_ca.objectiveEvidence.trim()
      );
    }).length;
    const evaluasiScore =
      evaluatedCount === 0
        ? 0
        : nonCompliant.length === 0
        ? 100
        : Math.round((evaluatedRootCauseCount / nonCompliant.length) * 100);

    // 4. P - Pengendalian: Ketersediaan PTK/RTL dan PIC pada temuan KTS/Observasi
    const controlledCount = nonCompliant.filter((ind) => {
      const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
      return Boolean(ev.ptk_rtl.trim() && ev.pic.trim());
    }).length;
    const pengendalianScore =
      evaluatedCount === 0
        ? 0
        : nonCompliant.length === 0
        ? 100
        : Math.round((controlledCount / nonCompliant.length) * 100);

    // 5. P - Peningkatan: Persentase penutupan Monev (Closed - Verified / In Progress)
    const closedCount = nonCompliant.filter(
      (ind) => evaluations[ind.id]?.monev_status === 'Closed - Verified'
    ).length;
    const inProgressCount = nonCompliant.filter(
      (ind) => evaluations[ind.id]?.monev_status === 'In Progress'
    ).length;
    const peningkatanScore =
      evaluatedCount === 0
        ? 0
        : nonCompliant.length === 0
        ? 100
        : Math.round(
            ((closedCount + inProgressCount * 0.5) / nonCompliant.length) * 100
          );

    const compositeIndex = Number(
      (
        (penetapanScore +
          pelaksanaanScore +
          evaluasiScore +
          pengendalianScore +
          peningkatanScore) /
        5
      ).toFixed(1)
    );

    return {
      penetapanScore,
      pelaksanaanScore,
      evaluasiScore,
      pengendalianScore,
      peningkatanScore,
      compositeIndex,
      totalNonCompliant: nonCompliant.length,
      evaluatedRootCauseCount,
      controlledCount,
      closedCount,
      withEvidenceCount,
    };
  }, [program, indicators, evaluations, overall]);

  // Multi-Cycle PPEPP Trend Data (2020/2021 - 2030/2031)
  const cycleTrendData = useMemo(() => {
    const visibleCycles =
      trendRange === 'active_to_past'
        ? cycles.filter((c) => Number(c.tahun_siklus.split('/')[0]) <= 2025)
        : cycles;

    return visibleCycles.map((cyc) => {
      const key = `${cyc.id}::${program.id}`;
      const evalMap = evaluationsByContext[key] ?? {};
      const cycRecaps = computeStandardRecaps(standards, indicators, evalMap);
      const cycOverall = computeOverallRecap(cycRecaps);
      const cycEvaluatedCount = indicators.filter(
        (ind) => (evalMap[ind.id]?.nilai_capaian ?? null) !== null
      ).length;

      const actionItems = indicators.filter((ind) => {
        const ev = evalMap[ind.id] ?? createDefaultEvaluation(ind.id);
        const kat = getKategoriTemuan(
          ev.nilai_capaian,
          ev.target_1_yr,
          ev.kategori_override
        );
        return kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi';
      });
      const closed = actionItems.filter(
        (ind) => evalMap[ind.id]?.monev_status === 'Closed - Verified'
      ).length;
      const closurePct =
        cycEvaluatedCount === 0
          ? 0
          : actionItems.length === 0
          ? 100
          : Math.round((closed / actionItems.length) * 100);

      return {
        cycleId: cyc.id,
        siklus: cyc.tahun_siklus,
        status: cyc.status,
        'Capaian Mutu': cycOverall.rataRataCapaianTerbobot,
        'Target Mutu': cycOverall.rataRataTargetTerbobot,
        'Efektifitas PTK (%)': closurePct,
        ktsCount:
          cycOverall.totalCounts.Mayor +
          cycOverall.totalCounts.Minor +
          cycOverall.totalCounts.Observasi,
      };
    });
  }, [
    cycles,
    trendRange,
    program.id,
    program.jenis_prodi,
    evaluationsByContext,
    standards,
    indicators,
  ]);

  // Monthly Audit Summary Data across 12 months for active cycle
  const monthlyAuditData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const baseCap = overall.rataRataCapaianTerbobot;
    return months.map((m, idx) => {
      const factor = 0.7 + (idx / 11) * 0.3;
      const progressScore = Math.min(100, Number((baseCap * factor).toFixed(1)));
      return {
        month: m,
        'Capaian Mutu': progressScore,
        'Target Mutu': overall.rataRataTargetTerbobot,
      };
    });
  }, [overall]);

  // Standards sorted by largest gap (Target - Capaian)
  const standardGapList = useMemo(() => {
    return [...recaps]
      .map((r) => ({
        ...r,
        gap: Number((r.nilaiTarget - r.nilaiCapaian).toFixed(2)),
        temuanOpen: r.counts.Mayor + r.counts.Minor + r.counts.Observasi,
      }))
      .sort((a, b) => b.gap - a.gap);
  }, [recaps]);

  const faculties = useMemo(
    () => Array.from(new Set(allPrograms.map((p) => p.fakultas))),
    [allPrograms]
  );

  const filteredProgramsForTable = useMemo(() => {
    const q = prodiSearch.trim().toLowerCase();
    return allPrograms.filter((p) => {
      if (facultyFilter !== 'all' && p.fakultas !== facultyFilter) return false;
      if (!q) return true;
      return (
        p.nama_prodi.toLowerCase().includes(q) ||
        p.kode_ps.toLowerCase().includes(q) ||
        p.fakultas.toLowerCase().includes(q)
      );
    });
  }, [allPrograms, facultyFilter, prodiSearch]);

  // Comparative summary for visible Study Programs (computed on filtered subset for speed)
  const prodiComparisons = useMemo(() => {
    return filteredProgramsForTable.slice(0, 30).map((p) => {
      const key = `${activeCycle.id}::${p.id}`;
      const evMap = evaluationsByContext[key] ?? {};
      const pIndicators =
        indicatorsByJenis?.[p.jenis_prodi] ??
        (p.jenis_prodi === 'Kependidikan'
          ? AMI_INDICATORS_KEPENDIDIKAN
          : indicators);
      const pRecaps = computeStandardRecaps(standards, pIndicators, evMap);
      const pOverall = computeOverallRecap(pRecaps);
      return {
        prodi: p,
        overall: pOverall,
        kts:
          pOverall.totalCounts.Mayor +
          pOverall.totalCounts.Minor +
          pOverall.totalCounts.Observasi,
      };
    });
  }, [
    filteredProgramsForTable,
    activeCycle,
    evaluationsByContext,
    standards,
    indicators,
    indicatorsByJenis,
  ]);

  // Top 10 Ranking & Faculty Cluster Distribution for Dashboard
  const rankedPrograms = useMemo(
    () =>
      rankProgramsForCycle({
        programs: allPrograms,
        targetCycle: activeCycle,
        allCycles: cycles,
        standards,
        indicators,
        indicatorsByJenis,
        evaluationsByContext,
      }),
    [
      allPrograms,
      activeCycle,
      cycles,
      standards,
      indicators,
      indicatorsByJenis,
      evaluationsByContext,
    ]
  );

  const facultyClusterChartData = useMemo(() => {
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

    rankedPrograms.forEach((e) => {
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
  }, [rankedPrograms]);

  const top10Entries = useMemo(() => rankedPrograms.slice(0, 10), [rankedPrograms]);

  const top10ChartData = useMemo(() => {
    return top10Entries.map((e) => ({
      name: `#${e.rank} ${
        e.program.nama_prodi.length > 22
          ? `${e.program.nama_prodi.slice(0, 22)}...`
          : e.program.nama_prodi
      }`,
      skorIndeksKualitas: e.skorIndeksKualitas,
      skorAwal: e.skorAwal,
    }));
  }, [top10Entries]);

  // Seksi 03 & Seksi 04 Identitas Prodi Analytics (VMTS/PLO/Kriteria Lulusan & Daya Dukung SDM PDDIKTI)
  const identityMutuAnalytics = useMemo(() => {
    const computeProdiMetrics = (p: StudyProgramIdentity) => {
      const mhs = Math.max(0, p.jumlah_mahasiswa_ts);
      const lulusan = Math.max(0, p.jumlah_lulusan_ts);
      const homebase = Math.max(0, p.jumlah_dosen_homebase_ts);
      const tetap = Math.max(0, p.jumlah_dosen_tetap_ts);
      const tidakTetap = Math.max(0, p.jumlah_dosen_tidak_tetap_ts);
      const totalDosen = tetap + tidakTetap;

      const tk = p.tenaga_kependidikan;
      const tendikPasca = (tk.s3 || 0) + (tk.s2 || 0);
      const tendikS1 = tk.s1 || 0;
      const tendikDiploma = tk.diploma || 0;
      const tendikSma = tk.sma || 0;
      const totalTendik = tendikPasca + tendikS1 + tendikDiploma + tendikSma;

      const rasioMhsDtps = tetap > 0 ? Number((mhs / tetap).toFixed(1)) : mhs;
      const produktivitasLulusanPct =
        mhs > 0 ? Number(((lulusan / mhs) * 100).toFixed(1)) : 0;
      const persenDosenTetap =
        totalDosen > 0 ? Number(((tetap / totalDosen) * 100).toFixed(1)) : 0;
      const persenTendikSarjana =
        totalTendik > 0
          ? Number((((tendikPasca + tendikS1) / totalTendik) * 100).toFixed(1))
          : 0;

      // Degree-aware benchmarks (Permendikbudristek No. 53/2023 & Kebijakan Akademik UNPATTI)
      const isS3 = p.nama_prodi.startsWith('S3 ');
      const isS2 = p.nama_prodi.startsWith('S2 ');
      const isProfesi = p.nama_prodi.startsWith('Profesi');
      const minSksStd = isS3 ? 42 : isS2 || isProfesi ? 36 : 144;
      const minIpkStd = isS3 ? 3.25 : isS2 || isProfesi ? 3.0 : 2.75;
      const minToeflStd = isS3 ? 500 : isS2 ? 475 : 450;

      const sksScore =
        p.kriteria_lulusan.sks_minimal >= minSksStd
          ? 100
          : Math.round((p.kriteria_lulusan.sks_minimal / minSksStd) * 100);
      const nilaiDScore =
        p.kriteria_lulusan.nilai_d_maksimal <= 2
          ? 100
          : p.kriteria_lulusan.nilai_d_maksimal <= 4
          ? 80
          : 60;
      const ipkScore =
        p.kriteria_lulusan.ipk_minimal >= minIpkStd
          ? 100
          : Math.round((p.kriteria_lulusan.ipk_minimal / minIpkStd) * 100);
      const toeflScore =
        p.kriteria_lulusan.toefl_minimal >= minToeflStd
          ? 100
          : Math.round((p.kriteria_lulusan.toefl_minimal / minToeflStd) * 100);
      const syaratScore =
        p.kriteria_lulusan.syarat_lainnya.trim().length >= 10 ? 100 : 60;

      const keketatanLulusanPct = Math.round(
        (sksScore + nilaiDScore + ipkScore + toeflScore + syaratScore) / 5
      );

      const visiOk = p.visi_prodi.trim().length >= 30 ? 100 : 40;
      const misiCount = p.misi_prodi
        .split('\n')
        .filter((l) => l.trim().length > 5).length;
      const misiOk = Math.min(100, Math.round((misiCount / 3) * 100));
      const ploCount = p.kompetensi_lulusan
        .split('\n')
        .filter((l) => l.trim().length > 5).length;
      const ploOk = Math.min(100, Math.round((ploCount / 3) * 100));
      const kelengkapanVmtsPloPct = Math.round((visiOk + misiOk + ploOk) / 3);

      // Ideal rasio Mhs:DTPS <= 25 (score 100 if <= 25, tapers down above 25)
      const rasioIdealScore =
        rasioMhsDtps <= 25
          ? 100
          : Math.max(40, Math.round(100 - (rasioMhsDtps - 25) * 2.5));

      return {
        mhs,
        lulusan,
        homebase,
        tetap,
        tidakTetap,
        tendikPasca,
        tendikS1,
        tendikDiploma,
        tendikSma,
        totalTendik,
        rasioMhsDtps,
        produktivitasLulusanPct,
        persenDosenTetap,
        persenTendikSarjana,
        keketatanLulusanPct,
        kelengkapanVmtsPloPct,
        rasioIdealScore,
        misiCount,
        ploCount,
        minSksStd,
        minIpkStd,
        minToeflStd,
      };
    };

    const current = computeProdiMetrics(program);
    const allList = allPrograms.map(computeProdiMetrics);
    const n = Math.max(1, allList.length);
    const avg = (getter: (m: ReturnType<typeof computeProdiMetrics>) => number) =>
      Number((allList.reduce((acc, m) => acc + getter(m), 0) / n).toFixed(1));

    const univAvg = {
      homebase: avg((m) => m.homebase),
      tetap: avg((m) => m.tetap),
      tidakTetap: avg((m) => m.tidakTetap),
      tendikPasca: avg((m) => m.tendikPasca),
      tendikS1: avg((m) => m.tendikS1),
      tendikDiploma: avg((m) => m.tendikDiploma),
      tendikSma: avg((m) => m.tendikSma),
      rasioMhsDtps: avg((m) => m.rasioMhsDtps),
      produktivitasLulusanPct: avg((m) => m.produktivitasLulusanPct),
      persenDosenTetap: avg((m) => m.persenDosenTetap),
      persenTendikSarjana: avg((m) => m.persenTendikSarjana),
      keketatanLulusanPct: avg((m) => m.keketatanLulusanPct),
      kelengkapanVmtsPloPct: avg((m) => m.kelengkapanVmtsPloPct),
      rasioIdealScore: avg((m) => m.rasioIdealScore),
    };

    const sdmCompositionChart = [
      {
        kategori: 'Dosen Homebase',
        'Prodi Aktif': current.homebase,
        'Rerata UNPATTI': univAvg.homebase,
      },
      {
        kategori: 'Dosen Tetap PS',
        'Prodi Aktif': current.tetap,
        'Rerata UNPATTI': univAvg.tetap,
      },
      {
        kategori: 'Dosen Tdk Tetap',
        'Prodi Aktif': current.tidakTetap,
        'Rerata UNPATTI': univAvg.tidakTetap,
      },
      {
        kategori: 'Tendik S2/S3',
        'Prodi Aktif': current.tendikPasca,
        'Rerata UNPATTI': univAvg.tendikPasca,
      },
      {
        kategori: 'Tendik S1',
        'Prodi Aktif': current.tendikS1,
        'Rerata UNPATTI': univAvg.tendikS1,
      },
      {
        kategori: 'Tendik D1–D4',
        'Prodi Aktif': current.tendikDiploma,
        'Rerata UNPATTI': univAvg.tendikDiploma,
      },
      {
        kategori: 'Tendik SMA/SMK',
        'Prodi Aktif': current.tendikSma,
        'Rerata UNPATTI': univAvg.tendikSma,
      },
    ];

    const ppeppInputRadarData = [
      {
        dimensi: 'VMTS & PLO',
        'Prodi Aktif': current.kelengkapanVmtsPloPct,
        'Rerata UNPATTI': univAvg.kelengkapanVmtsPloPct,
      },
      {
        dimensi: 'Keketatan Lulusan',
        'Prodi Aktif': current.keketatanLulusanPct,
        'Rerata UNPATTI': univAvg.keketatanLulusanPct,
      },
      {
        dimensi: 'Idealitas Rasio DTPS',
        'Prodi Aktif': current.rasioIdealScore,
        'Rerata UNPATTI': univAvg.rasioIdealScore,
      },
      {
        dimensi: 'Proporsi DTPS (%)',
        'Prodi Aktif': Math.round(current.persenDosenTetap),
        'Rerata UNPATTI': Math.round(univAvg.persenDosenTetap),
      },
      {
        dimensi: 'Tendik S1–S3 (%)',
        'Prodi Aktif': Math.round(current.persenTendikSarjana),
        'Rerata UNPATTI': Math.round(univAvg.persenTendikSarjana),
      },
    ];

    const criteriaAuditRows = [
      {
        parameter: 'Visi, Misi & PLO (Butir 18–20)',
        nilaiProdi: `${current.misiCount} Misi · ${current.ploCount} PLO`,
        bakuMutu: 'Visi terukur, >= 3 Misi & >= 3 PLO OBE',
        sesuai: current.kelengkapanVmtsPloPct >= 90,
      },
      {
        parameter: '21a. Jumlah SKS Minimal',
        nilaiProdi: `${program.kriteria_lulusan.sks_minimal} SKS`,
        bakuMutu: `>= ${current.minSksStd} SKS (SN-Dikti)`,
        sesuai: program.kriteria_lulusan.sks_minimal >= current.minSksStd,
      },
      {
        parameter: '21b. Nilai D Maksimal',
        nilaiProdi: `${program.kriteria_lulusan.nilai_d_maksimal} MK`,
        bakuMutu: '<= 2 Mata Kuliah',
        sesuai: program.kriteria_lulusan.nilai_d_maksimal <= 2,
      },
      {
        parameter: '21c. IPK Minimal Lulusan',
        nilaiProdi: program.kriteria_lulusan.ipk_minimal.toFixed(2),
        bakuMutu: `>= ${current.minIpkStd.toFixed(2)}`,
        sesuai: program.kriteria_lulusan.ipk_minimal >= current.minIpkStd,
      },
      {
        parameter: '21d. Skor TOEFL Minimal',
        nilaiProdi: String(program.kriteria_lulusan.toefl_minimal),
        bakuMutu: `>= ${current.minToeflStd}`,
        sesuai: program.kriteria_lulusan.toefl_minimal >= current.minToeflStd,
      },
      {
        parameter: '21e. Syarat Kompetensi Lainnya',
        nilaiProdi: program.kriteria_lulusan.syarat_lainnya || '-',
        bakuMutu: 'Tugas Akhir / Publikasi / Sertifikat Kompetensi',
        sesuai: program.kriteria_lulusan.syarat_lainnya.trim().length >= 10,
      },
    ];

    return {
      current,
      univAvg,
      sdmCompositionChart,
      ppeppInputRadarData,
      criteriaAuditRows,
    };
  }, [program, allPrograms]);

  const effectivenessLabel =
    ppeppMetrics.compositeIndex >= 85
      ? 'Sangat Efektif (Melampaui Standar)'
      : ppeppMetrics.compositeIndex >= 70
      ? 'Efektif (Sesuai Siklus PPEPP)'
      : ppeppMetrics.compositeIndex >= 55
      ? 'Cukup Efektif (Perlu Pengendalian)'
      : 'Perlu Intervensi Mayor';

  const stageCards = [
    {
      kode: 'P1',
      nama: 'Penetapan',
      skor: ppeppMetrics.penetapanScore,
      detail: 'Identitas Prodi, VMTS & target mutu standar',
      targetTab: 'identitas' as AmiTabId,
      cta: 'Cek Identitas',
    },
    {
      kode: 'P2',
      nama: 'Pelaksanaan',
      skor: ppeppMetrics.pelaksanaanScore,
      detail: `${ppeppMetrics.withEvidenceCount}/${indicators.length} butir berbukti dokumen`,
      targetTab: 'instrumen' as AmiTabId,
      cta: 'Buka Instrumen',
    },
    {
      kode: 'E',
      nama: 'Evaluasi',
      skor: ppeppMetrics.evaluasiScore,
      detail: `${ppeppMetrics.evaluatedRootCauseCount}/${ppeppMetrics.totalNonCompliant} temuan beranalisis PLOR+CA`,
      targetTab: 'temuan' as AmiTabId,
      cta: 'Lihat Temuan',
    },
    {
      kode: 'P3',
      nama: 'Pengendalian',
      skor: ppeppMetrics.pengendalianScore,
      detail: `${ppeppMetrics.controlledCount}/${ppeppMetrics.totalNonCompliant} temuan memiliki PTK & PIC`,
      targetTab: 'ptk' as AmiTabId,
      cta: 'Kelola PTK/RTL',
    },
    {
      kode: 'P4',
      nama: 'Peningkatan',
      skor: ppeppMetrics.peningkatanScore,
      detail: `${ppeppMetrics.closedCount}/${ppeppMetrics.totalNonCompliant} PTK berstatus Closed - Verified`,
      targetTab: 'monev' as AmiTabId,
      cta: 'Verifikasi Monev',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Ringkasan Eksekutif Mutu Institusi khusus Pimpinan / Admin / Superadmin */}
      {(userRbacRole === 'pimpinan' || userRbacRole === 'admin' || userRbacRole === 'super_admin' || userRbacRole === 'SUPER_ADMIN' || userRbacRole === 'PIMPINAN') && (
        <div className="rounded-xl border border-blue-200 bg-blue-900 text-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-amber-400">
                PIMPINAN & INSTITUSI UNIVERSITAS PATTIMURA
              </div>
              <h3 className="text-lg font-bold">
                Ringkasan Eksekutif Mutu Institusi ({allPrograms.length} Program Studi)
              </h3>
              <p className="text-xs text-slate-200 mt-1">
                Agregat institusional seluruh siklus PPEPP, rata-rata capaian 10 standar, serta pemantauan mutu prodi se-Universitas Pattimura.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-blue-950/80 border border-blue-800 px-4 py-2.5 text-center">
                <div className="text-[10px] text-slate-300">Total Prodi Universitas</div>
                <div className="text-xl font-bold font-mono text-amber-400">{allPrograms.length}</div>
              </div>
              <div className="rounded-lg bg-blue-950/80 border border-blue-800 px-4 py-2.5 text-center">
                <div className="text-[10px] text-slate-300">Rata-rata Capaian Institusi</div>
                <div className="text-xl font-bold font-mono text-white">{overall.rataRataCapaianTerbobot.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src="/unpatti-logo.png"
              alt="Logo Universitas Pattimura"
              className="h-14 w-14 shrink-0 object-contain hidden sm:block"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                <span>Siklus PPEPP {activeCycle.tahun_siklus}</span>
                <span aria-hidden="true">·</span>
                <span>{program.fakultas}</span>
                <span aria-hidden="true">·</span>
                <span>Akreditasi {program.peringkat_akreditasi}</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Dashboard Evaluasi & Analisis Efektifitas Implementasi Siklus PPEPP
              </h2>
              <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                Pemantauan terintegrasi efektifitas siklus Penetapan, Pelaksanaan, Evaluasi, Pengendalian, dan Peningkatan mutu pada{' '}
                <strong className="text-slate-900">{program.nama_prodi}</strong> ({allPrograms.length} Prodi UNPATTI).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-right">
              <div className="text-[11px] font-medium text-slate-500">
                Indeks Efektifitas PPEPP
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {ppeppMetrics.compositeIndex}%
              </div>
              <div className="text-xs font-semibold text-blue-900">
                {effectivenessLabel}
              </div>
            </div>
            {canExport && (
              <div className="no-print flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                  Unduh Excel AMI
                </button>
                <button
                  type="button"
                  onClick={onPrintPdf}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-amber-400" />
                  Cetak Ringkasan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5-Stage PPEPP Breakdown Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {stageCards.map((st) => (
            <div
              key={st.kode}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-900">
                    {st.kode} · {st.nama}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-slate-900">
                    {st.skor}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      st.skor >= 80
                        ? 'bg-emerald-600'
                        : st.skor >= 60
                        ? 'bg-blue-800'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${Math.min(100, st.skor)}%` }}
                  />
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-snug">
                  {st.detail}
                </p>
              </div>
              {canOpenTab(st.targetTab) ? (
                <button
                  type="button"
                  onClick={() => onNavigateTab(st.targetTab)}
                  className="no-print mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950"
                >
                  {st.cta}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <span className="no-print mt-3 inline-block text-[11px] font-medium text-slate-400">
                  Ringkasan Read-Only
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Cycle Trend Chart (2020/2021 - 2030/2031) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">
                Analisis Tren Capaian Mutu & Efektifitas PTK Antar Siklus PPEPP (2020/2021 – 2030/2031)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik tahun siklus pada tabel di samping atau ubah rentang untuk mengevaluasi konsistensi peningkatan mutu.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setTrendRange('active_to_past')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                trendRange === 'active_to_past'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2020/2021 – 2025/2026
            </button>
            <button
              type="button"
              onClick={() => setTrendRange('all_cycles')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                trendRange === 'all_cycles'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Siklus (2020–2031)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={cycleTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="siklus"
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="Capaian Mutu"
                  fill="#1e3a8a"
                  radius={[4, 4, 0, 0]}
                  barSize={26}
                />
                <Bar
                  dataKey="Target Mutu"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                  barSize={26}
                />
                <Line
                  type="monotone"
                  dataKey="Efektifitas PTK (%)"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Cycle Selector Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white">
              Pilih Siklus PPEPP untuk Inspeksi
            </div>
            <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-200 text-xs">
              {cycles.map((cyc) => {
                const isSelected = cyc.id === activeCycle.id;
                return (
                  <button
                    key={cyc.id}
                    type="button"
                    onClick={() => onSelectCycle(cyc.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-950 font-semibold'
                        : 'bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-mono tabular-nums">
                      {cyc.tahun_siklus}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {cyc.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Audit Bulanan LineChart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Ringkasan Audit Bulanan (Tren Perkembangan Skor Capaian &amp; Target Selama Siklus Berjalan)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan bulanan real-time dari Januari hingga Desember pada siklus {activeCycle.tahun_siklus}.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span>Siklus: {activeCycle.tahun_siklus}</span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyAuditData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  borderColor: '#cbd5e1',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="Capaian Mutu"
                stroke="#1e3a8a"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Target Mutu"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analisis Mutu Daya Dukung SDM (PDDIKTI) & Penetapan Standar Kelulusan (Seksi 03 & 04) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-900" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Analisis Mutu Daya Dukung SDM (PDDIKTI) &amp; Kesiapan Penetapan Standar Kelulusan (VMTS / PLO)
              </h3>
              <p className="text-xs text-slate-500">
                Konversi langsung data Seksi 03 (Visi, Misi, PLO &amp; Kriteria Lulusan) dan Seksi 04 (Mahasiswa, Lulusan, Dosen &amp; Tendik) terhadap indikator mutu P1–P2 PPEPP ·{' '}
                <strong className="text-slate-700">{program.nama_prodi}</strong>
              </p>
            </div>
          </div>
          {canOpenTab('identitas') && (
            <button
              type="button"
              onClick={() => onNavigateTab('identitas')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-slate-50 transition-colors"
            >
              Kelola di 01. Identitas Prodi
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 4 Key PDDIKTI & Academic Readiness KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-medium text-slate-500">
              Rasio Mahasiswa : Dosen Tetap (DTPS)
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                1 : {identityMutuAnalytics.current.rasioMhsDtps}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                  identityMutuAnalytics.current.rasioMhsDtps <= 25
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : identityMutuAnalytics.current.rasioMhsDtps <= 35
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {identityMutuAnalytics.current.rasioMhsDtps <= 25
                  ? 'Ideal (<= 1:25)'
                  : identityMutuAnalytics.current.rasioMhsDtps <= 35
                  ? 'Waspada'
                  : 'Overload (> 1:35)'}
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              {identityMutuAnalytics.current.mhs} Mhs / {identityMutuAnalytics.current.tetap} DTPS · Rerata UNPATTI 1:{identityMutuAnalytics.univAvg.rasioMhsDtps}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-medium text-slate-500">
              Produktivitas Lulusan TS &amp; Proporsi DTPS
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-blue-900">
                {identityMutuAnalytics.current.produktivitasLulusanPct}%
              </span>
              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-900">
                DTPS {identityMutuAnalytics.current.persenDosenTetap}%
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              {identityMutuAnalytics.current.lulusan} Lulusan TS · {identityMutuAnalytics.current.tetap} Tetap / {identityMutuAnalytics.current.tidakTetap} Tdk Tetap
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-medium text-slate-500">
              Kualifikasi Tendik (S1 / S2 / S3)
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {identityMutuAnalytics.current.persenTendikSarjana}%
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                Total {identityMutuAnalytics.current.totalTendik} Org
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              S2/S3: {identityMutuAnalytics.current.tendikPasca} · S1: {identityMutuAnalytics.current.tendikS1} · D1–D4: {identityMutuAnalytics.current.tendikDiploma} · SMA: {identityMutuAnalytics.current.tendikSma}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-medium text-slate-500">
              Kepatuhan Penetapan Kriteria Lulusan (P1)
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-emerald-700">
                {identityMutuAnalytics.current.keketatanLulusanPct}%
              </span>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                VMTS/PLO {identityMutuAnalytics.current.kelengkapanVmtsPloPct}%
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              Min {program.kriteria_lulusan.sks_minimal} SKS · IPK {program.kriteria_lulusan.ipk_minimal.toFixed(2)} · TOEFL {program.kriteria_lulusan.toefl_minimal}
            </div>
          </div>
        </div>

        {/* Two Visual Cards: Grafik 1 (SDM & Tendik) + Grafik 2 & Tabel (Kesiapan Penetapan Mutu) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Card 1: Grafik Komposisi SDM Akademik & Tenaga Kependidikan */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Grafik Komposisi SDM Dosen (PDDIKTI) &amp; Kualifikasi Tendik
                </h4>
                <p className="text-xs text-slate-500">
                  Perbandingan kapasitas SDM {program.nama_prodi} vs rata-rata {allPrograms.length} Prodi UNPATTI (Butir 24–27)
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">
                Homebase: {identityMutuAnalytics.current.homebase}
              </span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={identityMutuAnalytics.sdmCompositionChart}
                  margin={{ top: 8, right: 12, left: -12, bottom: 26 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="kategori"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={48}
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
                  <Bar
                    dataKey="Prodi Aktif"
                    fill="#1E3A8A"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="Rerata UNPATTI"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Radar Profil Penetapan & Daya Dukung + Tabel Evaluasi Kriteria Lulusan */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Profil Kesiapan Penetapan Standar (P1) &amp; Evaluasi Kriteria Lulusan
                  </h4>
                  <p className="text-xs text-slate-500">
                    Keselarasan VMTS, PLO, Kriteria Lulusan &amp; Rasio SDM terhadap baku mutu SN-Dikti (Butir 18–21)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    data={identityMutuAnalytics.ppeppInputRadarData}
                  >
                    <PolarGrid stroke="#CBD5E1" />
                    <PolarAngleAxis
                      dataKey="dimensi"
                      tick={{ fontSize: 9.5, fill: '#334155' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#64748B' }}
                    />
                    <Radar
                      name="Prodi Aktif"
                      dataKey="Prodi Aktif"
                      stroke="#1E3A8A"
                      fill="#1E3A8A"
                      fillOpacity={0.35}
                    />
                    <Radar
                      name="Rerata UNPATTI"
                      dataKey="Rerata UNPATTI"
                      stroke="#D97706"
                      fill="#D97706"
                      fillOpacity={0.15}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        borderColor: '#CBD5E1',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-7 overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2 font-semibold">Indikator Penetapan</th>
                      <th className="px-2.5 py-2 font-semibold">Capaian Prodi</th>
                      <th className="px-2.5 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {identityMutuAnalytics.criteriaAuditRows.map((row) => (
                      <tr key={row.parameter} className="hover:bg-slate-50">
                        <td className="px-2.5 py-2">
                          <div className="font-semibold text-slate-900">
                            {row.parameter}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Baku Mutu: {row.bakuMutu}
                          </div>
                        </td>
                        <td className="px-2.5 py-2 font-mono text-slate-800 max-w-[140px] truncate" title={row.nilaiProdi}>
                          {row.nilaiProdi}
                        </td>
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              row.sesuai
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {row.sesuai ? 'Sesuai Baku' : 'Perlu Tinjau'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Two-Column Analysis: Prioritas Pengendalian Standar & Perbandingan Prodi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Prioritas Pengendalian per Standar */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Prioritas Pengendalian Mutu per Standar (Berdasarkan Gap Target)
              </h3>
            </div>
            {canOpenTab('rekap') && (
              <button
                type="button"
                onClick={() => onNavigateTab('rekap')}
                className="text-xs font-semibold text-blue-900 hover:underline"
              >
                Lihat Rekap Lengkap
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Standar</th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Capaian
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">Gap</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {standardGapList.slice(0, 6).map((row) => (
                  <tr key={row.standardId} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {row.standardId}. {row.nama}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {row.nilaiCapaian.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-red-700">
                      -{row.gap.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${getKategoriBadgeClasses(
                          row.kategoriTemuan
                        )}`}
                      >
                        {row.kategoriTemuan ?? '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {canOpenTab('instrumen') ? (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('instrumen', row.standardId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950"
                        >
                          Audit
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Perbandingan Program Studi UNPATTI (118 Prodi) */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">
                Ringkasan Kinerja Program Studi ({activeCycle.tahun_siklus})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {filteredProgramsForTable.length} / {allPrograms.length} Prodi UNPATTI
            </span>
          </div>
          <div className="border-b border-slate-200 bg-white px-4 py-2.5 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={prodiSearch}
                onChange={(e) => setProdiSearch(e.target.value)}
                placeholder="Cari prodi / kode PS..."
                className="w-full rounded-md border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none max-w-[220px]"
            >
              <option value="all">Semua Fakultas / Unit ({allPrograms.length})</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[340px] overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Program Studi</th>
                  <th className="px-3 py-2.5 font-semibold">Akreditasi</th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Skor AMI
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">
                    Temuan KTS/OB
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {prodiComparisons.map(({ prodi, overall: pOv, kts }) => {
                  const isCurrent = prodi.id === program.id;
                  return (
                    <tr
                      key={prodi.id}
                      className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {prodi.nama_prodi}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prodi.fakultas} · Kode {prodi.kode_ps}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {prodi.peringkat_akreditasi}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {pOv.rataRataCapaianTerbobot.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-800 font-semibold">
                        {kts}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectProgram(prodi.id)}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Pilih Prodi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Perengkingan Top 10 & Sebaran Klaster Mutu PPEPP per Fakultas */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Perengkingan Top 10 &amp; Sebaran Klaster Mutu PPEPP per Fakultas / Pascasarjana / PSDKU
              </h3>
              <p className="text-xs text-slate-500">
                Pemeringkatan berbasis Skor Indeks Kualitas (Skor Awal − Penalti M/m/OB + Bonus Best Practice) · Siklus {activeCycle.tahun_siklus}
              </p>
            </div>
          </div>
          {canOpenTab('perengkingan') && (
            <button
              type="button"
              onClick={() => onNavigateTab('perengkingan')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-slate-50 transition-colors"
            >
              Lihat Modul 09. Perengkingan Lengkap
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik Sebaran Klaster Mutu PPEPP per Fakultas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Sebaran Klaster Mutu PPEPP per Fakultas
              </h4>
              <p className="text-xs text-slate-500">
                Komposisi jumlah Program Studi pada masing-masing klaster mutu (Siklus {activeCycle.tahun_siklus})
              </p>
            </div>
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={facultyClusterChartData}
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

          {/* Grafik Top 10 Program Studi Terbaik */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Top 10 Program Studi Terbaik · Siklus {activeCycle.tahun_siklus}
              </h4>
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
        </div>

        {/* Ringkasan Tabel Top 10 Terbaik */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Peringkat Top 10 Program Studi Terbaik (Siklus {activeCycle.tahun_siklus})
            </h4>
            <span className="font-mono text-[11px] text-slate-500">
              Skor Awal − 2.0(Mayor) − 0.5(Minor) − 0.1(OB) + 0.5(BP)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5 w-16 text-center">Rank</th>
                  <th className="px-4 py-2.5">Program Studi &amp; Fakultas / Pascasarjana / PSDKU</th>
                  <th className="px-3 py-2.5 text-right">Skor Awal</th>
                  <th className="px-3 py-2.5 text-right">Indeks Kualitas</th>
                  <th className="px-3 py-2.5">Klaster Mutu</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {top10Entries.map((entry) => {
                  const isCurrent = entry.program.id === program.id;
                  return (
                    <tr
                      key={entry.program.id}
                      className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                    >
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex h-6 min-w-[28px] items-center justify-center rounded px-1.5 font-mono text-[11px] font-bold tabular-nums ${
                            entry.rank <= 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">
                          {entry.program.nama_prodi}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {entry.program.fakultas} · Kode {entry.program.kode_ps}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-teal-800 font-semibold">
                        {entry.skorAwal.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
                        {entry.skorIndeksKualitas.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${getClusterBadgeClasses(
                            entry.cluster
                          )}`}
                        >
                          {entry.cluster}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectProgram(entry.program.id)}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Pilih Prodi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AuditCalendarSection
        isAdmin={userRbacRole === 'admin'}
        showToast={showToast ?? (() => {})}
      />
    </div>
  );
};
