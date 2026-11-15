import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  JenisProdi,
  KategoriTemuan,
  OverallAmiRecap,
  PpeppCluster,
  SpmiReportScopeLevel,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';
import {
  AMI_INDICATORS_KEPENDIDIKAN,
  UNPATTI_FACULTIES,
} from '../data/amiInstrumentData';
import {
  computeOverallRecap,
  computeStandardRecaps,
  createDefaultEvaluation,
  getKategoriTemuan,
  getSebutanSkala100,
} from './amiCalculations';
import {
  computeSingleProdiCycleMetrics,
  rankProgramsForCycle,
} from './ppeppRanking';
import { PpeppStatsData } from './spmiReportDefaults';
import {
  CycleTrendPoint,
  SpmiStatisticalSummary,
  StandardGapItem,
  StandardMonevBreakdown,
} from './spmiStatistics';

export interface ProdiScopeSummaryRow {
  program: StudyProgramIdentity;
  skorAmiTerbobot: number;
  skorTargetTerbobot: number;
  indeksPpepp: number;
  penetapan: number;
  pelaksanaan: number;
  evaluasi: number;
  pengendalian: number;
  peningkatan: number;
  skorIndeksKualitas: number;
  ktsMayor: number;
  ktsMinor: number;
  observasi: number;
  sesuai: number;
  bestPractice: number;
  totalIndikator: number;
  ptkClosedPct: number;
  complianceRatePct: number;
  cluster: PpeppCluster;
}

export interface FacultyScopeSummaryRow {
  fakultas: string;
  shortFakultas: string;
  prodiCount: number;
  meanSkorAmi: number;
  meanTargetAmi: number;
  sdSkorAmi: number;
  minProdiName: string;
  minSkorAmi: number;
  maxProdiName: string;
  maxSkorAmi: number;
  meanIndeksPpepp: number;
  penetapan: number;
  pelaksanaan: number;
  evaluasi: number;
  pengendalian: number;
  peningkatan: number;
  meanIndeksKualitas: number;
  totalMayor: number;
  totalMinor: number;
  totalObservasi: number;
  totalSesuai: number;
  totalBestPractice: number;
  totalIndikator: number;
  ptkClosedPct: number;
  complianceRatePct: number;
  clusterCounts: Record<PpeppCluster, number>;
}

export interface CrossUnitFindingRow {
  prodiId: string;
  kodePs: string;
  namaProdi: string;
  fakultas: string;
  standardName: string;
  indicatorCode: string;
  indicatorUraian: string;
  kategori: KategoriTemuan;
  skor: number;
  rubricDesc: string;
  akarMasalah: string;
  ptkRtl: string;
  pic: string;
  waktuPtk: string;
  buktiDukung: string;
  monevStatus: string;
}

export interface CrossUnitComparisonStats {
  unitLabel: 'Program Studi' | 'Fakultas / Pascasarjana / PSDKU';
  unitCount: number;
  meanSkor: number;
  sdSkor: number;
  cvPct: number;
  minUnitName: string;
  minUnitScore: number;
  maxUnitName: string;
  maxUnitScore: number;
  clusterCounts: Record<PpeppCluster, number>;
}

export interface AggregatedSpmiBundle {
  scopeLevel: SpmiReportScopeLevel;
  scopeBadgeLabel: string;
  scopeHeading: string;
  scopeSubheading: string;
  targetFakultas: string;
  programCount: number;
  facultyCount: number;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  ppeppStats: PpeppStatsData;
  stats: SpmiStatisticalSummary;
  crossUnitStats: CrossUnitComparisonStats;
  prodiRows: ProdiScopeSummaryRow[];
  facultyRows: FacultyScopeSummaryRow[];
  allUnitFindings: CrossUnitFindingRow[];
}

function calcMean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function calcSampleSD(vals: number[], meanVal?: number): number {
  if (vals.length <= 1) return 0;
  const m = meanVal ?? calcMean(vals);
  const variance =
    vals.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (vals.length - 1);
  return Math.sqrt(variance);
}

function calcQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function calcPearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n <= 1) return 0;
  const mx = calcMean(xs.slice(0, n));
  const my = calcMean(ys.slice(0, n));
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function shortStdName(nama: string, id: number): string {
  const cleaned = nama.replace(/^Standar\s+/i, '');
  if (cleaned.length <= 18) return `${id}. ${cleaned}`;
  return `${id}. ${cleaned.slice(0, 16)}…`;
}

export function shortenFacultyName(fakultas: string): string {
  return fakultas
    .replace('Fakultas Keguruan dan Ilmu Pendidikan', 'FKIP')
    .replace('Fakultas Ekonomi dan Bisnis', 'FEB')
    .replace('Fakultas Ilmu Sosial dan Ilmu Politik', 'FISIP')
    .replace('Fakultas Perikanan dan Ilmu Kelautan', 'FPIK')
    .replace('Fakultas Sains dan Teknologi', 'FST')
    .replace('Fakultas Pertanian', 'FAPERTA')
    .replace('Fakultas Teknik', 'FATEK')
    .replace('Fakultas Hukum', 'FH')
    .replace('Fakultas Kedokteran', 'FK')
    .replace('PSDKU Kab. Maluku Barat Daya', 'PSDKU MBD')
    .replace('PSDKU Kab. Kepulauan Aru', 'PSDKU Aru');
}

function resolveEvaluationsForProdi(
  program: StudyProgramIdentity,
  cycle: AmiCycle,
  indicators: AmiIndicator[],
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>
): Record<string, AmiEvaluation> {
  const key = `${cycle.id}::${program.id}`;
  const rawMap = evaluationsByContext[key] ?? {};
  const complete: Record<string, AmiEvaluation> = { ...rawMap };
  indicators.forEach((ind) => {
    if (!complete[ind.id]) {
      complete[ind.id] = createDefaultEvaluation(ind.id);
    }
  });
  return complete;
}

export function computeAggregatedSpmiBundle(params: {
  scopeLevel: SpmiReportScopeLevel;
  activeProgram: StudyProgramIdentity;
  targetFakultas: string;
  scopedPrograms: StudyProgramIdentity[];
  cycle: AmiCycle;
  cycles: AmiCycle[];
  standards: AmiStandard[];
  defaultIndicators: AmiIndicator[];
  indicatorsByJenis?: Record<JenisProdi, AmiIndicator[]>;
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>;
}): AggregatedSpmiBundle {
  const {
    scopeLevel,
    activeProgram,
    targetFakultas,
    scopedPrograms,
    cycle,
    cycles,
    standards,
    defaultIndicators,
    indicatorsByJenis,
    evaluationsByContext,
  } = params;

  const targetPrograms =
    scopeLevel === 'prodi'
      ? [activeProgram]
      : scopeLevel === 'fakultas'
      ? scopedPrograms.filter((p) => p.fakultas === targetFakultas)
      : scopedPrograms;

  const safePrograms =
    targetPrograms.length > 0 ? targetPrograms : [activeProgram];

  // Use rankProgramsForCycle on safePrograms to get exact cluster classification with cycle-over-cycle delta
  const rankingEntries = rankProgramsForCycle({
    programs: safePrograms,
    targetCycle: cycle,
    allCycles: cycles,
    standards,
    indicators: defaultIndicators,
    indicatorsByJenis,
    evaluationsByContext,
  });
  const rankMap = new Map(rankingEntries.map((e) => [e.program.id, e]));

  // Accumulators per standard
  const stdAcc = standards.map((s) => ({
    standard: s,
    sumCapaian: 0,
    sumTarget: 0,
    indicatorCount: 0,
    counts: {
      Mayor: 0,
      Minor: 0,
      Observasi: 0,
      'Sesuai (Baik)': 0,
      'Best Practice': 0,
    } as Record<KategoriTemuan, number>,
    openCount: 0,
    inProgressCount: 0,
    closedCount: 0,
    totalKts: 0,
    evaluatedProdis: 0,
    targetProdis: 0,
  }));

  let totalIndicatorsEvaluated = 0;
  let totalEvaluatedEntries = 0;
  let totalWithPlan = 0;
  let totalKtsAll = 0;
  let totalOpenAll = 0;
  let totalInProgressAll = 0;
  let totalClosedAll = 0;

  const prodiRows: ProdiScopeSummaryRow[] = [];
  const allFindingsRaw: CrossUnitFindingRow[] = [];

  safePrograms.forEach((prog) => {
    const progInds =
      indicatorsByJenis?.[prog.jenis_prodi] ??
      (prog.jenis_prodi === 'Kependidikan'
        ? AMI_INDICATORS_KEPENDIDIKAN
        : defaultIndicators);
    const evalMap = resolveEvaluationsForProdi(
      prog,
      cycle,
      progInds,
      evaluationsByContext
    );
    const progRecaps = computeStandardRecaps(standards, progInds, evalMap);
    const progOverall = computeOverallRecap(progRecaps);
    const metrics = computeSingleProdiCycleMetrics(
      prog,
      cycle,
      standards,
      defaultIndicators,
      evaluationsByContext,
      indicatorsByJenis
    );
    const ranked = rankMap.get(prog.id);

    const progCompliant =
      progOverall.totalCounts['Sesuai (Baik)'] +
      progOverall.totalCounts['Best Practice'];
    const progCompliancePct = Number(
      ((progCompliant / Math.max(1, progInds.length)) * 100).toFixed(1)
    );

    prodiRows.push({
      program: prog,
      skorAmiTerbobot: progOverall.rataRataCapaianTerbobot,
      skorTargetTerbobot: progOverall.rataRataTargetTerbobot,
      indeksPpepp: metrics.indeksPpepp,
      penetapan: metrics.penetapan,
      pelaksanaan: metrics.pelaksanaan,
      evaluasi: metrics.evaluasi,
      pengendalian: metrics.pengendalian,
      peningkatan: metrics.peningkatan,
      skorIndeksKualitas: metrics.skorIndeksKualitas,
      ktsMayor: progOverall.totalCounts.Mayor,
      ktsMinor: progOverall.totalCounts.Minor,
      observasi: progOverall.totalCounts.Observasi,
      sesuai: progOverall.totalCounts['Sesuai (Baik)'],
      bestPractice: progOverall.totalCounts['Best Practice'],
      totalIndikator: progInds.length,
      ptkClosedPct: metrics.ptkClosedPct,
      complianceRatePct: progCompliancePct,
      cluster: ranked?.cluster ?? 'Stabil',
    });

    totalIndicatorsEvaluated += progInds.length;

    // Accumulate standard recaps
    progRecaps.forEach((r, idx) => {
      const acc = stdAcc[idx];
      if (!acc) return;
      if (r.sebutanCapaian !== '-') {
        acc.sumCapaian += r.nilaiCapaian;
        acc.evaluatedProdis += 1;
      }
      if (r.sebutanTarget !== '-') {
        acc.sumTarget += r.nilaiTarget;
        acc.targetProdis += 1;
      }
      acc.indicatorCount += r.indicatorCount;
      acc.counts.Mayor += r.counts.Mayor;
      acc.counts.Minor += r.counts.Minor;
      acc.counts.Observasi += r.counts.Observasi;
      acc.counts['Sesuai (Baik)'] += r.counts['Sesuai (Baik)'];
      acc.counts['Best Practice'] += r.counts['Best Practice'];
    });

    // Accumulate findings & Monev stats
    progInds.forEach((ind) => {
      const ev = evalMap[ind.id] ?? createDefaultEvaluation(ind.id);
      if (ev.nilai_capaian !== null) {
        totalEvaluatedEntries += 1;
      }
      const std = standards.find((s) => s.id === ind.standard_id);
      const kat = getKategoriTemuan(
        ev.nilai_capaian,
        ev.target_1_yr,
        ev.kategori_override
      );
      if (kat && kat !== 'Sesuai (Baik)') {
        allFindingsRaw.push({
          prodiId: prog.id,
          kodePs: prog.kode_ps,
          namaProdi: prog.nama_prodi,
          fakultas: prog.fakultas,
          standardName: std?.nama ?? `Standar ${ind.standard_id}`,
          indicatorCode: ind.code,
          indicatorUraian: ind.uraian,
          kategori: kat,
          skor: ev.nilai_capaian ?? 0,
          rubricDesc: ev.nilai_capaian
            ? ind.rubric_levels[ev.nilai_capaian]
            : '-',
          akarMasalah: ev.akar_masalah || ev.plor_ca.problem || '-',
          ptkRtl: ev.ptk_rtl || '-',
          pic: ev.pic || '-',
          waktuPtk: ev.waktu_ptk || '-',
          buktiDukung: ev.bukti_realisasi || ev.bukti_link || 'Proses unggah',
          monevStatus: ev.monev_status,
        });
      }

      if (kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi') {
        totalKtsAll += 1;
        if (ev.ptk_rtl.trim() && ev.pic.trim()) {
          totalWithPlan += 1;
        }
        const stdIdx = standards.findIndex((s) => s.id === ind.standard_id);
        if (stdIdx >= 0) {
          stdAcc[stdIdx].totalKts += 1;
        }
        if (ev.monev_status === 'Closed - Verified') {
          totalClosedAll += 1;
          if (stdIdx >= 0) stdAcc[stdIdx].closedCount += 1;
        } else if (ev.monev_status === 'In Progress') {
          totalInProgressAll += 1;
          if (stdIdx >= 0) stdAcc[stdIdx].inProgressCount += 1;
        } else {
          totalOpenAll += 1;
          if (stdIdx >= 0) stdAcc[stdIdx].openCount += 1;
        }
      }
    });
  });

  // Sort findings by severity (Mayor -> Minor -> Observasi -> Best Practice)
  const sevOrder: Record<KategoriTemuan, number> = {
    Mayor: 0,
    Minor: 1,
    Observasi: 2,
    'Best Practice': 3,
    'Sesuai (Baik)': 4,
  };
  const allUnitFindings = [...allFindingsRaw].sort(
    (a, b) => sevOrder[a.kategori] - sevOrder[b.kategori]
  );

  // Build aggregated 10-standard recaps
  const recaps: StandardRecap[] = stdAcc.map((acc) => {
    const nilaiCapaian =
      acc.evaluatedProdis > 0
        ? Number((acc.sumCapaian / acc.evaluatedProdis).toFixed(2))
        : 0;
    const nilaiTarget =
      acc.targetProdis > 0
        ? Number((acc.sumTarget / acc.targetProdis).toFixed(2))
        : 0;
    const avgCapaianRaw = Number(((nilaiCapaian / 100) * 7).toFixed(2));
    const avgTargetRaw = Number(((nilaiTarget / 100) * 7).toFixed(2));
    const kategoriTemuan: KategoriTemuan | null =
      acc.evaluatedProdis === 0
        ? null
        : acc.counts.Mayor > 0
        ? 'Mayor'
        : acc.counts.Minor > 0
        ? 'Minor'
        : acc.counts.Observasi > 0
        ? 'Observasi'
        : acc.counts['Best Practice'] > 0 &&
          acc.counts['Best Practice'] >= acc.indicatorCount / 2
        ? 'Best Practice'
        : 'Sesuai (Baik)';

    return {
      standardId: acc.standard.id,
      kode: acc.standard.kode,
      nama: acc.standard.nama,
      bobot: acc.standard.bobot,
      indicatorCount: acc.indicatorCount,
      avgCapaianRaw,
      avgTargetRaw,
      nilaiCapaian,
      sebutanCapaian:
        acc.evaluatedProdis > 0 ? getSebutanSkala100(nilaiCapaian) : '-',
      nilaiTarget,
      sebutanTarget:
        acc.targetProdis > 0 ? getSebutanSkala100(nilaiTarget) : '-',
      kategoriTemuan,
      counts: acc.counts,
    };
  });

  const overall = computeOverallRecap(recaps);

  // Aggregate PPEPP stats
  const penetapan = Math.round(calcMean(prodiRows.map((p) => p.penetapan)));
  const pelaksanaan = Math.round(calcMean(prodiRows.map((p) => p.pelaksanaan)));
  const evaluasi = Math.round(calcMean(prodiRows.map((p) => p.evaluasi)));
  const pengendalian = Math.round(calcMean(prodiRows.map((p) => p.pengendalian)));
  const peningkatan = Math.round(calcMean(prodiRows.map((p) => p.peningkatan)));
  const indeks = Number(
    (
      (penetapan + pelaksanaan + evaluasi + pengendalian + peningkatan) /
      5
    ).toFixed(1)
  );
  const ppeppLabel =
    indeks >= 85
      ? 'Sangat Efektif (Melampaui Standar)'
      : indeks >= 70
      ? 'Efektif (Sesuai Siklus PPEPP)'
      : indeks >= 55
      ? 'Cukup Efektif (Perlu Pengendalian)'
      : 'Perlu Pengendalian Intensif';

  const ppeppStats: PpeppStatsData = {
    penetapan,
    pelaksanaan,
    evaluasi,
    pengendalian,
    peningkatan,
    indeks,
    label: ppeppLabel,
  };

  // Group into Faculty rows
  const orderedFaculties = Array.from(
    new Set([
      ...UNPATTI_FACULTIES.filter((f) =>
        prodiRows.some((r) => r.program.fakultas === f)
      ),
      ...prodiRows.map((r) => r.program.fakultas),
    ])
  );

  const facultyRows: FacultyScopeSummaryRow[] = orderedFaculties.map((fac) => {
    const members = prodiRows.filter((r) => r.program.fakultas === fac);
    const scores = members.map((m) => m.skorAmiTerbobot);
    const meanSkorAmi = Number(calcMean(scores).toFixed(2));
    const sdSkorAmi = Number(calcSampleSD(scores, meanSkorAmi).toFixed(2));
    const sortedMembers = [...members].sort(
      (a, b) => a.skorAmiTerbobot - b.skorAmiTerbobot
    );
    const minM = sortedMembers[0];
    const maxM = sortedMembers[sortedMembers.length - 1];

    const totalMayor = members.reduce((s, m) => s + m.ktsMayor, 0);
    const totalMinor = members.reduce((s, m) => s + m.ktsMinor, 0);
    const totalObservasi = members.reduce((s, m) => s + m.observasi, 0);
    const totalSesuai = members.reduce((s, m) => s + m.sesuai, 0);
    const totalBestPractice = members.reduce((s, m) => s + m.bestPractice, 0);
    const totalIndikator = members.reduce((s, m) => s + m.totalIndikator, 0);

    const clusterCounts: Record<PpeppCluster, number> = {
      Unggul: members.filter((m) => m.cluster === 'Unggul').length,
      Stabil: members.filter((m) => m.cluster === 'Stabil').length,
      Menurun: members.filter((m) => m.cluster === 'Menurun').length,
      Pembinaan: members.filter((m) => m.cluster === 'Pembinaan').length,
    };

    const compliantFac = totalSesuai + totalBestPractice;
    return {
      fakultas: fac,
      shortFakultas: shortenFacultyName(fac),
      prodiCount: members.length,
      meanSkorAmi,
      meanTargetAmi: Number(
        calcMean(members.map((m) => m.skorTargetTerbobot)).toFixed(2)
      ),
      sdSkorAmi,
      minProdiName: minM?.program.nama_prodi ?? '-',
      minSkorAmi: minM?.skorAmiTerbobot ?? 0,
      maxProdiName: maxM?.program.nama_prodi ?? '-',
      maxSkorAmi: maxM?.skorAmiTerbobot ?? 0,
      meanIndeksPpepp: Number(
        calcMean(members.map((m) => m.indeksPpepp)).toFixed(2)
      ),
      penetapan: Math.round(calcMean(members.map((m) => m.penetapan))),
      pelaksanaan: Math.round(calcMean(members.map((m) => m.pelaksanaan))),
      evaluasi: Math.round(calcMean(members.map((m) => m.evaluasi))),
      pengendalian: Math.round(calcMean(members.map((m) => m.pengendalian))),
      peningkatan: Math.round(calcMean(members.map((m) => m.peningkatan))),
      meanIndeksKualitas: Number(
        calcMean(members.map((m) => m.skorIndeksKualitas)).toFixed(2)
      ),
      totalMayor,
      totalMinor,
      totalObservasi,
      totalSesuai,
      totalBestPractice,
      totalIndikator,
      ptkClosedPct: Number(
        calcMean(members.map((m) => m.ptkClosedPct)).toFixed(1)
      ),
      complianceRatePct: Number(
        ((compliantFac / Math.max(1, totalIndikator)) * 100).toFixed(1)
      ),
      clusterCounts,
    };
  });

  // Compute SpmiStatisticalSummary across aggregated recaps & scope
  const capaianVals = recaps.map((r) => r.nilaiCapaian);
  const targetVals = recaps.map((r) => r.nilaiTarget);
  const gapVals = recaps.map((r) => r.nilaiTarget - r.nilaiCapaian);
  const sortedCapaian = [...capaianVals].sort((a, b) => a - b);

  const meanCapaian = calcMean(capaianVals);
  const medianCapaian = calcQuantile(sortedCapaian, 0.5);
  const sdCapaian = calcSampleSD(capaianVals, meanCapaian);
  const cvCapaianPct = meanCapaian > 0 ? (sdCapaian / meanCapaian) * 100 : 0;
  const q1Capaian = calcQuantile(sortedCapaian, 0.25);
  const q3Capaian = calcQuantile(sortedCapaian, 0.75);
  const iqrCapaian = q3Capaian - q1Capaian;

  const minRecap =
    [...recaps].sort((a, b) => a.nilaiCapaian - b.nilaiCapaian)[0] ?? recaps[0];
  const maxRecap =
    [...recaps].sort((a, b) => b.nilaiCapaian - a.nilaiCapaian)[0] ?? recaps[0];

  const meanTarget = calcMean(targetVals);
  const sdTarget = calcSampleSD(targetVals, meanTarget);
  const meanGap = calcMean(gapVals);
  const sdGap = calcSampleSD(gapVals, meanGap);

  const gapRanked: StandardGapItem[] = [...recaps]
    .map((r) => {
      const gap = Number((r.nilaiTarget - r.nilaiCapaian).toFixed(2));
      const ktsCount = r.counts.Mayor + r.counts.Minor + r.counts.Observasi;
      const urgency: StandardGapItem['urgency'] =
        gap >= 15
          ? 'Prioritas Tinggi'
          : gap >= 8
          ? 'Prioritas Sedang'
          : 'Terkendali';
      return {
        standardId: r.standardId,
        shortName: shortStdName(r.nama, r.standardId),
        nama: r.nama,
        capaian: r.nilaiCapaian,
        target: r.nilaiTarget,
        gap,
        ktsCount,
        urgency,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const maxGapItem = gapRanked[0];
  const achievementRatioPct =
    meanTarget > 0 ? (meanCapaian / meanTarget) * 100 : 0;

  const nStd = recaps.length || 1;
  const pairedDf = Math.max(1, nStd - 1);
  const seGap = sdGap / Math.sqrt(nStd);
  const pairedTStat = seGap > 0 ? meanGap / seGap : 0;
  const absT = Math.abs(pairedTStat);
  const pairedPLabel =
    absT >= 4.781
      ? 'p < 0.001 (Sangat Signifikan)'
      : absT >= 3.25
      ? 'p < 0.01 (Signifikan Tinggi)'
      : absT >= 2.262
      ? 'p < 0.05 (Signifikan)'
      : 'p >= 0.05 (Tidak Signifikan)';
  const pairedSignificant = absT >= 2.262;

  const ktsPerStd = recaps.map(
    (r) => r.counts.Mayor + r.counts.Minor + r.counts.Observasi
  );
  const pearsonR = calcPearson(ktsPerStd, capaianVals);
  const absR = Math.abs(pearsonR);
  const strength =
    absR >= 0.7
      ? 'Kuat'
      : absR >= 0.4
      ? 'Sedang'
      : absR >= 0.2
      ? 'Lemah'
      : 'Sangat Lemah';
  const dir = pearsonR < 0 ? 'Negatif' : 'Positif';
  const pearsonInterpretation = `Korelasi ${dir} ${strength} (r = ${pearsonR.toFixed(
    3
  )})`;

  const compliantCount =
    overall.totalCounts['Sesuai (Baik)'] + overall.totalCounts['Best Practice'];
  const nonCompliantCount =
    overall.totalCounts.Mayor +
    overall.totalCounts.Minor +
    overall.totalCounts.Observasi;

  const totalIndSafe = Math.max(1, totalIndicatorsEvaluated);
  const complianceRatePct = (compliantCount / totalIndSafe) * 100;
  const nonConformityRatePct = (nonCompliantCount / totalIndSafe) * 100;
  const bestPracticeRatioPct =
    (overall.totalCounts['Best Practice'] / totalIndSafe) * 100;

  const standardMonevBreakdown: StandardMonevBreakdown[] = stdAcc.map((acc) => ({
    standardId: acc.standard.id,
    shortName: shortStdName(acc.standard.nama, acc.standard.id),
    nama: acc.standard.nama,
    openCount: acc.openCount,
    inProgressCount: acc.inProgressCount,
    closedCount: acc.closedCount,
    totalKts: acc.totalKts,
    closurePct:
      acc.evaluatedProdis === 0
        ? 0
        : acc.totalKts === 0
        ? 100
        : Math.round((acc.closedCount / acc.totalKts) * 100),
  }));

  const ptkPlanCompletenessPct =
    totalEvaluatedEntries === 0
      ? 0
      : totalKtsAll === 0
      ? 100
      : (totalWithPlan / totalKtsAll) * 100;
  const ptkClosureRatePct =
    totalEvaluatedEntries === 0
      ? 0
      : totalKtsAll === 0
      ? 100
      : (totalClosedAll / totalKtsAll) * 100;
  const riskReductionIndexPct =
    totalEvaluatedEntries === 0
      ? 0
      : totalKtsAll === 0
      ? 100
      : ((totalClosedAll + totalInProgressAll * 0.5) / totalKtsAll) * 100;

  const stagePairs = [
    { label: 'P1 Penetapan', score: ppeppStats.penetapan },
    { label: 'P2 Pelaksanaan', score: ppeppStats.pelaksanaan },
    { label: 'E Evaluasi', score: ppeppStats.evaluasi },
    { label: 'P3 Pengendalian', score: ppeppStats.pengendalian },
    { label: 'P4 Peningkatan', score: ppeppStats.peningkatan },
  ];
  const stageScores = stagePairs.map((s) => s.score);
  const ppeppMean = calcMean(stageScores);
  const ppeppSd = calcSampleSD(stageScores, ppeppMean);
  const ppeppCvPct = ppeppMean > 0 ? (ppeppSd / ppeppMean) * 100 : 0;
  const sortedStages = [...stagePairs].sort((a, b) => a.score - b.score);
  const bottleneckStage = sortedStages[0];
  const strongestStage = sortedStages[sortedStages.length - 1];

  // Multi-cycle longitudinal trend averaged across all programs in scope
  const visibleCycles =
    cycles.length > 0
      ? cycles.filter((c) => Number(c.tahun_siklus.split('/')[0]) <= 2025)
      : [];
  const nProgSafe = Math.max(1, safePrograms.length);
  const cycleTrend: CycleTrendPoint[] = visibleCycles.map((cyc) => {
    let sumCap = 0;
    let sumTar = 0;
    let sumPtkEff = 0;
    let sumKts = 0;

    safePrograms.forEach((prog) => {
      const progInds =
        indicatorsByJenis?.[prog.jenis_prodi] ??
        (prog.jenis_prodi === 'Kependidikan'
          ? AMI_INDICATORS_KEPENDIDIKAN
          : defaultIndicators);
      const evalMap = resolveEvaluationsForProdi(
        prog,
        cyc,
        progInds,
        evaluationsByContext
      );
      const progEvaluatedCount = progInds.filter(
        (ind) => (evalMap[ind.id]?.nilai_capaian ?? null) !== null
      ).length;
      const cRecaps = computeStandardRecaps(standards, progInds, evalMap);
      const cOverall = computeOverallRecap(cRecaps);
      const ktsItems = progInds.filter((ind) => {
        const ev = evalMap[ind.id] ?? createDefaultEvaluation(ind.id);
        const kat = getKategoriTemuan(
          ev.nilai_capaian,
          ev.target_1_yr,
          ev.kategori_override
        );
        return kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi';
      });
      const closed = ktsItems.filter(
        (ind) => evalMap[ind.id]?.monev_status === 'Closed - Verified'
      ).length;
      sumCap += cOverall.rataRataCapaianTerbobot;
      sumTar += cOverall.rataRataTargetTerbobot;
      sumPtkEff +=
        progEvaluatedCount === 0
          ? 0
          : ktsItems.length === 0
          ? 100
          : (closed / ktsItems.length) * 100;
      sumKts += ktsItems.length;
    });

    return {
      siklus: cyc.tahun_siklus,
      capaian: Number((sumCap / nProgSafe).toFixed(2)),
      target: Number((sumTar / nProgSafe).toFixed(2)),
      efektivitasPtk: Math.round(sumPtkEff / nProgSafe),
      ktsCount: sumKts,
    };
  });

  const stats: SpmiStatisticalSummary = {
    nStandards: nStd,
    nIndicators: totalIndicatorsEvaluated,
    meanCapaian: Number(meanCapaian.toFixed(2)),
    medianCapaian: Number(medianCapaian.toFixed(2)),
    sdCapaian: Number(sdCapaian.toFixed(2)),
    cvCapaianPct: Number(cvCapaianPct.toFixed(2)),
    minCapaian: minRecap?.nilaiCapaian ?? 0,
    minStandardName: minRecap?.nama ?? '-',
    maxCapaian: maxRecap?.nilaiCapaian ?? 0,
    maxStandardName: maxRecap?.nama ?? '-',
    rangeCapaian: Number(
      ((maxRecap?.nilaiCapaian ?? 0) - (minRecap?.nilaiCapaian ?? 0)).toFixed(2)
    ),
    q1Capaian: Number(q1Capaian.toFixed(2)),
    q3Capaian: Number(q3Capaian.toFixed(2)),
    iqrCapaian: Number(iqrCapaian.toFixed(2)),
    meanTarget: Number(meanTarget.toFixed(2)),
    sdTarget: Number(sdTarget.toFixed(2)),
    meanGap: Number(meanGap.toFixed(2)),
    sdGap: Number(sdGap.toFixed(2)),
    maxGap: maxGapItem?.gap ?? 0,
    maxGapStandardName: maxGapItem?.nama ?? '-',
    achievementRatioPct: Number(achievementRatioPct.toFixed(2)),
    pairedTStat: Number(pairedTStat.toFixed(3)),
    pairedDf,
    pairedPLabel,
    pairedSignificant,
    pearsonR_KtsVsCapaian: Number(pearsonR.toFixed(3)),
    pearsonInterpretation,
    compliantCount,
    nonCompliantCount,
    complianceRatePct: Number(complianceRatePct.toFixed(1)),
    nonConformityRatePct: Number(nonConformityRatePct.toFixed(1)),
    bestPracticeRatioPct: Number(bestPracticeRatioPct.toFixed(1)),
    ptkOpenCount: totalOpenAll,
    ptkInProgressCount: totalInProgressAll,
    ptkClosedCount: totalClosedAll,
    ptkWithPlanCount: totalWithPlan,
    ptkPlanCompletenessPct: Number(ptkPlanCompletenessPct.toFixed(1)),
    ptkClosureRatePct: Number(ptkClosureRatePct.toFixed(1)),
    riskReductionIndexPct: Number(riskReductionIndexPct.toFixed(1)),
    ppeppMean: Number(ppeppMean.toFixed(1)),
    ppeppSd: Number(ppeppSd.toFixed(2)),
    ppeppCvPct: Number(ppeppCvPct.toFixed(1)),
    strongestStage,
    bottleneckStage,
    standardGapRanking: gapRanked,
    standardMonevBreakdown,
    cycleTrend,
  };

  // Cross-unit stats
  const clusterCounts: Record<PpeppCluster, number> = {
    Unggul: prodiRows.filter((p) => p.cluster === 'Unggul').length,
    Stabil: prodiRows.filter((p) => p.cluster === 'Stabil').length,
    Menurun: prodiRows.filter((p) => p.cluster === 'Menurun').length,
    Pembinaan: prodiRows.filter((p) => p.cluster === 'Pembinaan').length,
  };

  const unitScores =
    scopeLevel === 'universitas'
      ? facultyRows.map((f) => ({ name: f.fakultas, score: f.meanSkorAmi }))
      : prodiRows.map((p) => ({
          name: p.program.nama_prodi,
          score: p.skorAmiTerbobot,
        }));
  const unitScoreVals = unitScores.map((u) => u.score);
  const meanSkorUnit = calcMean(unitScoreVals);
  const sdSkorUnit = calcSampleSD(unitScoreVals, meanSkorUnit);
  const cvUnitPct = meanSkorUnit > 0 ? (sdSkorUnit / meanSkorUnit) * 100 : 0;
  const sortedUnits = [...unitScores].sort((a, b) => a.score - b.score);

  const crossUnitStats: CrossUnitComparisonStats = {
    unitLabel:
      scopeLevel === 'universitas'
        ? 'Fakultas / Pascasarjana / PSDKU'
        : 'Program Studi',
    unitCount: unitScores.length,
    meanSkor: Number(meanSkorUnit.toFixed(2)),
    sdSkor: Number(sdSkorUnit.toFixed(2)),
    cvPct: Number(cvUnitPct.toFixed(2)),
    minUnitName: sortedUnits[0]?.name ?? '-',
    minUnitScore: sortedUnits[0]?.score ?? 0,
    maxUnitName: sortedUnits[sortedUnits.length - 1]?.name ?? '-',
    maxUnitScore: sortedUnits[sortedUnits.length - 1]?.score ?? 0,
    clusterCounts,
  };

  const scopeBadgeLabel =
    scopeLevel === 'prodi'
      ? 'TINGKAT PROGRAM STUDI'
      : scopeLevel === 'fakultas'
      ? 'TINGKAT FAKULTAS / PASCASARJANA / PSDKU'
      : 'TINGKAT UNIVERSITAS (UNPATTI)';

  const scopeHeading =
    scopeLevel === 'prodi'
      ? `PROGRAM STUDI ${activeProgram.nama_prodi.toUpperCase()} (${activeProgram.kode_ps})`
      : scopeLevel === 'fakultas'
      ? `${targetFakultas.toUpperCase()} (${safePrograms.length} PROGRAM STUDI)`
      : `UNIVERSITAS PATTIMURA (${facultyRows.length} FAKULTAS / PASCASARJANA / PSDKU · ${safePrograms.length} PRODI)`;

  const scopeSubheading =
    scopeLevel === 'prodi'
      ? `${activeProgram.fakultas} · Siklus PPEPP ${cycle.tahun_siklus}`
      : scopeLevel === 'fakultas'
      ? `Konsolidasi ${safePrograms.length} Program Studi · Siklus PPEPP ${cycle.tahun_siklus}`
      : `Agregasi Gabungan Seluruh ${safePrograms.length} Program Studi pada ${facultyRows.length} Fakultas / Pascasarjana / PSDKU · Siklus PPEPP ${cycle.tahun_siklus}`;

  return {
    scopeLevel,
    scopeBadgeLabel,
    scopeHeading,
    scopeSubheading,
    targetFakultas,
    programCount: safePrograms.length,
    facultyCount: facultyRows.length,
    recaps,
    overall,
    ppeppStats,
    stats,
    crossUnitStats,
    prodiRows: [...prodiRows].sort(
      (a, b) => b.skorIndeksKualitas - a.skorIndeksKualitas
    ),
    facultyRows,
    allUnitFindings,
  };
}
