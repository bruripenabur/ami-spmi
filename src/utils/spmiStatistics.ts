import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';
import {
  computeOverallRecap,
  computeStandardRecaps,
  createDefaultEvaluation,
  getKategoriTemuan,
} from './amiCalculations';
import { PpeppStatsData } from './spmiReportDefaults';

export interface StandardGapItem {
  standardId: number;
  shortName: string;
  nama: string;
  capaian: number;
  target: number;
  gap: number;
  ktsCount: number;
  urgency: 'Prioritas Tinggi' | 'Prioritas Sedang' | 'Terkendali';
}

export interface StandardMonevBreakdown {
  standardId: number;
  shortName: string;
  nama: string;
  openCount: number;
  inProgressCount: number;
  closedCount: number;
  totalKts: number;
  closurePct: number;
}

export interface CycleTrendPoint {
  siklus: string;
  capaian: number;
  target: number;
  efektivitasPtk: number;
  ktsCount: number;
}

export interface SpmiStatisticalSummary {
  nStandards: number;
  nIndicators: number;
  meanCapaian: number;
  medianCapaian: number;
  sdCapaian: number;
  cvCapaianPct: number;
  minCapaian: number;
  minStandardName: string;
  maxCapaian: number;
  maxStandardName: string;
  rangeCapaian: number;
  q1Capaian: number;
  q3Capaian: number;
  iqrCapaian: number;
  meanTarget: number;
  sdTarget: number;
  meanGap: number;
  sdGap: number;
  maxGap: number;
  maxGapStandardName: string;
  achievementRatioPct: number;
  // Paired t-test (Capaian vs Target across 10 standards, df = n - 1)
  pairedTStat: number;
  pairedDf: number;
  pairedPLabel: string;
  pairedSignificant: boolean;
  // Pearson correlation: KTS Count vs Standard Capaian
  pearsonR_KtsVsCapaian: number;
  pearsonInterpretation: string;
  // Compliance & PTK statistics
  compliantCount: number;
  nonCompliantCount: number;
  complianceRatePct: number;
  nonConformityRatePct: number;
  bestPracticeRatioPct: number;
  ptkOpenCount: number;
  ptkInProgressCount: number;
  ptkClosedCount: number;
  ptkWithPlanCount: number;
  ptkPlanCompletenessPct: number;
  ptkClosureRatePct: number;
  riskReductionIndexPct: number;
  // PPEPP variability
  ppeppMean: number;
  ppeppSd: number;
  ppeppCvPct: number;
  strongestStage: { label: string; score: number };
  bottleneckStage: { label: string; score: number };
  // Breakdowns for charts
  standardGapRanking: StandardGapItem[];
  standardMonevBreakdown: StandardMonevBreakdown[];
  cycleTrend: CycleTrendPoint[];
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

export function computeSpmiStatistics(params: {
  program: StudyProgramIdentity;
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  ppeppStats: PpeppStatsData;
  cycles?: AmiCycle[];
  evaluationsByContext?: Record<string, Record<string, AmiEvaluation>>;
}): SpmiStatisticalSummary {
  const {
    program,
    standards,
    indicators,
    evaluations,
    recaps,
    overall,
    ppeppStats,
    cycles = [],
    evaluationsByContext = {},
  } = params;

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

  const gapRanked = [...recaps]
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

  // Paired sample t-test (df = n - 1 = 9) for Target vs Capaian gap
  const nStd = recaps.length || 1;
  const pairedDf = Math.max(1, nStd - 1);
  const seGap = sdGap / Math.sqrt(nStd);
  const pairedTStat = seGap > 0 ? meanGap / seGap : 0;
  const absT = Math.abs(pairedTStat);
  // Critical t-values for df=9: t(0.05)=2.262, t(0.01)=3.250, t(0.001)=4.781
  const pairedPLabel =
    absT >= 4.781
      ? 'p < 0.001 (Sangat Signifikan)'
      : absT >= 3.25
      ? 'p < 0.01 (Signifikan Tinggi)'
      : absT >= 2.262
      ? 'p < 0.05 (Signifikan)'
      : 'p >= 0.05 (Tidak Signifikan)';
  const pairedSignificant = absT >= 2.262;

  // Pearson correlation: KTS density per standard vs Standard Capaian
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

  // Indicator compliance & Monev breakdown
  const totalInd = indicators.length || 1;
  const compliantCount =
    overall.totalCounts['Sesuai (Baik)'] + overall.totalCounts['Best Practice'];
  const nonCompliantCount =
    overall.totalCounts.Mayor +
    overall.totalCounts.Minor +
    overall.totalCounts.Observasi;

  const complianceRatePct = (compliantCount / totalInd) * 100;
  const nonConformityRatePct = (nonCompliantCount / totalInd) * 100;
  const bestPracticeRatioPct =
    (overall.totalCounts['Best Practice'] / totalInd) * 100;

  const evaluatedTotalCount = indicators.filter(
    (ind) => (evaluations[ind.id]?.nilai_capaian ?? null) !== null
  ).length;

  let ptkOpenCount = 0;
  let ptkInProgressCount = 0;
  let ptkClosedCount = 0;
  let ptkWithPlanCount = 0;

  const standardMonevBreakdown: StandardMonevBreakdown[] = standards.map(
    (std) => {
      const stdInds = indicators.filter((i) => i.standard_id === std.id);
      let openCount = 0;
      let inProgressCount = 0;
      let closedCount = 0;
      let totalKts = 0;
      let stdEvaluated = 0;

      stdInds.forEach((ind) => {
        const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
        if (ev.nilai_capaian !== null) stdEvaluated += 1;
        const kat = getKategoriTemuan(
          ev.nilai_capaian,
          ev.target_1_yr,
          ev.kategori_override
        );
        if (kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi') {
          totalKts += 1;
          if (ev.ptk_rtl.trim() && ev.pic.trim()) {
            ptkWithPlanCount += 1;
          }
          if (ev.monev_status === 'Closed - Verified') {
            closedCount += 1;
            ptkClosedCount += 1;
          } else if (ev.monev_status === 'In Progress') {
            inProgressCount += 1;
            ptkInProgressCount += 1;
          } else {
            openCount += 1;
            ptkOpenCount += 1;
          }
        }
      });

      const closurePct =
        stdEvaluated === 0
          ? 0
          : totalKts === 0
          ? 100
          : Math.round((closedCount / totalKts) * 100);

      return {
        standardId: std.id,
        shortName: shortStdName(std.nama, std.id),
        nama: std.nama,
        openCount,
        inProgressCount,
        closedCount,
        totalKts,
        closurePct,
      };
    }
  );

  const ptkPlanCompletenessPct =
    evaluatedTotalCount === 0
      ? 0
      : nonCompliantCount === 0
      ? 100
      : (ptkWithPlanCount / nonCompliantCount) * 100;
  const ptkClosureRatePct =
    evaluatedTotalCount === 0
      ? 0
      : nonCompliantCount === 0
      ? 100
      : (ptkClosedCount / nonCompliantCount) * 100;
  const riskReductionIndexPct =
    evaluatedTotalCount === 0
      ? 0
      : nonCompliantCount === 0
      ? 100
      : ((ptkClosedCount + ptkInProgressCount * 0.5) / nonCompliantCount) * 100;

  // PPEPP variability
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

  // Multi-cycle trend (2020/2021 - 2025/2026)
  const visibleCycles =
    cycles.length > 0
      ? cycles.filter((c) => Number(c.tahun_siklus.split('/')[0]) <= 2025)
      : [];
  const cycleTrend: CycleTrendPoint[] = visibleCycles.map((cyc) => {
    const key = `${cyc.id}::${program.id}`;
    const evalMap = evaluationsByContext[key] ?? {};
    const cycRecaps = computeStandardRecaps(standards, indicators, evalMap);
    const cycOverall = computeOverallRecap(cycRecaps);
    const cycEvaluated = indicators.filter(
      (ind) => (evalMap[ind.id]?.nilai_capaian ?? null) !== null
    ).length;
    const ktsItems = indicators.filter((ind) => {
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
    const efektivitasPtk =
      cycEvaluated === 0
        ? 0
        : ktsItems.length === 0
        ? 100
        : Math.round((closed / ktsItems.length) * 100);

    return {
      siklus: cyc.tahun_siklus,
      capaian: cycOverall.rataRataCapaianTerbobot,
      target: cycOverall.rataRataTargetTerbobot,
      efektivitasPtk,
      ktsCount: ktsItems.length,
    };
  });

  return {
    nStandards: nStd,
    nIndicators: indicators.length,
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
    ptkOpenCount,
    ptkInProgressCount,
    ptkClosedCount,
    ptkWithPlanCount,
    ptkPlanCompletenessPct: Number(ptkPlanCompletenessPct.toFixed(1)),
    ptkClosureRatePct: Number(ptkClosureRatePct.toFixed(1)),
    riskReductionIndexPct: Number(riskReductionIndexPct.toFixed(1)),
    ppeppMean: Number(ppeppMean.toFixed(1)),
    ppeppSd: Number(ppeppSd.toFixed(2)),
    ppeppCvPct: Number(ppeppCvPct.toFixed(1)),
    strongestStage,
    bottleneckStage,
    standardGapRanking: gapRanked,
    standardMonevBreakdown: standardMonevBreakdown,
    cycleTrend,
  };
}
