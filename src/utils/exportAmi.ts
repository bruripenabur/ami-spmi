import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  OverallAmiRecap,
  PpeppCluster,
  ProdiRankingEntry,
  RankingTier,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';
import {
  buildPlorCaNarrative,
  createDefaultEvaluation,
  getKategoriTemuan,
  getSebutan,
} from './amiCalculations';

export function exportAmiToExcel(params: {
  program: StudyProgramIdentity;
  cycle: AmiCycle;
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
}): void {
  const { program, cycle, standards, indicators, evaluations, recaps, overall } = params;

  const wb = XLSX.utils.book_new();

  // Sheet 1: IDENTITAS PRODI
  const identitasRows = [
    ['IDENTITAS PROGRAM STUDI (' + program.jenis_prodi.toUpperCase() + ')'],
    ['Siklus PPEPP', cycle.tahun_siklus, 'Label Siklus', cycle.label],
    [],
    ['1. Kode PT', program.kode_pt],
    ['2. Nama Perguruan Tinggi', program.nama_pt],
    ['3. Fakultas / Pascasarjana / PSDKU', program.fakultas],
    ['4. Alamat Pusat', program.alamat_pusat],
    ['5. Kode Pos', program.kode_pos],
    ['6. Pengelola Proses Pembelajaran', program.pengelola_pembelajaran],
    ['7. Alamat Pengelola', program.alamat_pengelola],
    ['8. Kode Program Studi', program.kode_ps],
    ['9. Nama Jurusan', program.nama_jurusan],
    ['10. Nama Program Studi', program.nama_prodi],
    ['11. Tanggal Pendirian PS', program.tanggal_pendirian],
    ['12. No. SK Pendirian PS', program.no_sk_pendirian],
    ['13. No. SK Operasional PS (Terakhir)', program.no_sk_operasional],
    ['14. Peringkat Akreditasi Terakhir', program.peringkat_akreditasi],
    ['    - Riwayat Akreditasi I', program.riwayat_akreditasi.akreditasi_1],
    ['    - Riwayat Akreditasi II', program.riwayat_akreditasi.akreditasi_2],
    ['    - Riwayat Akreditasi III', program.riwayat_akreditasi.akreditasi_3],
    ['    - Riwayat Akreditasi IV', program.riwayat_akreditasi.akreditasi_4],
    ['    - Riwayat Akreditasi V', program.riwayat_akreditasi.akreditasi_5],
    ['15. Tanggal Kedaluwarsa Akreditasi', program.tanggal_kedaluwarsa_akreditasi],
    ['16. Alamat Program Studi', program.alamat_prodi],
    ['17. Email Program Studi', program.email_prodi],
    ['18. Telepon Program Studi', program.telepon_prodi],
    ['19. Website Program Studi', program.website_prodi],
    ['20. Visi Program Studi', program.visi_prodi],
    ['21. Misi Program Studi', program.misi_prodi],
    ['22. Kompetensi Lulusan (PLO)', program.kompetensi_lulusan],
    ['23. Kriteria Lulusan - SKS Minimal', program.kriteria_lulusan.sks_minimal],
    ['    - Nilai D Maksimal', program.kriteria_lulusan.nilai_d_maksimal],
    ['    - IPK Minimal', program.kriteria_lulusan.ipk_minimal],
    ['    - TOEFL Minimal', program.kriteria_lulusan.toefl_minimal],
    ['    - Syarat Lainnya', program.kriteria_lulusan.syarat_lainnya],
    ['24. Jumlah Mahasiswa pada TS (PDDIKTI)', program.jumlah_mahasiswa_ts],
    ['25. Jumlah Lulusan pada TS', program.jumlah_lulusan_ts],
    ['26. Jumlah Dosen Homebase PS pada TS (PDDIKTI)', program.jumlah_dosen_homebase_ts],
    ['27. Jumlah Dosen Tetap PS pada TS (PDDIKTI)', program.jumlah_dosen_tetap_ts],
    ['28. Jumlah Dosen Tidak Tetap PS (PDDIKTI)', program.jumlah_dosen_tidak_tetap_ts],
    ['29. Tenaga Kependidikan (S3 / S2 / S1 / Diploma / SMA)', `S3:${program.tenaga_kependidikan.s3}, S2:${program.tenaga_kependidikan.s2}, S1:${program.tenaga_kependidikan.s1}, D3/D4:${program.tenaga_kependidikan.diploma}, SMA:${program.tenaga_kependidikan.sma}`],
    ['30. Ketua Program Studi', program.kaprodi_nama, 'NIP', program.kaprodi_nip, 'HP', program.kaprodi_hp],
    ['31. Mengetahui Dekan', program.dekan_nama, 'NIP', program.dekan_nip],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(identitasRows);
  XLSX.utils.book_append_sheet(wb, ws1, '1_Identitas_Prodi');

  // Sheet 2: Nilai capaian & target
  const evalRows: (string | number)[][] = [
    ['INSTRUMEN EVALUASI DIRI & PENILAIAN AUDITOR (10 STANDAR SPMI)'],
    ['Program Studi:', program.nama_prodi, 'Siklus:', cycle.tahun_siklus],
    [],
    [
      'Standar',
      'No',
      'Uraian Indikator',
      'Keadaan Prodi Saat Ini',
      'Nilai Capaian (1-7)',
      'Sebutan Capaian',
      'Target 1 Th yad (1-7)',
      'Sebutan Target',
      'Kategori Temuan',
      'Akar Masalah / Penunjang (PLOR+CA)',
      'PTK / RTL',
      'PIC',
      'Waktu Selesaikan PTK/RTL',
      'Waktu Monev PTK/RTL',
      'Bukti Link Dokumen',
    ],
  ];

  indicators.forEach((ind) => {
    const std = standards.find((s) => s.id === ind.standard_id);
    const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
    const kategori = getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, ev.kategori_override);
    const plorText = buildPlorCaNarrative(ev.plor_ca);
    const akarCombined = plorText
      ? `${ev.akar_masalah ? ev.akar_masalah + ' — ' : ''}${plorText}`
      : ev.akar_masalah;

    evalRows.push([
      std ? `${std.id}. ${std.nama}` : String(ind.standard_id),
      ind.code,
      ind.uraian,
      ev.nilai_capaian !== null
        ? `${ev.nilai_capaian}. ${ind.rubric_levels[ev.nilai_capaian]}`
        : '-',
      ev.nilai_capaian ?? '',
      getSebutan(ev.nilai_capaian),
      ev.target_1_yr ?? '',
      getSebutan(ev.target_1_yr),
      kategori ?? '-',
      akarCombined,
      ev.ptk_rtl,
      ev.pic,
      ev.waktu_ptk,
      ev.waktu_monev,
      ev.bukti_link,
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(evalRows);
  XLSX.utils.book_append_sheet(wb, ws2, '2_Nilai_Capaian_Target');

  // Sheet 3: REKAP & Analisis per Standar
  const rekapRows: (string | number)[][] = [
    ['REKAPITULASI & ANALISIS HASIL AMI PER STANDAR'],
    ['Program Studi:', program.nama_prodi, 'Rata-rata Terbobot:', overall.rataRataCapaianTerbobot],
    [],
    [
      'Standar',
      'Nilai Capaian per Standar (0-100)',
      'Sebutan Capaian',
      'Nilai Target per Standar (0-100)',
      'Sebutan Target',
      'Kategori Temuan',
      'Mayor',
      'Minor',
      'Observasi',
      'Sesuai (Baik)',
      'Best Practice',
    ],
  ];
  recaps.forEach((r) => {
    rekapRows.push([
      `${r.standardId}. ${r.nama}`,
      r.nilaiCapaian,
      r.sebutanCapaian,
      r.nilaiTarget,
      r.sebutanTarget,
      r.kategoriTemuan ?? '-',
      r.counts.Mayor,
      r.counts.Minor,
      r.counts.Observasi,
      r.counts['Sesuai (Baik)'],
      r.counts['Best Practice'],
    ]);
  });
  rekapRows.push([
    'Rata-rata Nilai Terbobot / Total',
    overall.rataRataCapaianTerbobot,
    overall.sebutanOverall,
    overall.rataRataTargetTerbobot,
    '',
    '',
    overall.totalCounts.Mayor,
    overall.totalCounts.Minor,
    overall.totalCounts.Observasi,
    overall.totalCounts['Sesuai (Baik)'],
    overall.totalCounts['Best Practice'],
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet(rekapRows);
  XLSX.utils.book_append_sheet(wb, ws3, '3_Rekap_Analisis_Standar');

  // Sheet 4: Ringkasan Laporan AMI
  const laporanRows: (string | number)[][] = [
    ['LAPORAN EKSEKUTIF AUDIT MUTU INTERNAL (AMI) SPMI'],
    ['Perguruan Tinggi', program.nama_pt],
    ['Fakultas', program.fakultas],
    ['Program Studi', `${program.kode_ps} - ${program.nama_prodi}`],
    ['Siklus PPEPP', cycle.tahun_siklus],
    ['Nilai Terbobot AMI', overall.rataRataCapaianTerbobot, 'Sebutan', overall.sebutanOverall],
    ['Target Terbobot AMI', overall.rataRataTargetTerbobot],
    ['Total Indikator Dievaluasi', overall.totalIndikator],
    ['Total Mayor', overall.totalCounts.Mayor],
    ['Total Minor', overall.totalCounts.Minor],
    ['Total Observasi', overall.totalCounts.Observasi],
    ['Total Sesuai (Baik)', overall.totalCounts['Sesuai (Baik)']],
    ['Total Best Practice', overall.totalCounts['Best Practice']],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(laporanRows);
  XLSX.utils.book_append_sheet(wb, ws4, '4_Laporan_AMI');

  // Sheet 5: Temuan AMI (KTS & Observasi)
  const temuanRows: (string | number)[][] = [
    ['DAFTAR TEMUAN AMI (KTS & OBSERVASI)'],
    ['No', 'Standar', 'Uraian Standar', 'Temuan Audit (Kondisi Saat Ini & Bukti)', 'Kategori Temuan', 'Akar Masalah / Penunjang (PLOR+CA)'],
  ];
  let temuanIdx = 1;
  indicators.forEach((ind) => {
    const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
    const kat = getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, ev.kategori_override);
    if (kat && kat !== 'Sesuai (Baik)') {
      const std = standards.find((s) => s.id === ind.standard_id);
      const plorText = buildPlorCaNarrative(ev.plor_ca);
      temuanRows.push([
        temuanIdx++,
        std ? `${std.id}. ${std.nama}` : String(ind.standard_id),
        `${ind.code} ${ind.uraian}`,
        `${ev.nilai_capaian !== null ? `${ev.nilai_capaian}. ${ind.rubric_levels[ev.nilai_capaian]}` : '-'}${ev.bukti_link ? ` (Bukti: ${ev.bukti_link})` : ''}`,
        kat,
        plorText ? `${ev.akar_masalah ? ev.akar_masalah + ' — ' : ''}${plorText}` : ev.akar_masalah,
      ]);
    }
  });
  const ws5 = XLSX.utils.aoa_to_sheet(temuanRows);
  XLSX.utils.book_append_sheet(wb, ws5, '5_Temuan_AMI_KTS_OB');

  // Sheet 6: Formulir PTK / RTL
  const ptkRows: (string | number)[][] = [
    ['FORMULIR PERMINTAAN TINDAKAN KOREKSI (PTK) & RENCANA TINDAK LANJUT (RTL)'],
    ['No', 'Referensi Standar', 'Kategori', 'Akar Masalah / Penunjang', 'PTK / RTL', 'PIC', 'Waktu Selesaikan PTK/RTL', 'Waktu Monev PTK/RTL'],
  ];
  let ptkIdx = 1;
  indicators.forEach((ind) => {
    const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
    const kat = getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, ev.kategori_override);
    if (kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi') {
      ptkRows.push([
        ptkIdx++,
        `${ind.code} ${ind.uraian}`,
        kat,
        ev.akar_masalah,
        ev.ptk_rtl,
        ev.pic,
        ev.waktu_ptk,
        ev.waktu_monev,
      ]);
    }
  });
  const ws6 = XLSX.utils.aoa_to_sheet(ptkRows);
  XLSX.utils.book_append_sheet(wb, ws6, '6_PTK_RTL');

  // Sheet 7: Monev AMI PTK/RTL
  const monevRows: (string | number)[][] = [
    ['MONITORING & EVALUASI (MONEV) TINDAK LANJUT AMI'],
    ['No', 'Temuan AMI Sebelumnya', 'Kategori Temuan', 'PTK / RTL', 'PIC', 'Bukti Realisasi PTK/RTL', 'Tanggal Penyelesaian', 'Status Verifikasi'],
  ];
  let monevIdx = 1;
  indicators.forEach((ind) => {
    const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
    const kat = getKategoriTemuan(ev.nilai_capaian, ev.target_1_yr, ev.kategori_override);
    if (kat === 'Mayor' || kat === 'Minor' || kat === 'Observasi') {
      monevRows.push([
        monevIdx++,
        `${ind.code} — ${ev.nilai_capaian !== null ? `${ev.nilai_capaian}. ${ind.rubric_levels[ev.nilai_capaian]}` : '-'}`,
        kat,
        ev.ptk_rtl,
        ev.pic,
        ev.bukti_realisasi,
        ev.tanggal_penyelesaian,
        ev.monev_status,
      ]);
    }
  });
  const ws7 = XLSX.utils.aoa_to_sheet(monevRows);
  XLSX.utils.book_append_sheet(wb, ws7, '7_Monev_PTK_RTL');

  const safeName = program.nama_prodi.replace(/[^a-zA-Z0-9]+/g, '_');
  const safeCycle = cycle.tahun_siklus.replace(/[^a-zA-Z0-9]+/g, '-');
  XLSX.writeFile(wb, `AMI_UNPATTI_${safeName}_${safeCycle}.xlsx`);
}

export function exportInstrumentTemplate(params: {
  standards: AmiStandard[];
  indicators: AmiIndicator[];
}): void {
  const { standards, indicators } = params;
  const wb = XLSX.utils.book_new();

  const templateRows: (string | number)[][] = [
    ['TEMPLATE INSTRUMEN EVALUASI DIRI & PENILAIAN AUDITOR AMI (10 STANDAR SPMI)'],
    ['UNIVERSITAS PATTIMURA (UNPATTI) — LPMPP'],
    ['Petunjuk: Isi kolom Nilai Capaian (1-7), Target 1 Th yad (1-7), Akar Masalah, PTK/RTL, PIC, Jadwal, dan Bukti Link Dokumen.'],
    [],
    [
      'Kode Standar',
      'Nama Standar',
      'No Indikator',
      'Uraian Indikator',
      'Rubrik Skor 1',
      'Rubrik Skor 2',
      'Rubrik Skor 3',
      'Rubrik Skor 4',
      'Rubrik Skor 5',
      'Rubrik Skor 6',
      'Rubrik Skor 7',
      'Nilai Capaian (1-7)',
      'Target 1 Th yad (1-7)',
      'Akar Masalah / Penunjang (PLOR+CA)',
      'PTK / RTL',
      'PIC',
      'Waktu Selesaikan PTK',
      'Waktu Monev PTK',
      'Bukti Link Dokumen',
    ],
  ];

  indicators.forEach((ind) => {
    const std = standards.find((s) => s.id === ind.standard_id);
    templateRows.push([
      std?.kode ?? `STD-${ind.standard_id}`,
      std?.nama ?? '',
      ind.code,
      ind.uraian,
      ind.rubric_levels[1],
      ind.rubric_levels[2],
      ind.rubric_levels[3],
      ind.rubric_levels[4],
      ind.rubric_levels[5],
      ind.rubric_levels[6],
      ind.rubric_levels[7],
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  });

  const wsTemplate = XLSX.utils.aoa_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template_Instrumen_10_Standar');

  const refRows: (string | number)[][] = [
    ['REFERENSI SKALA PENILAIAN & KATEGORI TEMUAN AMI UNPATTI'],
    [],
    ['Skor', 'Sebutan Capaian / Target', 'Kategori Temuan Otomatis'],
    [1, 'Perbaikan menyeluruh dan mendesak', 'Mayor'],
    [2, 'Perbaikan mayor', 'Minor'],
    [3, 'Perbaikan minor', 'Observasi'],
    [4, 'Cukup', 'Observasi'],
    [5, 'Lebih dari Cukup', 'Observasi'],
    [6, 'Baik', 'Sesuai (Baik)'],
    [7, 'Sangat Baik', 'Best Practice'],
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi_Skala_1_7');

  XLSX.writeFile(wb, 'Template_Instrumen_AMI_10_Standar_UNPATTI.xlsx');
}

export function exportRankingToExcel(params: {
  cycle: AmiCycle;
  entries: ProdiRankingEntry[];
  tierLabel: string;
  clusterFilter: 'all' | PpeppCluster;
}): void {
  const { cycle, entries, tierLabel, clusterFilter } = params;
  const wb = XLSX.utils.book_new();

  const headerRows: (string | number)[][] = [
    ['PERENGKINGAN & KLASTERISASI MUTU PPEPP PROGRAM STUDI UNIVERSITAS PATTIMURA'],
    ['Tahun Siklus', cycle.tahun_siklus, 'Filter Urutan', tierLabel, 'Filter Klaster', clusterFilter === 'all' ? 'Semua Klaster' : clusterFilter],
    ['Metodologi Skor Indeks Kualitas', 'Skor Awal (Rata-rata Capaian %) - 2.0*Mayor - 0.5*Minor - 0.1*Observasi + 0.5*Best Practice'],
    [],
    [
      'Peringkat',
      'Kode PS',
      'Program Studi',
      'Fakultas / Unit',
      'Akreditasi',
      'Skor Awal (%)',
      'Penalti Mayor (-2.0)',
      'Penalti Minor (-0.5)',
      'Penalti Observasi (-0.1)',
      'Bonus Best Practice (+0.5)',
      'Skor Indeks Kualitas',
      'Indeks PPEPP (0-100)',
      'Tren YoY Indeks Kualitas',
      'Mayor',
      'Minor',
      'Observasi',
      'Best Practice',
      'Klaster Mutu',
      'Justifikasi Klaster',
    ],
  ];

  entries.forEach((e) => {
    headerRows.push([
      e.rank,
      e.program.kode_ps,
      e.program.nama_prodi,
      e.program.fakultas,
      e.program.peringkat_akreditasi,
      e.skorAwal,
      -e.penaltiMayor,
      -e.penaltiMinor,
      -e.penaltiObservasi,
      e.bonusBestPractice,
      e.skorIndeksKualitas,
      e.indeksPpepp,
      e.prevSkorIndeksKualitas !== null ? e.deltaKualitas : 0,
      e.ktsMayor,
      e.ktsMinor,
      e.observasi,
      e.bestPractice,
      e.cluster,
      e.clusterReason,
    ]);
  });

  const wsMain = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.book_append_sheet(wb, wsMain, 'Perengkingan_Indeks_Kualitas');

  const clusters: PpeppCluster[] = ['Unggul', 'Stabil', 'Menurun', 'Pembinaan'];
  const summaryRows: (string | number)[][] = [
    ['REKAPITULASI KLASTER MUTU PPEPP'],
    ['Siklus', cycle.tahun_siklus],
    [],
    ['Klaster Mutu', 'Jumlah Prodi', 'Persentase (%)', 'Kriteria'],
    ...clusters.map((cl) => {
      const count = entries.filter((e) => e.cluster === cl).length;
      const pct = entries.length > 0 ? Number(((count / entries.length) * 100).toFixed(1)) : 0;
      const desc =
        cl === 'Unggul'
          ? 'Skor Indeks Kualitas >= 83.0, 0 KTS Mayor, tidak menurun'
          : cl === 'Stabil'
          ? 'Skor Indeks Kualitas >= 68.0, KTS Mayor <= 1, tren stabil/positif'
          : cl === 'Menurun'
          ? 'Penurunan Skor Indeks Kualitas <= -2.0 poin dibanding siklus sebelumnya'
          : 'Skor Indeks Kualitas < 68.0 atau >= 2 KTS Mayor';
      return [cl, count, pct, desc];
    }),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekap_Klaster');

  const safeCycle = cycle.tahun_siklus.replace(/\//g, '-');
  XLSX.writeFile(wb, `Perengkingan_Indeks_Kualitas_UNPATTI_${safeCycle}.xlsx`);
}

export async function exportRankingToPdf(params: {
  cycle: AmiCycle;
  entries: ProdiRankingEntry[];
  tier: RankingTier;
  clusterFilter: 'all' | PpeppCluster;
}): Promise<void> {
  const { cycle, entries, tier, clusterFilter } = params;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 14;
  let logoData: string | null = null;
  try {
    const res = await fetch('/unpatti-logo.png');
    if (res.ok) {
      const blob = await res.blob();
      logoData = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    logoData = null;
  }

  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 10, 20, 20);
  }

  const textX = logoData ? margin + 24 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI · UNIVERSITAS PATTIMURA',
    textX,
    14
  );
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'LAPORAN PERENGKINGAN SKOR INDEKS KUALITAS & KLASTERISASI PPEPP',
    textX,
    20.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const tierName =
    tier === 'top10'
      ? 'Top 10 Terbaik'
      : tier === 'top25'
      ? 'Top 25 Terbaik'
      : tier === 'top50'
      ? 'Top 50 Terbaik'
      : `Semua (${entries.length} Prodi)`;
  doc.text(
    `Siklus: ${cycle.tahun_siklus} (${cycle.status}) · Cakupan: ${tierName} · Klaster: ${
      clusterFilter === 'all' ? 'Semua Klaster' : clusterFilter
    }`,
    textX,
    25.8
  );
  doc.setFontSize(7.5);
  doc.text(
    'Formula: Skor Indeks Kualitas = Skor Awal (Rata-rata Capaian %) - 2.0(Mayor) - 0.5(Minor) - 0.1(Observasi) + 0.5(Best Practice)',
    textX,
    30
  );

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, 33, doc.internal.pageSize.getWidth() - margin, 33);

  autoTable(doc, {
    startY: 36.5,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    head: [
      [
        'Rank',
        'Program Studi',
        'Fakultas',
        'Skor Awal (%)',
        'Penalti (M/m/OB)',
        'Bonus BP',
        'Indeks Kualitas',
        'Indeks PPEPP',
        'Tren YoY',
        'Klaster',
      ],
    ],
    body: entries.map((e) => [
      `#${e.rank}`,
      `${e.program.kode_ps} — ${e.program.nama_prodi}`,
      e.program.fakultas,
      e.skorAwal.toFixed(1),
      `-${e.penaltiMayor.toFixed(1)} / -${e.penaltiMinor.toFixed(1)} / -${e.penaltiObservasi.toFixed(1)}`,
      `+${e.bonusBestPractice.toFixed(1)}`,
      e.skorIndeksKualitas.toFixed(2),
      e.indeksPpepp.toFixed(1),
      e.prevSkorIndeksKualitas !== null
        ? `${e.deltaKualitas >= 0 ? '+' : ''}${e.deltaKualitas.toFixed(1)}`
        : '-',
      e.cluster,
    ]),
  });

  const safeCycle = cycle.tahun_siklus.replace(/\//g, '-');
  doc.save(`Perengkingan_Indeks_Kualitas_UNPATTI_${safeCycle}.pdf`);
}
