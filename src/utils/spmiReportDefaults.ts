import {
  AmiCycle,
  OverallAmiRecap,
  SpmiReportMeta,
  SpmiReportScopeLevel,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';

export interface PpeppStatsData {
  penetapan: number;
  pelaksanaan: number;
  evaluasi: number;
  pengendalian: number;
  peningkatan: number;
  indeks: number;
  label: string;
}

export interface SpmiScopeMetaOptions {
  scopeLevel?: SpmiReportScopeLevel;
  targetFakultas?: string;
  programCount?: number;
  facultyCount?: number;
}

export function createDefaultSpmiReportMeta(
  program: StudyProgramIdentity,
  cycle: AmiCycle,
  recaps: StandardRecap[],
  overall: OverallAmiRecap,
  scopeOptions?: SpmiScopeMetaOptions
): SpmiReportMeta {
  const scopeLevel = scopeOptions?.scopeLevel ?? 'prodi';
  const targetFakultas = scopeOptions?.targetFakultas ?? program.fakultas;
  const programCount = scopeOptions?.programCount ?? 1;
  const facultyCount = scopeOptions?.facultyCount ?? 1;

  const lowestStandards = [...recaps]
    .sort((a, b) => a.nilaiCapaian - b.nilaiCapaian)
    .slice(0, 3);

  const highestStandards = [...recaps]
    .sort((a, b) => b.nilaiCapaian - a.nilaiCapaian)
    .slice(0, 2);

  const scopeCode =
    scopeLevel === 'universitas'
      ? 'UNIV-UNPATTI'
      : scopeLevel === 'fakultas'
      ? targetFakultas
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 10)
          .toUpperCase()
      : program.kode_ps;

  const unitEntityLabel =
    scopeLevel === 'universitas'
      ? `Universitas Pattimura (${facultyCount} Fakultas/Pascasarjana/PSDKU, ${programCount} Program Studi)`
      : scopeLevel === 'fakultas'
      ? `${targetFakultas} (${programCount} Program Studi)`
      : `Program Studi ${program.nama_prodi}`;

  const pimpinanRtmNama =
    scopeLevel === 'universitas'
      ? 'Prof. Dr. Fredy Leiwakabessy, M.Pd.'
      : program.dekan_nama || `Pimpinan ${targetFakultas}`;

  const pimpinanRtmJabatan =
    scopeLevel === 'universitas'
      ? 'Rektor Universitas Pattimura'
      : scopeLevel === 'fakultas'
      ? targetFakultas.startsWith('Pascasarjana')
        ? 'Direktur Pascasarjana UNPATTI'
        : targetFakultas.startsWith('PSDKU')
        ? `Koordinator ${targetFakultas}`
        : `Dekan ${targetFakultas}`
      : `Dekan ${program.fakultas}`;

  const lokasiAudit =
    scopeLevel === 'universitas'
      ? 'Gedung Rektorat & LPMPP Universitas Pattimura, Kampus Poka'
      : scopeLevel === 'fakultas'
      ? `Ruang Senat ${targetFakultas}`
      : `Ruang Rapat ${program.nama_prodi}, ${program.fakultas}`;

  const tempatRtm =
    scopeLevel === 'universitas'
      ? 'Aula Lantai II Rektorat / LPMPP Universitas Pattimura'
      : scopeLevel === 'fakultas'
      ? `Aula Senat ${targetFakultas}`
      : `Aula Senat ${program.fakultas} / LPMPP Universitas Pattimura`;

  const defaultPic =
    scopeLevel === 'universitas'
      ? 'Kepala LPMPP & Para Dekan/Direktur'
      : scopeLevel === 'fakultas'
      ? `GJM & Para Kaprodi ${targetFakultas}`
      : `Ketua Program Studi ${program.nama_prodi}`;

  return {
    nomorDokumen: `LPMPP-AMI/${scopeCode}/${cycle.tahun_siklus.replace('/', '-')}`,
    noSkAuditor: `SK Rektor UNPATTI No. 1420/UN13/HK/${cycle.tahun_siklus.split('/')[0]}`,
    ketuaAuditor: 'Prof. Dr. Ir. H. Pelupessy, M.Si.',
    ketuaAuditorNip: '196805121994031002',
    anggotaAuditor1: 'Dr. M. Wattimena, S.Pd., M.Pd.',
    anggotaAuditor2: 'Ir. S. Tuhumury, M.T.',
    tanggalAudit: `${program.tahun_pengesahan || '2025'}-10-15`,
    lokasiAudit,
    kepalaLpmppNama: 'Prof. Dr. J. M. Tupan, S.T., M.T.',
    kepalaLpmppNip: '197008171996031001',
    pimpinanRtmNama,
    pimpinanRtmJabatan,
    tanggalRtm: `${program.tahun_pengesahan || '2025'}-11-10`,
    tempatRtm,
    jadwalRtmBerikutnya: `November ${Number(program.tahun_pengesahan || '2025') + 1}`,
    rtmSebelumnyaRingkasan:
      'Sebagian besar tindak lanjut RTM siklus sebelumnya terkait pemutakhiran RPS berbasis OBE dan pelacakan lulusan (Tracer Study) telah berstatus Closed, sedangkan pemenuhan sarana laboratorium dan publikasi bereputasi masih terus dimonitor.',
    umpanBalikStakeholder:
      'Hasil survei kepuasan mahasiswa, dosen, tenaga kependidikan, serta pengguna lulusan menunjukkan apresiasi positif terhadap kualitas pembelajaran dan layanan akademik, dengan catatan perlunya penguatan fasilitas praktikum dan percepatan layanan administrasi digital.',
    arahanPimpinanRtm:
      scopeLevel === 'universitas'
        ? 'Rektorat dan LPMPP mewajibkan percepatan penutupan temuan KTS Mayor di seluruh Fakultas/Pascasarjana/PSDKU serta pendampingan khusus bagi program studi pada klaster Pembinaan dan Menurun.'
        : scopeLevel === 'fakultas'
        ? `Pimpinan ${targetFakultas} bersama GJM mengoordinasikan penuntasan temuan KTS Mayor/Minor lintas program studi serta sinkronisasi RKAT fakultas.`
        : 'Pimpinan Fakultas dan Program Studi berkomitmen mempercepat penutupan seluruh temuan KTS Mayor dan Minor paling lambat 1 semester melalui sinkronisasi program kerja dan RKA-KL.',
    alokasiSumberDayaRtm:
      'Dukungan alokasi anggaran RKAT Fakultas/Universitas untuk pemutakhiran modul praktikum, pendampingan hibah penelitian & PkM dosen, serta pelatihan sertifikasi kompetensi mahasiswa.',
    faktorPendukung:
      `Komitmen pimpinan ${unitEntityLabel}, tersedianya sistem digital PPEPP UNPATTI yang terstruktur, serta capaian baik pada ${highestStandards
        .map((s) => `${s.nama} (${s.nilaiCapaian.toFixed(1)})`)
        .join(' dan ')}.`,
    faktorPenghambat:
      `Keterbatasan kelengkapan bukti dukung digital pada beberapa indikator serta capaian di bawah target pada ${lowestStandards
        .map((s) => `${s.nama} (${s.nilaiCapaian.toFixed(1)})`)
        .join(', ')} yang masih memerlukan pengendalian terpadu.`,
    kesimpulan: `Berdasarkan hasil Audit Mutu Internal (AMI) siklus ${cycle.tahun_siklus}, ${unitEntityLabel} memperoleh rata-rata nilai terbobot ${overall.rataRataCapaianTerbobot.toFixed(
      2
    )} (${overall.sebutanOverall}) dengan total ${overall.totalCounts.Mayor} temuan Mayor, ${
      overall.totalCounts.Minor
    } temuan Minor, ${overall.totalCounts.Observasi} Observasi, dan ${
      overall.totalCounts['Best Practice']
    } Best Practice. Pelaksanaan siklus PPEPP berjalan sistematis dan seluruh temuan telah dilengkapi rencana tindak lanjut (PTK/RTL).`,
    saran:
      scopeLevel === 'universitas'
        ? 'LPMPP dan pimpinan Fakultas/Pascasarjana/PSDKU perlu memfokuskan pembinaan pada unit dengan gap tertinggi, mengeksekusi seluruh PTK/RTL sesuai tenggat, serta menaikkan standar mutu pada unit klaster Unggul.'
        : 'Setiap unit/program studi perlu mengeksekusi seluruh PTK/RTL sesuai tenggat waktu, melengkapi repositori bukti digital di Google Drive/SIMPATTI, serta mengusulkan peningkatan target mutu pada standar yang telah melampaui SN-DIKTI.',
    rtmDecisions: [
      {
        id: 'rtm-1',
        agenda: `Penuntasan Temuan KTS Mayor & Minor (${overall.totalCounts.Mayor} Mayor, ${overall.totalCounts.Minor} Minor)`,
        keputusan:
          'Wajib diselesaikan melalui tindakan korektif terukur maksimal 90 hari kalender setelah RTM dan diverifikasi ulang oleh Auditor LPMPP.',
        sumberDaya: 'Anggaran Operasional Unit & Pendampingan Gugus Jaminan Mutu (GJM)',
        pic: defaultPic,
        tenggat: 'Akhir Semester Berjalan',
      },
      {
        id: 'rtm-2',
        agenda: `Peningkatan Capaian Standar Prioritas (${lowestStandards[0]?.nama ?? 'Standar Proses'})`,
        keputusan:
          'Penyusunan program percepatan kinerja dosen, pemutakhiran RPS OBE, dan penguatan bukti implementasi pada sistem mutu.',
        sumberDaya: 'Dana Hibah Internal Fakultas/Universitas & Pelatihan LPMPP',
        pic: 'Tim Pengembang Kurikulum & Koordinator Bidang',
        tenggat: '6 Bulan (Siklus Monev Berikutnya)',
      },
      {
        id: 'rtm-3',
        agenda: 'Penguatan Budaya Mutu & Digitalisasi Arsip PPEPP',
        keputusan:
          'Seluruh dokumen penetapan, pelaksanaan, evaluasi, dan peningkatan wajib terdokumentasi di tautan repositori resmi.',
        sumberDaya: 'Infrastruktur IT & Tenaga Kependidikan',
        pic: 'GJM / Sekretaris Unit & Operator PDDIKTI',
        tenggat: 'Berkelanjutan Setiap Semester',
      },
    ],
    standardUpgrades: [
      {
        id: 'upg-1',
        namaStandar: highestStandards[0]?.nama ?? 'Standar Isi',
        targetLama: 'Skor Capaian 6 (Baik / 85.71)',
        targetBaru: 'Skor Capaian 7 (Sangat Baik / ≥ 92.00) dengan kurikulum OBE terakreditasi internasional/unggul',
        alasanPeningkatan:
          'Standar telah melampaui batas minimal SN-DIKTI secara konsisten sehingga target dinaikkan untuk daya saing unggul.',
        dokumenRevisi: `Dokumen Kebijakan & Manual Mutu ${scopeLevel === 'prodi' ? program.nama_prodi : targetFakultas} Edisi Revisi ${cycle.tahun_siklus}`,
      },
      {
        id: 'upg-2',
        namaStandar: lowestStandards[0]?.nama ?? 'Standar Penelitian',
        targetLama: 'Minimal 1 publikasi nasional terakreditasi per dosen/tahun',
        targetBaru: 'Minimal 1 publikasi SINTA 1–2 / Prosiding Terindeks / Jurnal Internasional Bereputasi per dosen/tahun',
        alasanPeningkatan:
          'Mendorong peningkatan luaran riset & pengabdian masyarakat berbasis kepakaran dan kolaborasi mahasiswa.',
        dokumenRevisi: `Renstra Penelitian & Pedoman Mutu Akademik ${scopeLevel === 'universitas' ? 'Universitas Pattimura' : targetFakultas}`,
      },
    ],
  };
}
