import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  JenisProdi,
  PpeppCluster,
  ProdiRankingEntry,
  StudyProgramIdentity,
} from '../types/ami';
import {
  computeOverallRecap,
  computeStandardRecaps,
  createDefaultEvaluation,
  getKategoriTemuan,
} from './amiCalculations';
import { AMI_INDICATORS_KEPENDIDIKAN } from '../data/amiInstrumentData';

export function computeSingleProdiCycleMetrics(
  program: StudyProgramIdentity,
  cycle: AmiCycle,
  standards: AmiStandard[],
  indicators: AmiIndicator[],
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>,
  indicatorsByJenis?: Record<JenisProdi, AmiIndicator[]>
) {
  const activeInds =
    indicatorsByJenis?.[program.jenis_prodi] ??
    (program.jenis_prodi === 'Kependidikan'
      ? AMI_INDICATORS_KEPENDIDIKAN
      : indicators);
  const key = `${cycle.id}::${program.id}`;
  const rawMap = evaluationsByContext[key] ?? {};
  const evalMap: Record<string, AmiEvaluation> = { ...rawMap };
  activeInds.forEach((ind) => {
    if (!evalMap[ind.id]) {
      evalMap[ind.id] = createDefaultEvaluation(ind.id);
    }
  });

  const recaps = computeStandardRecaps(standards, activeInds, evalMap);
  const overall = computeOverallRecap(recaps);
  const totalInd = activeInds.length || 1;
  const evaluatedCount = activeInds.filter(
    (ind) => evalMap[ind.id]?.nilai_capaian !== null
  ).length;
  const targetConfiguredCount = activeInds.filter(
    (ind) => evalMap[ind.id]?.target_1_yr !== null
  ).length;

  // 1. P - Penetapan
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
  const targetCount = activeInds.filter(
    (ind) => (evalMap[ind.id]?.target_1_yr ?? 0) >= 5
  ).length;
  const penetapan =
    evaluatedCount === 0 && targetConfiguredCount === 0
      ? 0
      : Math.round(
          (identityRatio * 0.4 + (targetCount / totalInd) * 0.6) * 100
        );

  // 2. P - Pelaksanaan
  const evidenceCount = activeInds.filter((ind) =>
    Boolean(evalMap[ind.id]?.bukti_link?.trim())
  ).length;
  const pelaksanaan =
    evaluatedCount === 0
      ? 0
      : Math.round(
          overall.rataRataCapaianTerbobot * 0.75 +
            (evidenceCount / totalInd) * 100 * 0.25
        );

  // 3. E - Evaluasi
  const nonComp = activeInds.filter((ind) => {
    const ev = evalMap[ind.id];
    const kat = getKategoriTemuan(
      ev.nilai_capaian,
      ev.target_1_yr,
      ev.kategori_override
    );
    return kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi';
  });
  const evalDone = nonComp.filter((ind) => {
    const ev = evalMap[ind.id];
    return Boolean(
      ev.akar_masalah.trim() ||
        ev.plor_ca.problem.trim() ||
        ev.plor_ca.objectiveEvidence.trim()
    );
  }).length;
  const evaluasi =
    evaluatedCount === 0
      ? 0
      : nonComp.length === 0
      ? 100
      : Math.round((evalDone / nonComp.length) * 100);

  // 4. P - Pengendalian
  const ctrlDone = nonComp.filter((ind) => {
    const ev = evalMap[ind.id];
    return Boolean(ev.ptk_rtl.trim() && ev.pic.trim());
  }).length;
  const pengendalian =
    evaluatedCount === 0
      ? 0
      : nonComp.length === 0
      ? 100
      : Math.round((ctrlDone / nonComp.length) * 100);

  // 5. P - Peningkatan
  const closed = nonComp.filter(
    (ind) => evalMap[ind.id]?.monev_status === 'Closed - Verified'
  ).length;
  const inProg = nonComp.filter(
    (ind) => evalMap[ind.id]?.monev_status === 'In Progress'
  ).length;
  const peningkatan =
    evaluatedCount === 0
      ? 0
      : nonComp.length === 0
      ? 100
      : Math.round(((closed + inProg * 0.5) / nonComp.length) * 100);

  const ptkClosedPct =
    evaluatedCount === 0
      ? 0
      : nonComp.length === 0
      ? 100
      : Math.round((closed / nonComp.length) * 100);

  const indeksPpepp = Number(
    (
      (penetapan + pelaksanaan + evaluasi + pengendalian + peningkatan) /
      5
    ).toFixed(2)
  );

  const ktsMayor = overall.totalCounts.Mayor;
  const ktsMinor = overall.totalCounts.Minor;
  const observasi = overall.totalCounts.Observasi;
  const bestPractice = overall.totalCounts['Best Practice'];

  // Metodologi Skor Indeks Kualitas:
  // Skor Awal (Rata-rata Capaian %) - 2.0*Mayor - 0.5*Minor - 0.1*Observasi + 0.5*Best Practice
  const skorAwal = overall.rataRataCapaianTerbobot;
  const penaltiMayor = Number((ktsMayor * 2.0).toFixed(2));
  const penaltiMinor = Number((ktsMinor * 0.5).toFixed(2));
  const penaltiObservasi = Number((observasi * 0.1).toFixed(2));
  const bonusBestPractice = Number((bestPractice * 0.5).toFixed(2));
  const skorIndeksKualitas = Math.max(
    0,
    Number(
      (
        skorAwal -
        penaltiMayor -
        penaltiMinor -
        penaltiObservasi +
        bonusBestPractice
      ).toFixed(2)
    )
  );

  return {
    penetapan,
    pelaksanaan,
    evaluasi,
    pengendalian,
    peningkatan,
    indeksPpepp,
    skorAmiTerbobot: overall.rataRataCapaianTerbobot,
    skorAwal,
    penaltiMayor,
    penaltiMinor,
    penaltiObservasi,
    bonusBestPractice,
    skorIndeksKualitas,
    ktsMayor,
    ktsMinor,
    observasi,
    bestPractice,
    ptkClosedPct,
    evaluatedCount,
  };
}

export function classifyPpeppCluster(params: {
  skorIndeksKualitas: number;
  indeksPpepp: number;
  deltaKualitas: number;
  prevSkorIndeksKualitas: number | null;
  ktsMayor: number;
  bestPractice: number;
  evaluatedCount?: number;
}): { cluster: PpeppCluster; reason: string } {
  const {
    skorIndeksKualitas,
    deltaKualitas,
    prevSkorIndeksKualitas,
    ktsMayor,
    bestPractice,
    evaluatedCount,
  } = params;

  if (evaluatedCount === 0) {
    return {
      cluster: 'Pembinaan',
      reason: 'Belum ada isian nilai capaian evaluasi pada siklus ini.',
    };
  }

  // 1. Menurun: Penurunan Skor Indeks Kualitas <= -2.0 poin dibanding siklus lalu
  if (prevSkorIndeksKualitas !== null && deltaKualitas <= -2.0) {
    return {
      cluster: 'Menurun',
      reason: `Penurunan Skor Indeks Kualitas ${deltaKualitas.toFixed(1)} poin dibanding siklus sebelumnya.`,
    };
  }

  // 2. Pembinaan: Skor Indeks Kualitas < 68 atau terdapat >= 2 KTS Mayor
  if (skorIndeksKualitas < 68 || ktsMayor >= 2) {
    const cause =
      ktsMayor >= 2
        ? `${ktsMayor} KTS Mayor (penalti -${(ktsMayor * 2).toFixed(1)} poin) memerlukan pembinaan intensif.`
        : `Skor Indeks Kualitas (${skorIndeksKualitas.toFixed(1)}) di bawah ambang minimal 68.0.`;
    return {
      cluster: 'Pembinaan',
      reason: cause,
    };
  }

  // 3. Unggul: Skor Indeks Kualitas >= 83 dan 0 KTS Mayor
  if (skorIndeksKualitas >= 83 && ktsMayor === 0) {
    return {
      cluster: 'Unggul',
      reason:
        bestPractice > 0
          ? `0 KTS Mayor dengan ${bestPractice} Best Practice (+${(bestPractice * 0.5).toFixed(1)} bonus keunggulan).`
          : 'Kinerja mutu unggul (>= 83.0), 0 KTS Mayor, dan konsisten.',
    };
  }

  // 4. Stabil: Memenuhi standar mutu (>= 68.0) dengan tren stabil atau meningkat
  return {
    cluster: 'Stabil',
    reason:
      deltaKualitas > 0
        ? `Mutu terjaga dan meningkat (+${deltaKualitas.toFixed(1)} poin Indeks Kualitas).`
        : 'Keseimbangan capaian & pengendalian temuan dalam rentang stabil.',
  };
}

export function rankProgramsForCycle(params: {
  programs: StudyProgramIdentity[];
  targetCycle: AmiCycle;
  allCycles: AmiCycle[];
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  indicatorsByJenis?: Record<JenisProdi, AmiIndicator[]>;
  evaluationsByContext: Record<string, Record<string, AmiEvaluation>>;
}): ProdiRankingEntry[] {
  const {
    programs,
    targetCycle,
    allCycles,
    standards,
    indicators,
    indicatorsByJenis,
    evaluationsByContext,
  } = params;

  const sortedCycles = [...allCycles].sort(
    (a, b) =>
      Number(a.tahun_siklus.split('/')[0]) - Number(b.tahun_siklus.split('/')[0])
  );
  const currentIdx = sortedCycles.findIndex((c) => c.id === targetCycle.id);
  const prevCycle = currentIdx > 0 ? sortedCycles[currentIdx - 1] : null;

  const rawEntries: Omit<ProdiRankingEntry, 'rank'>[] = programs.map(
    (program) => {
      const curr = computeSingleProdiCycleMetrics(
        program,
        targetCycle,
        standards,
        indicators,
        evaluationsByContext,
        indicatorsByJenis
      );

      let prevIndeksPpepp: number | null = null;
      let prevSkorIndeksKualitas: number | null = null;
      if (prevCycle && curr.evaluatedCount > 0) {
        const prev = computeSingleProdiCycleMetrics(
          program,
          prevCycle,
          standards,
          indicators,
          evaluationsByContext,
          indicatorsByJenis
        );
        if (prev.evaluatedCount > 0) {
          prevIndeksPpepp = prev.indeksPpepp;
          prevSkorIndeksKualitas = prev.skorIndeksKualitas;
        }
      }

      const deltaPpepp =
        prevIndeksPpepp !== null
          ? Number((curr.indeksPpepp - prevIndeksPpepp).toFixed(2))
          : 0;
      const deltaKualitas =
        prevSkorIndeksKualitas !== null
          ? Number((curr.skorIndeksKualitas - prevSkorIndeksKualitas).toFixed(2))
          : 0;

      const { cluster, reason } = classifyPpeppCluster({
        skorIndeksKualitas: curr.skorIndeksKualitas,
        indeksPpepp: curr.indeksPpepp,
        deltaKualitas,
        prevSkorIndeksKualitas,
        ktsMayor: curr.ktsMayor,
        bestPractice: curr.bestPractice,
        evaluatedCount: curr.evaluatedCount,
      });

      return {
        program,
        cycleYear: targetCycle.tahun_siklus,
        prevCycleYear: prevCycle ? prevCycle.tahun_siklus : null,
        penetapan: curr.penetapan,
        pelaksanaan: curr.pelaksanaan,
        evaluasi: curr.evaluasi,
        pengendalian: curr.pengendalian,
        peningkatan: curr.peningkatan,
        indeksPpepp: curr.indeksPpepp,
        skorAmiTerbobot: curr.skorAmiTerbobot,
        skorAwal: curr.skorAwal,
        penaltiMayor: curr.penaltiMayor,
        penaltiMinor: curr.penaltiMinor,
        penaltiObservasi: curr.penaltiObservasi,
        bonusBestPractice: curr.bonusBestPractice,
        skorIndeksKualitas: curr.skorIndeksKualitas,
        prevSkorIndeksKualitas,
        deltaKualitas,
        prevIndeksPpepp,
        deltaPpepp,
        ktsMayor: curr.ktsMayor,
        ktsMinor: curr.ktsMinor,
        observasi: curr.observasi,
        bestPractice: curr.bestPractice,
        ptkClosedPct: curr.ptkClosedPct,
        cluster,
        clusterReason: reason,
      };
    }
  );

  // Sort deterministically by Skor Indeks Kualitas desc -> Indeks PPEPP desc -> Delta desc -> Mayor asc
  rawEntries.sort((a, b) => {
    if (b.skorIndeksKualitas !== a.skorIndeksKualitas)
      return b.skorIndeksKualitas - a.skorIndeksKualitas;
    if (b.indeksPpepp !== a.indeksPpepp) return b.indeksPpepp - a.indeksPpepp;
    if (b.deltaKualitas !== a.deltaKualitas)
      return b.deltaKualitas - a.deltaKualitas;
    if (a.ktsMayor !== b.ktsMayor) return a.ktsMayor - b.ktsMayor;
    return a.program.nama_prodi.localeCompare(b.program.nama_prodi);
  });

  return rawEntries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export function getClusterBadgeClasses(cluster: PpeppCluster): string {
  switch (cluster) {
    case 'Unggul':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
    case 'Stabil':
      return 'bg-blue-50 text-blue-900 border border-blue-200';
    case 'Menurun':
      return 'bg-amber-50 text-amber-800 border border-amber-300';
    case 'Pembinaan':
      return 'bg-red-50 text-red-800 border border-red-300';
  }
}
