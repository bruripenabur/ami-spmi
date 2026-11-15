import {
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  KategoriTemuan,
  MonevStatus,
  OverallAmiRecap,
  PlorCaData,
  PtkWorkflowStatus,
  RubricLevelKey,
  StandardRecap,
} from '../types/ami';

export const SEBUTAN_MAP: Record<RubricLevelKey, string> = {
  1: 'Perbaikan menyeluruh dan mendesak',
  2: 'Perbaikan mayor',
  3: 'Perbaikan minor',
  4: 'Cukup',
  5: 'Lebih dari Cukup',
  6: 'Baik',
  7: 'Sangat Baik',
};

export function getSebutan(score: number | null | undefined): string {
  if (!score || score < 1 || score > 7) return '-';
  return SEBUTAN_MAP[score as RubricLevelKey] ?? '-';
}

export function getSebutanSkala100(score100: number): string {
  if (score100 >= 90) return 'Sangat Baik';
  if (score100 >= 75) return 'Baik';
  if (score100 >= 60) return 'Lebih dari Cukup';
  if (score100 >= 45) return 'Cukup';
  if (score100 >= 30) return 'Perbaikan minor';
  if (score100 >= 15) return 'Perbaikan mayor';
  return 'Perbaikan menyeluruh dan mendesak';
}

/**
 * Mirrors the UNPATTI AMI workbook classification rules:
 * - 1: Mayor (Perbaikan menyeluruh dan mendesak)
 * - 2: Minor (Perbaikan mayor)
 * - 3-5: Observasi (also flags gap if Nilai Capaian < Target)
 * - 6: Sesuai (Baik) (unless gap >= 2 vs target, which remains Observasi)
 * - 7: Best Practice (exceeding/attaining maximum institutional standard)
 * Supports optional Auditor manual override.
 */
export function getKategoriTemuan(
  nilaiCapaian: RubricLevelKey | null | undefined,
  target1Yr: RubricLevelKey | null | undefined,
  override?: KategoriTemuan | null
): KategoriTemuan | null {
  if (override) return override;
  if (nilaiCapaian == null) return null;
  const target = target1Yr ?? nilaiCapaian;
  if (nilaiCapaian === 1) return 'Mayor';
  if (nilaiCapaian === 2) return 'Minor';
  if (nilaiCapaian >= 3 && nilaiCapaian <= 5) return 'Observasi';
  if (nilaiCapaian === 6) {
    return target - nilaiCapaian >= 2 ? 'Observasi' : 'Sesuai (Baik)';
  }
  return 'Best Practice';
}

export function getKategoriStandarSkala100(
  nilaiCapaian100: number,
  nilaiTarget100: number
): KategoriTemuan {
  if (nilaiCapaian100 < 25) return 'Mayor';
  if (nilaiCapaian100 < 45) return 'Minor';
  if (nilaiCapaian100 < 75 || nilaiTarget100 - nilaiCapaian100 > 12) {
    return 'Observasi';
  }
  if (nilaiCapaian100 >= 93) return 'Best Practice';
  return 'Sesuai (Baik)';
}

export function computeStandardRecaps(
  standards: AmiStandard[],
  indicators: AmiIndicator[],
  evaluationsMap: Record<string, AmiEvaluation>
): StandardRecap[] {
  return standards.map((std) => {
    const stdIndicators = indicators.filter((ind) => ind.standard_id === std.id);

    let sumCapaian = 0;
    let capaianCount = 0;
    let sumTarget = 0;
    let targetCount = 0;
    const counts = {
      Mayor: 0,
      Minor: 0,
      Observasi: 0,
      'Sesuai (Baik)': 0,
      'Best Practice': 0,
    };

    stdIndicators.forEach((ind) => {
      const ev = evaluationsMap[ind.id];
      const capaian = ev?.nilai_capaian ?? null;
      const target = ev?.target_1_yr ?? null;
      if (capaian !== null) {
        sumCapaian += capaian;
        capaianCount += 1;
      }
      if (target !== null) {
        sumTarget += target;
        targetCount += 1;
      }

      const kategori = getKategoriTemuan(capaian, target, ev?.kategori_override);
      if (kategori) {
        counts[kategori] += 1;
      }
    });

    const avgCapaianRaw = capaianCount > 0 ? sumCapaian / capaianCount : 0;
    const avgTargetRaw = targetCount > 0 ? sumTarget / targetCount : 0;
    const nilaiCapaian =
      capaianCount > 0 ? Number(((avgCapaianRaw / 7) * 100).toFixed(2)) : 0;
    const nilaiTarget =
      targetCount > 0 ? Number(((avgTargetRaw / 7) * 100).toFixed(2)) : 0;

    return {
      standardId: std.id,
      kode: std.kode,
      nama: std.nama,
      bobot: std.bobot,
      indicatorCount: stdIndicators.length,
      avgCapaianRaw: Number(avgCapaianRaw.toFixed(2)),
      avgTargetRaw: Number(avgTargetRaw.toFixed(2)),
      nilaiCapaian,
      sebutanCapaian: capaianCount > 0 ? getSebutanSkala100(nilaiCapaian) : '-',
      nilaiTarget,
      sebutanTarget: targetCount > 0 ? getSebutanSkala100(nilaiTarget) : '-',
      kategoriTemuan:
        capaianCount > 0
          ? getKategoriStandarSkala100(nilaiCapaian, nilaiTarget)
          : null,
      counts,
    };
  });
}

export function computeOverallRecap(recaps: StandardRecap[]): OverallAmiRecap {
  const evaluatedRecaps = recaps.filter((r) => r.sebutanCapaian !== '-');
  const totalBobot =
    evaluatedRecaps.reduce((acc, r) => acc + r.bobot, 0) ||
    recaps.reduce((acc, r) => acc + r.bobot, 0) ||
    1;
  const weightedCapaian =
    evaluatedRecaps.length > 0
      ? evaluatedRecaps.reduce((acc, r) => acc + r.nilaiCapaian * r.bobot, 0) /
        totalBobot
      : 0;

  const targetRecaps = recaps.filter((r) => r.sebutanTarget !== '-');
  const totalTargetBobot =
    targetRecaps.reduce((acc, r) => acc + r.bobot, 0) || totalBobot;
  const weightedTarget =
    targetRecaps.length > 0
      ? targetRecaps.reduce((acc, r) => acc + r.nilaiTarget * r.bobot, 0) /
        totalTargetBobot
      : 0;

  const totalCounts = {
    Mayor: 0,
    Minor: 0,
    Observasi: 0,
    'Sesuai (Baik)': 0,
    'Best Practice': 0,
  };

  let totalIndikator = 0;
  recaps.forEach((r) => {
    totalIndikator += r.indicatorCount;
    totalCounts.Mayor += r.counts.Mayor;
    totalCounts.Minor += r.counts.Minor;
    totalCounts.Observasi += r.counts.Observasi;
    totalCounts['Sesuai (Baik)'] += r.counts['Sesuai (Baik)'];
    totalCounts['Best Practice'] += r.counts['Best Practice'];
  });

  const roundedCapaian = Number(weightedCapaian.toFixed(2));
  const roundedTarget = Number(weightedTarget.toFixed(2));

  return {
    rataRataCapaianTerbobot: roundedCapaian,
    rataRataTargetTerbobot: roundedTarget,
    sebutanOverall:
      evaluatedRecaps.length > 0
        ? getSebutanSkala100(roundedCapaian)
        : 'Belum Dinilai',
    totalIndikator,
    totalCounts,
  };
}

export function buildPlorCaNarrative(plor: PlorCaData): string {
  const parts: string[] = [];
  if (plor.problem.trim()) parts.push(`[P] Problem: ${plor.problem.trim()}`);
  if (plor.location.trim()) parts.push(`[L] Location: ${plor.location.trim()}`);
  if (plor.objectiveEvidence.trim())
    parts.push(`[O] Objective Evidence: ${plor.objectiveEvidence.trim()}`);
  if (plor.reference.trim()) parts.push(`[R] Reference: ${plor.reference.trim()}`);
  if (plor.correction.trim()) parts.push(`[C] Correction: ${plor.correction.trim()}`);
  if (plor.action.trim()) parts.push(`[A] Action: ${plor.action.trim()}`);
  return parts.join(' | ');
}

export function getKategoriBadgeClasses(kategori: KategoriTemuan | null): string {
  switch (kategori) {
    case 'Mayor':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'Minor':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'Observasi':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'Sesuai (Baik)':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Best Practice':
      return 'bg-sky-50 text-sky-800 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
}

export function getScoreCellClasses(score: RubricLevelKey | null | undefined): string {
  if (score == null) return 'bg-white text-slate-400 border-slate-300';
  if (score === 1) return 'bg-red-100 text-red-900 border-red-300';
  if (score === 2) return 'bg-orange-100 text-orange-900 border-orange-300';
  if (score <= 5) return 'bg-amber-50 text-amber-900 border-amber-300';
  if (score === 6) return 'bg-emerald-50 text-emerald-900 border-emerald-300';
  return 'bg-sky-50 text-sky-900 border-sky-300';
}

export function getMonevBadgeClasses(status: MonevStatus): string {
  switch (status) {
    case 'Open':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'In Progress':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'Closed - Verified':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
}

export function getEffectivePtkWorkflowStatus(
  ev: AmiEvaluation
): PtkWorkflowStatus {
  if (ev.monev_status === 'Closed - Verified') {
    return 'Terverifikasi Auditor (Closed-Verified)';
  }
  if (ev.ptk_workflow_status) {
    return ev.ptk_workflow_status;
  }
  return 'Draft Prodi';
}

export function getPtkWorkflowBadgeClasses(status: PtkWorkflowStatus): string {
  switch (status) {
    case 'Draft Prodi':
      return 'bg-slate-100 text-slate-700 border border-slate-300';
    case 'Menunggu Persetujuan Dekan':
      return 'bg-amber-50 text-amber-800 border border-amber-300';
    case 'Disetujui Dekan (Siap Monev)':
      return 'bg-blue-50 text-blue-800 border border-blue-300';
    case 'Terverifikasi Auditor (Closed-Verified)':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
  }
}

export function createDefaultEvaluation(indicatorId: string): AmiEvaluation {
  return {
    indicator_id: indicatorId,
    nilai_capaian: null,
    target_1_yr: null,
    kategori_override: null,
    akar_masalah: '',
    plor_ca: {
      problem: '',
      location: '',
      objectiveEvidence: '',
      reference: '',
      correction: '',
      action: '',
    },
    ptk_rtl: '',
    pic: '',
    waktu_ptk: '',
    waktu_monev: '',
    bukti_link: '',
    bukti_realisasi: '',
    tanggal_penyelesaian: '',
    monev_status: 'Open',
    ptk_workflow_status: 'Draft Prodi',
  };
}

