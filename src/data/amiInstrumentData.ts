import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  JenisProdi,
  RubricLevelKey,
  StudyProgramIdentity,
} from '../types/ami';
import {
  UNPATTI_118_PROGRAMS,
  UNPATTI_FACULTIES,
} from './unpattiPrograms118';
import {
  AMI_INDICATORS_KEPENDIDIKAN,
  KEPENDIDIKAN_PRESET_EVALS,
} from './amiKependidikanData';

export { UNPATTI_FACULTIES, AMI_INDICATORS_KEPENDIDIKAN };

export const AMI_STANDARDS: AmiStandard[] = [
  { id: 1, kode: 'STD-01', nama: 'Standar Isi', bobot: 10 },
  { id: 2, kode: 'STD-02', nama: 'Standar Proses', bobot: 10 },
  { id: 3, kode: 'STD-03', nama: 'Standar Kompetensi Lulusan', bobot: 10 },
  { id: 4, kode: 'STD-04', nama: 'Standar Pendidik dan Tenaga Kependidikan', bobot: 10 },
  { id: 5, kode: 'STD-05', nama: 'Standar Sarana dan Prasarana Pendidikan', bobot: 10 },
  { id: 6, kode: 'STD-06', nama: 'Standar Pengelolaan Program Studi', bobot: 10 },
  { id: 7, kode: 'STD-07', nama: 'Standar Pembiayaan', bobot: 10 },
  { id: 8, kode: 'STD-08', nama: 'Standar Penilaian', bobot: 10 },
  { id: 9, kode: 'STD-09', nama: 'Standar Penelitian', bobot: 10 },
  { id: 10, kode: 'STD-10', nama: 'Standar Pengabdian kepada Masyarakat', bobot: 10 },
];

export const AMI_CYCLE_YEARS: string[] = [
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
];

export const AMI_CYCLES: AmiCycle[] = AMI_CYCLE_YEARS.map((yr) => {
  const startYear = Number(yr.split('/')[0]);
  const status: AmiCycle['status'] =
    startYear < 2025 ? 'Selesai' : startYear === 2025 ? 'Aktif' : 'Persiapan';
  return {
    id: `11111111-1111-1111-1111-11111111${startYear}`,
    tahun_siklus: yr,
    label: `Siklus AMI PPEPP ${yr}`,
    status,
  };
});

function makeStandardRubric(
  subject: string,
  custom?: Partial<Record<RubricLevelKey, string>>
): Record<RubricLevelKey, string> {
  return {
    1:
      custom?.[1] ??
      `Tidak terdapat kebijakan, pedoman, maupun implementasi terkait ${subject}.`,
    2:
      custom?.[2] ??
      `Terdapat praktik insidental terkait ${subject} namun belum memiliki dokumen kebijakan dan pedoman tertulis.`,
    3:
      custom?.[3] ??
      `Terdapat dokumen kebijakan tertulis mengenai ${subject}, tetapi implementasinya belum menyeluruh dan belum konsisten.`,
    4:
      custom?.[4] ??
      `Terdapat dokumen kebijakan dan pedoman ${subject} yang memadai serta mulai diimplementasikan pada sebagian unit/mata kuliah.`,
    5:
      custom?.[5] ??
      `Implementasi ${subject} berjalan secara konsisten sesuai pedoman, namun evaluasi dan tindak lanjutnya belum terdokumentasi berkala.`,
    6:
      custom?.[6] ??
      `Implementasi ${subject} berjalan baik, terdokumentasi lengkap, dan dievaluasi secara berkala setiap tahun akademik.`,
    7:
      custom?.[7] ??
      `Implementasi ${subject} berjalan sangat baik, terintegrasi sistem informasi mutu, dievaluasi berkelanjutan setiap semester, dan menunjukkan peningkatan capaian nyata.`,
  };
}

export const AMI_INDICATORS: AmiIndicator[] = [
  // ================= STANDAR 1: STANDAR ISI (1.1 - 1.10) =================
  {
    id: 'ind-1-1',
    standard_id: 1,
    code: '1.1',
    uraian:
      'Kejelasan dan kelengkapan dokumen kebijakan tentang penyusunan dan pengembangan kurikulum',
    rubric_levels: {
      1: 'Tidak terdapat kebijakan tertulis maupun tidak tertulis tentang penyusunan dan pengembangan kurikulum.',
      2: 'Terdapat kebijakan tidak tertulis tentang penyusunan dan pengembangan kurikulum.',
      3: 'Terdapat kebijakan tertulis tetapi tidak lengkap tentang penyusunan dan pengembangan kurikulum.',
      4: 'Terdapat dokumen kebijakan yang mencakup ketetapan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan peninjauan dan pengembangan kurikulum.',
      5: 'Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala setiap 5 tahun.',
      6: 'Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala kurang dari setiap 5 tahun.',
      7: 'Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala kurang dari setiap 5 tahun dan evaluasi/penyempurnaan setiap akhir tahun ajaran.',
    },
  },
  {
    id: 'ind-1-2',
    standard_id: 1,
    code: '1.2',
    uraian:
      'Pelibatan stakeholder (dosen, alumni, mahasiswa, asosiasi profesi, pengguna lulusan, dan penentu kebijakan pendidikan) dalam penyusunan kurikulum',
    rubric_levels: {
      1: 'Penyusunan kurikulum hanya dilakukan oleh ketua program studi tanpa melibatkan dosen dan pemangku kepentingan.',
      2: 'Penyusunan kurikulum dilakukan oleh pimpinan program studi dengan melibatkan sebagian dosen internal tanpa pemangku kepentingan eksternal.',
      3: 'Penyusunan kurikulum dilakukan dengan melibatkan dosen dan mahasiswa, namun belum melibatkan alumni atau pengguna lulusan.',
      4: 'Penyusunan kurikulum dilakukan oleh pimpinan perguruan tinggi dan ketua program studi dengan melibatkan 3 dari 7 pihak yaitu: (1) dosen, (2) mahasiswa, (3) alumni, (4) asosiasi profesi, (5) pengguna lulusan, dan (6) penentu kebijakan pendidikan.',
      5: 'Penyusunan kurikulum melibatkan minimal 4 dari 6 unsur pemangku kepentingan serta dilengkapi berita acara dan daftar hadir.',
      6: 'Penyusunan kurikulum melibatkan minimal 5 unsur pemangku kepentingan (dosen, mahasiswa, alumni, asosiasi profesi, pengguna lulusan, pakar) disertai dokumen masukan tertulis.',
      7: 'Penyusunan kurikulum melibatkan seluruh pemangku kepentingan secara terstruktur, terdokumentasi lengkap, dan hasil masukan ditindaklanjuti dalam struktur kurikulum OBE.',
    },
  },
  {
    id: 'ind-1-3',
    standard_id: 1,
    code: '1.3',
    uraian:
      'Kejelasan pedoman serta dokumen implementasi monitoring dan keberkalaan evaluasi pengembangan kurikulum',
    rubric_levels: {
      1: 'Tidak terdapat pedoman maupun kegiatan monitoring dan evaluasi pengembangan kurikulum.',
      2: 'Kegiatan monitoring kurikulum dilakukan secara insidental tanpa pedoman tertulis.',
      3: 'Terdapat pedoman monitoring dan evaluasi kurikulum namun tidak dijalankan secara konsisten.',
      4: 'Terdapat pedoman monitoring dan evaluasi pengembangan kurikulum tetapi tidak diperbaharui secara berkala.',
      5: 'Terdapat pedoman monitoring dan evaluasi pengembangan kurikulum yang dilaksanakan setiap 4–5 tahun namun dokumen analisis belum lengkap.',
      6: 'Terdapat pedoman monitoring dan evaluasi pengembangan kurikulum yang dilaksanakan secara berkala, disertai dokumen hasil analisis dan evaluasi pengembangan kurikulum program studi yang ditindaklanjuti untuk penyempurnaan mutu.',
      7: 'Terdapat pedoman monitoring dan evaluasi kurikulum mutakhir dengan siklus evaluasi tahunan, umpan balik CPL terukur, dan tindak lanjut terdokumentasi.',
    },
  },
  {
    id: 'ind-1-4',
    standard_id: 1,
    code: '1.4',
    uraian:
      'Kandungan substansi profesional dalam rumusan visi dan misi Program Studi',
    rubric_levels: {
      1: 'Rumusan visi dan misi tidak mencerminkan keilmuan maupun kompetensi profesional program studi.',
      2: 'Rumusan visi dan misi sangat umum dan belum mengarah pada substansi profesional bidang studi.',
      3: 'Rumusan visi dan misi memuat sebagian kecil unsur profesional tetapi belum spesifik.',
      4: 'Rumusan visi dan misi mengandung substansi profesional secara implisit namun belum terukur.',
      5: 'Rumusan visi dan misi mengandung substansi profesional yang cukup jelas namun belum dijabarkan ke dalam sasaran mutu.',
      6: 'Rumusan visi dan misi mengandung substansi profesional yang cukup jelas tertulis secara eksplisit dan rinci.',
      7: 'Rumusan visi dan misi mengandung substansi profesional sangat kuat, spesifik, berciri khas kepulauan/maritim UNPATTI, eksplisit, dan terukur.',
    },
  },
  {
    id: 'ind-1-5',
    standard_id: 1,
    code: '1.5',
    uraian:
      'Kesesuaian kurikulum dengan visi dan misi Program Studi',
    rubric_levels: {
      1: 'Kurikulum tidak memiliki keterkaitan dengan visi dan misi program studi.',
      2: 'Kesesuaian mata kuliah dengan visi dan misi program studi kurang dari 30%.',
      3: 'Kesesuaian kurikulum dengan visi dan misi baru mencakup mata kuliah penciri umum tanpa peta keterkaitan.',
      4: 'Terdapat peta keterkaitan kurikulum dengan visi dan misi program studi namun belum mencakup soft skills.',
      5: 'Sebagian besar mata kuliah inti sesuai dengan visi dan misi program studi serta tercantum dalam dokumen kurikulum.',
      6: 'Terdapat dokumen kesesuaian antara kurikulum dan visi misi program studi mencakup hard skills dan soft skills.',
      7: 'Terdapat dokumen tentang kesesuaian antara kurikulum, kompetensi termasuk soft skills, dan misi program studi yang lengkap serta rencana implementasi kurikulum tertulis yang jelas.',
    },
  },
  {
    id: 'ind-1-6',
    standard_id: 1,
    code: '1.6',
    uraian:
      'Kesesuaian kurikulum program studi dengan profil dan kompetensi lulusan program studi',
    rubric_levels: makeStandardRubric('kesesuaian kurikulum dengan profil dan kompetensi lulusan', {
      6: 'Terdapat dokumen kesesuaian kurikulum dengan profil lulusan dan matriks CPL-Bahan Kajian-MK secara lengkap.',
      7: 'Matriks kesesuaian kurikulum dengan profil lulusan dan CPL tervalidasi asosiasi profesi, terukur setiap semester, dan lengkap.',
    }),
  },
  {
    id: 'ind-1-7',
    standard_id: 1,
    code: '1.7',
    uraian:
      'Kesesuaian kurikulum dengan perkembangan IPTEKS dan kebutuhan masyarakat',
    rubric_levels: {
      1: 'Kurikulum belum dimutakhirkan lebih dari 10 tahun dan tidak sesuai perkembangan IPTEKS.',
      2: 'Materi kurikulum masih mengacu pada silabus lama dan minim penyesuaian kebutuhan industri/masyarakat.',
      3: 'Terdapat beberapa mata kuliah baru, namun secara umum kurikulum belum selaras dengan perkembangan IPTEKS.',
      4: 'Terdapat dokumen yang menunjukkan bahwa kurikulum sesuai dengan perkembangan IPTEKS dan kebutuhan masyarakat, namun tidak lengkap.',
      5: 'Kurikulum sesuai dengan perkembangan IPTEKS mutakhir dan kebutuhan masyarakat di wilayah Maluku dan nasional.',
      6: 'Kurikulum mutakhir mengikuti perkembangan IPTEKS, MBKM, dan hasil tracer study kebutuhan pengguna lulusan.',
      7: 'Kurikulum sangat adaptif terhadap perkembangan IPTEKS mutakhir, kebutuhan industri/masyarakat kepulauan, dan ditinjau rutin bersama mitra.',
    },
  },
  {
    id: 'ind-1-8',
    standard_id: 1,
    code: '1.8',
    uraian:
      'Relevansi substansi matakuliah yang berkaitan dengan kompetensi lulusan',
    rubric_levels: {
      1: 'Kurang dari 30% substansi mata kuliah relevan dengan kompetensi lulusan.',
      2: '30%–49% substansi mata kuliah relevan dengan kompetensi lulusan.',
      3: '50%–69% substansi mata kuliah relevan dengan kompetensi lulusan.',
      4: '70%–79% substansi matakuliah yang berkaitan dengan kompetensi profesional sesuai dengan profile lulusan program studi.',
      5: '80%–89% substansi mata kuliah relevan langsung dengan profil dan CPL program studi.',
      6: '90%–99% substansi mata kuliah terhubung jelas dengan capaian kompetensi lulusan.',
      7: '100% substansi mata kuliah terpetakan secara presisi ke dalam CPL dan profil lulusan program studi.',
    },
  },
  {
    id: 'ind-1-9',
    standard_id: 1,
    code: '1.9',
    uraian: 'Kesesuaian matakuliah dan sks dengan standar kompetensi',
    rubric_levels: makeStandardRubric('kesesuaian bobot sks mata kuliah dengan standar kompetensi', {
      4: '70%–79% mata kuliah dan sks telah sesuai dengan standar kompetensi program studi.',
      5: '80%–89% mata kuliah dan sks telah sesuai dengan standar kompetensi program studi.',
      6: '90%–99% mata kuliah dan sks telah sesuai dengan standar kompetensi dan SN-Dikti.',
      7: '100% mata kuliah dan sks sesuai dengan standar kompetensi KKNI/OBE dan kebutuhan jam belajar mahasiswa.',
    }),
  },
  {
    id: 'ind-1-10',
    standard_id: 1,
    code: '1.10',
    uraian:
      'Mata kuliah dilengkapi dengan deskripsi mata kuliah, RPS/Silabus, Modul, dan SAP/RPP',
    rubric_levels: {
      1: 'Kurang dari 25% mata kuliah memiliki deskripsi dan RPS.',
      2: '25%–49% mata kuliah memiliki deskripsi dan RPS namun belum seragam.',
      3: '50%–69% mata kuliah dilengkapi dengan deskripsi mata kuliah dan RPS.',
      4: '70%–79% mata kuliah dilengkapi dengan deskripsi mata kuliah dan RPS/SAP.',
      5: '80%–89% mata kuliah sudah dilengkapi dengan deskripsi matakuliah, RPS/Silabus, Modul, dan SAP/RPP.',
      6: '90%–99% mata kuliah memiliki RPS berbasis OBE, bahan ajar/modul, dan instrumen asesmen lengkap.',
      7: '100% mata kuliah memiliki deskripsi, RPS berbasis OBE mutakhir, modul ajar, dan tersedia secara daring di SIAKAD/LMS.',
    },
  },

  // ================= STANDAR 2: STANDAR PROSES (2.1 - 2.16) =================
  {
    id: 'ind-2-1',
    standard_id: 2,
    code: '2.1',
    uraian:
      'Suasana akademik: kebijakan dan dukungan terhadap otonomi keilmuan, kebebasan akademik, dan kebebasan mimbar akademik',
    rubric_levels: makeStandardRubric('suasana akademik dan otonomi keilmuan', {
      7: 'Terdapat sistem tata laksana yang kondusif untuk mewujudkan suasana akademik, otonomi keilmuan, dan kebebasan akademik di dalam dan luar kelas secara berkelanjutan.',
    }),
  },
  {
    id: 'ind-2-2',
    standard_id: 2,
    code: '2.2',
    uraian:
      'Pembelajaran mendukung interaksi akademik dengan pihak luar program studi melalui seminar, visiting lecture, dan kolaborasi',
    rubric_levels: makeStandardRubric('interaksi akademik dengan pihak eksternal', {
      6: 'Program studi secara rutin menyelenggarakan kuliah tamu, seminar ilmiah, dan kolaborasi pembelajaran bersama pakar luar prodi/industri.',
    }),
  },
  {
    id: 'ind-2-3',
    standard_id: 2,
    code: '2.3',
    uraian:
      'Keterpaduan kegiatan pembelajaran dengan hasil penelitian dan pengabdian kepada masyarakat (PkM) dosen',
    rubric_levels: makeStandardRubric('integrasi penelitian dan PkM dalam pembelajaran', {
      6: 'Minimal 50% mata kuliah mengintegrasikan hasil penelitian dan PkM dosen sebagai studi kasus, modul ajar, atau proyek mahasiswa.',
    }),
  },
  {
    id: 'ind-2-4',
    standard_id: 2,
    code: '2.4',
    uraian:
      'Kejelasan kebijakan tentang perencanaan proses pembelajaran, strategi pembelajaran, dan pengembangan karakter mahasiswa',
    rubric_levels: makeStandardRubric('kebijakan strategi pembelajaran dan pengembangan karakter'),
  },
  {
    id: 'ind-2-5',
    standard_id: 2,
    code: '2.5',
    uraian:
      'Penerapan metode pembelajaran Student Centered Learning (SCL) seperti Case Method dan Team-Based Project',
    rubric_levels: {
      1: 'Pembelajaran sepenuhnya bersifat satu arah (teacher-centered) tanpa metode partisipatif.',
      2: 'Kurang dari 20% mata kuliah menerapkan metode pembelajaran SCL.',
      3: '20%–39% mata kuliah menerapkan metode pembelajaran SCL.',
      4: '40%–59% mata kuliah menerapkan metode pembelajaran SCL.',
      5: '60%–79% mata kuliah menerapkan metode pembelajaran SCL/Case Method/Project-Based Learning.',
      6: '80%–95% mata kuliah menerapkan metode pembelajaran SCL secara konsisten.',
      7: '100% metode pembelajaran yang digunakan di program studi menerapkan pendekatan Student Centered Learning (Case Method/Team-Based Project).',
    },
  },
  {
    id: 'ind-2-6',
    standard_id: 2,
    code: '2.6',
    uraian:
      'Peran serta tenaga ahli/praktisi sebagai pembicara dalam seminar/kuliah umum maupun dosen tamu dari luar perguruan tinggi',
    rubric_levels: makeStandardRubric('pelibatan praktisi dan dosen tamu eksternal', {
      4: 'Peran serta tenaga ahli/praktisi sebagai pembicara dalam seminar dan dosen tamu terlaksana namun belum terjadwal rutin di seluruh semester.',
      6: 'Peran serta tenaga ahli/praktisi terlaksana minimal 2 kali setiap semester secara terjadwal untuk penguatan kompetensi terapan.',
    }),
  },
  {
    id: 'ind-2-7',
    standard_id: 2,
    code: '2.7',
    uraian:
      'Pelaksanaan perkuliahan teori untuk mengembangkan kompetensi profesional mahasiswa',
    rubric_levels: {
      1: 'Perkuliahan teori tidak terjadwal baik dan tanpa tugas terstruktur.',
      2: 'Perkuliahan teori berjalan kurang dari 75% pertemuan tanpa umpan balik tugas.',
      3: 'Perkuliahan teori terlaksana namun tugas terstruktur belum konsisten.',
      4: 'Perkuliahan teori dilaksanakan dalam bentuk tatap muka terjadwal, tugas terstruktur, dan tugas mandiri belum lengkap.',
      5: 'Perkuliahan dilakukan dalam bentuk tatap muka terjadwal, tugas terstruktur, dan tugas mandiri tidak terjadwal.',
      6: 'Perkuliahan teori dilaksanakan lengkap dengan tatap muka terjadwal, tugas terstruktur, tugas mandiri, dan umpan balik berkala.',
      7: 'Perkuliahan teori terlaksana 100% sesuai kalender akademik disertai pembelajaran aktif, tugas terstruktur, mandiri, dan refleksi CPL.',
    },
  },
  {
    id: 'ind-2-8',
    standard_id: 2,
    code: '2.8',
    uraian:
      'Pelaksanaan perkuliahan praktik/laboratorium/bengkel/studio untuk memenuhi kompetensi praktik',
    rubric_levels: makeStandardRubric('pelaksanaan praktikum laboratorium atau studio', {
      5: 'Perkuliahan praktik dilakukan di laboratorium/bengkel/studio dengan bimbingan asisten/laboran tanpa refleksi terstruktur.',
      6: 'Perkuliahan praktik dilakukan di laboratorium dengan modul praktikum lengkap, bimbingan dosen/laboran, dan evaluasi laporan.',
    }),
  },
  {
    id: 'ind-2-9',
    standard_id: 2,
    code: '2.9',
    uraian:
      'Sistem monitoring dan evaluasi kehadiran dosen dan mahasiswa setiap semester serta ketepatan RPS/silabus',
    rubric_levels: makeStandardRubric('monitoring dan evaluasi kehadiran perkuliahan', {
      5: 'Ada sistem monitoring dan evaluasi kehadiran dosen serta mahasiswa tetapi tindak lanjut perbaikannya belum terdokumentasi penuh.',
      7: 'Ada sistem monitoring dan evaluasi terpadu tiap semester untuk kehadiran mahasiswa, kehadiran dosen, ketepatan RPS/silabus, serta tindak lanjut perbaikan.',
    }),
  },
  {
    id: 'ind-2-10',
    standard_id: 2,
    code: '2.10',
    uraian: 'Peran dosen sebagai model dan teladan dalam proses pembelajaran',
    rubric_levels: {
      1: 'Kurang dari 30% dosen menunjukkan keteladanan etika dan kedisiplinan akademik.',
      2: '30%–49% dosen berperan sebagai model dalam pembelajaran.',
      3: '50%–69% dosen berperan sebagai model dalam pembelajaran.',
      4: '70%–79% dosen berperan sebagai model dalam pembelajaran.',
      5: '80%–89% dosen berperan sebagai model dalam pembelajaran.',
      6: '90%–95% dosen berperan sebagai model dalam pembelajaran.',
      7: '> 95% dosen berperan sebagai model teladan etika, integritas, dan profesionalisme dalam pembelajaran.',
    },
  },
  {
    id: 'ind-2-11',
    standard_id: 2,
    code: '2.11',
    uraian: 'Pemanfaatan ICT dan e-learning (LMS) dalam proses pembelajaran',
    rubric_levels: {
      1: 'Tidak ada pemanfaatan ICT dalam pembelajaran.',
      2: 'Pemanfaatan ICT terbatas pada slide presentasi dasar.',
      3: 'Ada pemanfaatan ICT pada sebagian kecil mata kuliah.',
      4: 'Ada dua bentuk pemanfaatan ICT di dalam kelas.',
      5: 'Ada empat unsur pemanfaatan ICT di kelas (LMS, materi digital, kuis daring, kolaborasi).',
      6: 'Pemanfaatan ICT dan LMS terintegrasi pada hampir seluruh mata kuliah.',
      7: '100% mata kuliah memanfaatkan LMS/ICT interaktif, repositori materi digital, dan asesmen daring terintegrasi.',
    },
  },
  {
    id: 'ind-2-12',
    standard_id: 2,
    code: '2.12',
    uraian: 'Rasio kepatuhan terhadap materi dan jumlah pertemuan perkuliahan (16 minggu)',
    rubric_levels: makeStandardRubric('kepatuhan jumlah pertemuan dan materi RPS', {
      6: 'Dilakukan kontrol rutin terhadap kesesuaian materi dan jumlah pertemuan minimal 14–16 kali setiap semester.',
    }),
  },
  {
    id: 'ind-2-13',
    standard_id: 2,
    code: '2.13',
    uraian: 'Penggunaan perangkat pembelajaran (RPS, SAP/RPP, bahan ajar, kontrak kuliah)',
    rubric_levels: makeStandardRubric('penggunaan perangkat pembelajaran oleh dosen', {
      6: '81%–99% dosen menggunakan SAP/RPS, kontrak kuliah, dan bahan ajar terstandar.',
      7: '100% dosen membagikan dan melaksanakan perkuliahan sesuai RPS, kontrak kuliah, dan bahan ajar mutakhir.',
    }),
  },
  {
    id: 'ind-2-14',
    standard_id: 2,
    code: '2.14',
    uraian: 'Peninjauan berkala efektivitas metode pembelajaran berdasarkan umpan balik mahasiswa',
    rubric_levels: makeStandardRubric('evaluasi dan peninjauan metode pembelajaran'),
  },
  {
    id: 'ind-2-15',
    standard_id: 2,
    code: '2.15',
    uraian: 'Layanan pembimbingan akademik (PA) dan pembimbingan tugas akhir/skripsi',
    rubric_levels: makeStandardRubric('pembimbingan akademik dan tugas akhir', {
      6: 'Pembimbingan PA dan tugas akhir dilakukan terjadwal minimal 4 kali per semester dan tercatat dalam log buku/sistem bimbingan.',
    }),
  },
  {
    id: 'ind-2-16',
    standard_id: 2,
    code: '2.16',
    uraian:
      'Upaya Program Studi mengembangkan kegiatan kemahasiswaan penalaran, olah raga, seni, dan budaya',
    rubric_levels: makeStandardRubric('pengembangan kegiatan kemahasiswaan ekstra-kurikuler', {
      6: 'Program studi aktif memfasilitasi pembinaan penalaran ilmiah, olahraga, seni, dan budaya mahasiswa disertai pendanaan dan prestasi.',
    }),
  },

  // ================= STANDAR 3: STANDAR KOMPETENSI LULUSAN (3.1 - 3.11) =================
  {
    id: 'ind-3-1',
    standard_id: 3,
    code: '3.1',
    uraian:
      'Pelibatan pemangku kepentingan dalam penyusunan Standar Kompetensi Lulusan (SKL / CPL)',
    rubric_levels: makeStandardRubric('pelibatan pemangku kepentingan dalam penyusunan SKL/CPL', {
      7: 'Semua pemangku kepentingan pendidikan (ahli bidang studi, asosiasi profesi, pengguna lulusan, alumni, dosen, mahasiswa) dilibatkan aktif dan terdokumentasi.',
    }),
  },
  {
    id: 'ind-3-2',
    standard_id: 3,
    code: '3.2',
    uraian: 'Standar Kompetensi Lulusan Mata Kuliah (SKL MK / CPMK)',
    rubric_levels: {
      1: '< 40% mata kuliah memiliki SKL MK / CPMK yang jelas.',
      2: '40%–59% mata kuliah memiliki CPMK.',
      3: '60%–69% mata kuliah memiliki CPMK.',
      4: '70%–79% mata kuliah memiliki CPMK.',
      5: '80%–89% mata kuliah yang ada dalam struktur kurikulum prodi telah memiliki SKL MK / CPMK.',
      6: '90%–99% mata kuliah yang ada dalam struktur kurikulum prodi telah memiliki SKL MK / CPMK.',
      7: '100% mata kuliah dalam struktur kurikulum prodi telah memiliki SKL MK / CPMK terukur sesuai CPL.',
    },
  },
  {
    id: 'ind-3-3',
    standard_id: 3,
    code: '3.3',
    uraian: 'SKL / CPL kelompok mata kuliah (KMK) inti, pendukung, dan penciri',
    rubric_levels: makeStandardRubric('SKL kelompok mata kuliah', {
      5: '80%–89% kelompok mata kuliah yang ada dalam struktur kurikulum prodi telah memiliki SKL KMK.',
      6: '90%–99% kelompok mata kuliah telah memiliki SKL KMK.',
    }),
  },
  {
    id: 'ind-3-4',
    standard_id: 3,
    code: '3.4',
    uraian: 'Standar Kompetensi Lulusan Program Studi (CPL Prodi) mendukung tercapainya VMTS',
    rubric_levels: makeStandardRubric('kesesuaian SKL/CPL Prodi dengan visi misi', {
      6: 'SKL/CPL Prodi telah ada dan mendukung tercapainya 90%–99% tujuan, misi, dan visi program studi.',
      7: 'SKL/CPL Prodi mendukung 100% tercapainya visi, misi, dan tujuan program studi secara eksplisit.',
    }),
  },
  {
    id: 'ind-3-5',
    standard_id: 3,
    code: '3.5',
    uraian: 'Penyesuaian SKL / CPL dengan perkembangan IPTEKS dan KKNI/OBE',
    rubric_levels: makeStandardRubric('penyesuaian SKL dengan IPTEKS', {
      6: 'SKL Prodi mendukung lulusan untuk memiliki 90%–99% penguasaan IPTEKS mutakhir di bidang ilmunya.',
    }),
  },
  {
    id: 'ind-3-6',
    standard_id: 3,
    code: '3.6',
    uraian: 'Rata-rata lama masa studi lulusan dalam tiga tahun terakhir',
    rubric_levels: {
      1: 'Rata-rata masa studi lulusan > 6 tahun.',
      2: 'Rata-rata masa studi lulusan 5,5 – 6 tahun.',
      3: 'Rata-rata masa studi lulusan 5,0 – 5,4 tahun.',
      4: 'Rata-rata masa studi lulusan 4,5 – 4,9 tahun.',
      5: 'Rata-rata masa studi lulusan 4,1 – 4,4 tahun.',
      6: 'Rata-rata masa studi lulusan <= 4,0 tahun (tepat waktu 8 semester).',
      7: 'Rata-rata masa studi lulusan <= 3,8 tahun dengan proporsi kelulusan tepat waktu tinggi.',
    },
  },
  {
    id: 'ind-3-7',
    standard_id: 3,
    code: '3.7',
    uraian: 'Persentase ketepatan waktu kelulusan mahasiswa',
    rubric_levels: makeStandardRubric('persentase kelulusan tepat waktu', {
      5: 'Persentase kelulusan tepat waktu untuk seluruh program studi mencapai 41%–55%.',
      6: 'Persentase kelulusan tepat waktu untuk seluruh program studi mencapai 56%–70%.',
      7: 'Persentase kelulusan tepat waktu mahasiswa melampaui > 70%.',
    }),
  },
  {
    id: 'ind-3-8',
    standard_id: 3,
    code: '3.8',
    uraian:
      'Sistem evaluasi kelulusan tepat waktu dan pemenuhan kompetensi (Exit Survey & Portofolio CPL)',
    rubric_levels: {
      1: 'Tidak ada sistem evaluasi kelulusan tepat waktu maupun pengukuran capaian CPL lulusan.',
      2: 'Terdapat pencatatan kelulusan namun belum ada sistem monitoring hambatan studi dan pemenuhan kompetensi profesional.',
      3: 'Sistem monitoring kelulusan tersedia tetapi tidak dievaluasi tiap semester.',
      4: 'Terdapat sistem evaluasi kelulusan tepat waktu tetapi tindak lanjut keterlambatan studi belum optimal.',
      5: 'Terdapat sistem evaluasi kelulusan tepat waktu dan pemenuhan kompetensi yang dilaporkan tiap tahun.',
      6: 'Terdapat sistem evaluasi kelulusan tepat waktu dan pemenuhan kompetensi dalam bentuk ketetapan, strategi, serta instrumen monitoring dan evaluasi.',
      7: 'Sistem evaluasi kelulusan tepat waktu dan portofolio CPL terintegrasi SIMPATTI dan ditindaklanjuti secara berkala tiap semester.',
    },
  },
  {
    id: 'ind-3-9',
    standard_id: 3,
    code: '3.9',
    uraian:
      'Pelaksanaan Tracer Study lulusan untuk memantau masa tunggu, kesesuaian bidang kerja, dan kepuasan pengguna',
    rubric_levels: makeStandardRubric('pelaksanaan tracer study alumni dan pengguna lulusan', {
      6: 'Program studi melaksanakan tracer study lengkap mencakup 5 komponen utama serta melaporkan hasil analisisnya setiap tahun.',
    }),
  },
  {
    id: 'ind-3-10',
    standard_id: 3,
    code: '3.10',
    uraian: 'Masa tunggu lulusan dalam mendapatkan pekerjaan pertama',
    rubric_levels: {
      1: 'Masa tunggu lulusan > 18 bulan.',
      2: 'Masa tunggu lulusan 12 – 18 bulan.',
      3: 'Masa tunggu lulusan 9 – 11 bulan.',
      4: 'Masa tunggu lulusan 6 – 8 bulan.',
      5: 'Masa tunggu lulusan 4 – 5 bulan.',
      6: 'Masa tunggu lulusan dalam mendapatkan pekerjaan pertama <= 3 bulan.',
      7: 'Rata-rata masa tunggu lulusan <= 2 bulan atau telah direkrut sebelum yudisium.',
    },
  },
  {
    id: 'ind-3-11',
    standard_id: 3,
    code: '3.11',
    uraian: 'Rasio alumni yang terlacak dalam lima tahun terakhir dan kesesuaian bidang kerja',
    rubric_levels: makeStandardRubric('rasio keterlacakan alumni dan kesesuaian kerja', {
      3: 'Rasio alumni terlacak dalam lima tahun terakhir yang memberikan respon terhadap studi pelacakan 20% sampai 29%.',
      5: 'Rasio alumni terlacak yang memberikan respon mencapai 45%–59% dengan kesesuaian bidang kerja >= 75%.',
      6: 'Rasio alumni terlacak mencapai >= 60% dengan kesesuaian bidang kerja tinggi.',
    }),
  },
  {
    id: 'ind-3-12',
    standard_id: 3,
    code: '3.12',
    uraian: 'Kepemilikan sertifikat kompetensi/profesi pendukung dan Surat Keterangan Pendamping Ijazah (SKPI) bagi lulusan',
    rubric_levels: makeStandardRubric('sertifikasi kompetensi dan penerbitan SKPI lulusan', {
      5: '41%–60% lulusan dibekali sertifikat kompetensi/keahlian dan seluruh lulusan memperoleh SKPI resmi.',
      6: '61%–80% lulusan memiliki sertifikat kompetensi pendukung tervalidasi BNSP/lembaga profesi beserta SKPI lengkap.',
      7: '> 80% lulusan memperoleh sertifikat kompetensi nasional/internasional dan SKPI terintegrasi portofolio MBKM.',
    }),
  },
  {
    id: 'ind-3-13',
    standard_id: 3,
    code: '3.13',
    uraian: 'Capaian prestasi akademik dan non-akademik mahasiswa pada tingkat lokal, nasional, dan internasional',
    rubric_levels: makeStandardRubric('capaian prestasi mahasiswa tingkat nasional dan internasional', {
      5: 'Mahasiswa Program Studi meraih prestasi pada tingkat regional/wilayah dan mulai berpartisipasi pada ajang nasional.',
      6: 'Mahasiswa Program Studi aktif meraih juara/penghargaan tingkat nasional (PKM/ONMIPA/Gemastik/Pomnas) setiap tahun.',
      7: 'Mahasiswa secara konsisten meraih prestasi nasional dan internasional dengan sistem pembinaan dan insentif terstruktur.',
    }),
  },
  {
    id: 'ind-3-14',
    standard_id: 3,
    code: '3.14',
    uraian: 'Tingkat kepuasan pengguna lulusan terhadap etika, keahlian bidang ilmu, bahasa asing, TI, dan kerja sama tim',
    rubric_levels: makeStandardRubric('kepuasan pengguna lulusan terhadap kompetensi alumni', {
      5: 'Skor kepuasan pengguna lulusan rata-rata >= 3,25 (skala 4) namun cakupan responden masih < 40%.',
      6: 'Skor kepuasan pengguna lulusan rata-rata >= 3,50 (skala 4) dengan umpan balik terdokumentasi untuk perbaikan kurikulum.',
      7: 'Skor kepuasan pengguna lulusan >= 3,75 (skala 4) pada seluruh aspek kompetensi dan ditindaklanjuti dalam rapat kurikulum.',
    }),
  },
  {
    id: 'ind-3-15',
    standard_id: 3,
    code: '3.15',
    uraian: 'Mekanisme evaluasi dan pemutakhiran berkala Standar Kompetensi Lulusan (SKL / CPL) Program Studi',
    rubric_levels: makeStandardRubric('evaluasi dan pemutakhiran berkala SKL/CPL Program Studi', {
      6: 'Evaluasi SKL/CPL dilaksanakan terjadwal bersama pemangku kepentingan dan hasilnya digunakan dalam revisi kurikulum.',
      7: 'Evaluasi ketercapaian CPL diukur kuantitatif per angkatan setiap tahun akademik dan dimutakhirkan sesuai SN-Dikti/LAM.',
    }),
  },

  // ================= STANDAR 4: PENDIDIK & TENAGA KEPENDIDIKAN (4.1 - 4.12) =================
  {
    id: 'ind-4-1',
    standard_id: 4,
    code: '4.1',
    uraian: 'Kualifikasi akademik dosen tetap Program Studi (S2/S3 sesuai bidang)',
    rubric_levels: {
      1: 'Kurang dari 50% dosen berkualifikasi minimal S2.',
      2: '50%–69% dosen berkualifikasi minimal S2.',
      3: '70%–84% dosen berkualifikasi minimal S2.',
      4: '85%–99% dosen berkualifikasi minimal S2 dengan proporsi S3 < 15%.',
      5: '100% dosen berkualifikasi minimal S2 dengan proporsi S3 15%–24%.',
      6: '100% dosen berkualifikasi minimal S2 dan dosen berkualifikasi S3 mencapai 25%–39%.',
      7: '100% dosen berkualifikasi minimal S2 dan >= 40% dosen tetap bergelar S3 sesuai bidang PS.',
    },
  },
  {
    id: 'ind-4-2',
    standard_id: 4,
    code: '4.2',
    uraian: 'Pengalaman dosen mengajar di Program Studi',
    rubric_levels: makeStandardRubric('pengalaman mengajar dosen di Program Studi', {
      6: 'Lebih dari 80% dosen memiliki pengalaman mengajar lebih dari 5 tahun di Program Studi.',
    }),
  },
  {
    id: 'ind-4-3',
    standard_id: 4,
    code: '4.3',
    uraian: 'Jumlah dosen dalam jabatan fungsional akademik (Lektor, Lektor Kepala, Guru Besar)',
    rubric_levels: {
      1: 'Kurang dari 20% dosen memiliki jabatan fungsional Lektor ke atas.',
      2: '20%–29% dosen memiliki jabatan fungsional Lektor ke atas.',
      3: '30%–40% dosen memiliki jabatan fungsional Lektor ke atas.',
      4: 'Dosen dengan jabatan Lektor Kepala dan Guru Besar mencapai 10%–19%, atau Lektor >= 41%.',
      5: 'Dosen dengan jabatan Guru Besar dan Lektor Kepala mencapai 20%–34%.',
      6: 'Dosen dengan jabatan Guru Besar dan Lektor Kepala mencapai 35%–49%.',
      7: '>= 50% dosen memiliki jabatan fungsional Lektor Kepala dan Guru Besar.',
    },
  },
  {
    id: 'ind-4-4',
    standard_id: 4,
    code: '4.4',
    uraian: 'Jumlah dosen yang memiliki sertifikat pendidik profesional (Serdos) dan sertifikat kompetensi',
    rubric_levels: makeStandardRubric('kepemilikan sertifikat pendidik dan profesi dosen', {
      6: 'Lebih dari 75% dosen tetap telah memiliki sertifikat pendidik (Serdos) atau sertifikat profesi.',
    }),
  },
  {
    id: 'ind-4-5',
    standard_id: 4,
    code: '4.5',
    uraian: 'Kesesuaian dosen pengampu mata kuliah dengan latar belakang pendidikan dan penelitiannya',
    rubric_levels: makeStandardRubric('kesesuaian bidang keahlian dosen pengampu', {
      6: 'Lebih dari 85% dosen mengampu mata kuliah sesuai dengan latar belakang pendidikan dan bidang penelitiannya.',
    }),
  },
  {
    id: 'ind-4-6',
    standard_id: 4,
    code: '4.6',
    uraian: 'Keikutsertaan dosen dalam forum ilmiah nasional dan internasional',
    rubric_levels: makeStandardRubric('keikutsertaan dosen dalam forum ilmiah', {
      6: 'Lebih dari 75% dosen tetap Program Studi aktif sebagai pemakalah/peserta dalam seminar atau konferensi ilmiah dalam 3 tahun terakhir.',
    }),
  },
  {
    id: 'ind-4-7',
    standard_id: 4,
    code: '4.7',
    uraian: 'Rasio beban kerja dosen terhadap jumlah mahasiswa (Full-Time Equivalent / FTE)',
    rubric_levels: {
      1: 'Rasio dosen terhadap mahasiswa > 1 : 60.',
      2: 'Rasio dosen terhadap mahasiswa 1 : 46 s.d 1 : 60.',
      3: 'Rasio dosen terhadap mahasiswa 1 : 36 s.d 1 : 45.',
      4: 'Rasio beban kerja dosen persatuan FTE antara 1 : 26 s.d 1 : 35 (atau > 16 sks).',
      5: 'Rasio beban kerja dosen ideal 1 : 21 s.d 1 : 25 dengan beban EWMP 12–16 sks.',
      6: 'Rasio dosen terhadap mahasiswa sangat ideal 1 : 15 s.d 1 : 20 dan beban EWMP merata.',
      7: 'Rasio dosen terhadap mahasiswa <= 1 : 15 dengan distribusi EWMP 12–16 sks sangat seimbang.',
    },
  },
  {
    id: 'ind-4-8',
    standard_id: 4,
    code: '4.8',
    uraian: 'Kualifikasi dan sertifikasi tenaga kependidikan (pustakawan, laboran, teknisi, admin)',
    rubric_levels: makeStandardRubric('kualifikasi dan sertifikasi tenaga kependidikan'),
  },
  {
    id: 'ind-4-9',
    standard_id: 4,
    code: '4.9',
    uraian: 'Relevansi latar belakang pendidikan tenaga kependidikan terhadap tugas layanannya',
    rubric_levels: {
      1: 'Kurang dari 20% tenaga kependidikan berlatar belakang relevan.',
      2: '20%–30% tenaga kependidikan berlatar belakang relevan.',
      3: '31%–40% tenaga kependidikan berlatar belakang relevan.',
      4: 'Relevansi bidang tugas tenaga kependidikan dengan latar belakang pendidikan mencapai 41%–59%.',
      5: 'Relevansi bidang tugas tenaga kependidikan mencapai 60%–79%.',
      6: '80%–94% tenaga kependidikan memiliki kualifikasi pendidikan dan kompetensi relevan dengan unit kerjanya.',
      7: '>= 95% tenaga kependidikan memiliki latar belakang relevan dan bersertifikat kompetensi/pelatihan.',
    },
  },
  {
    id: 'ind-4-10',
    standard_id: 4,
    code: '4.10',
    uraian: 'Program pengembangan kompetensi dan studi lanjut (S3) dosen dan tenaga kependidikan',
    rubric_levels: makeStandardRubric('pengembangan kompetensi dan studi lanjut SDM'),
  },
  {
    id: 'ind-4-11',
    standard_id: 4,
    code: '4.11',
    uraian:
      'Ketersediaan sistem pengelolaan pendidik dan tenaga kependidikan (seleksi, penempatan, pengembangan karier, remunerasi, sanksi, penghargaan)',
    rubric_levels: {
      1: 'Belum terdapat sistem pengelolaan pendidik dan tenaga kependidikan secara tertulis.',
      2: 'Hanya mencakup 1–2 aspek pengelolaan SDM.',
      3: 'Mencakup 3–4 aspek pengelolaan SDM namun belum konsisten diterapkan.',
      4: 'Program Studi/Fakultas memiliki 5 dari 7 pedoman pengelolaan SDM namun belum seluruhnya terdokumentasi.',
      5: 'Program Studi memiliki 5 dari 7 pedoman tertulis dan dilaksanakan secara konsisten serta dievaluasi.',
      6: 'Tersedia lengkap 7 aspek pedoman pengelolaan SDM yang diterapkan konsisten.',
      7: 'Seluruh 7 aspek pengelolaan SDM terintegrasi sistem kepegawaian universitas dan dievaluasi berkala.',
    },
  },
  {
    id: 'ind-4-12',
    standard_id: 4,
    code: '4.12',
    uraian:
      'Ketersediaan pedoman dan dokumen implementasi tentang sistem monitoring dan evaluasi, serta rekam jejak kinerja pendidik dan tenaga kependidikan dalam bidang (1) pendidikan (2) penelitian (3) pelayanan/pengabdian kepada masyarakat',
    rubric_levels: makeStandardRubric('pedoman, monitoring, dan rekam jejak kinerja tridharma SDM', {
      4: 'Program Studi memiliki 3 pedoman tertulis tidak lengkap yang dilaksanakan secara konsisten tentang kinerja dosen di bidang pendidikan, penelitian, dan PkM tetapi belum terdokumentasi dengan baik.',
      5: 'Program Studi memiliki pedoman tertulis lengkap dan dilaksanakan secara konsisten tentang kinerja dosen dalam bidang pendidikan, penelitian, dan pengabdian kepada masyarakat yang terdokumentasi dengan baik.',
      6: 'Seluruh pedoman pengelolaan dan evaluasi kinerja tridharma SDM lengkap, dimonitoring berkala melalui BKD/IKD, dan ditindaklanjuti.',
      7: 'Sistem monitoring dan rekam jejak kinerja pendidik serta tendik terintegrasi penuh dengan SIMPATTI/SISTER dan menjadi dasar peningkatan mutu berkelanjutan.',
    }),
  },

  // ================= STANDAR 5: SARANA & PRASARANA PENDIDIKAN (5.1 - 5.10) =================
  {
    id: 'ind-5-1',
    standard_id: 5,
    code: '5.1',
    uraian:
      'Kecukupan koleksi perpustakaan, akses laboratorium, bandwidth internet, serta fasilitas kerja bagi dosen dan mahasiswa',
    rubric_levels: {
      1: 'Sarana perpustakaan, laboratorium, dan akses internet tidak memadai untuk menunjang proses pembelajaran.',
      2: 'Ketersediaan ruang dan koleksi perpustakaan/laboratorium di bawah 40% standar minimal.',
      3: 'Tersedia ruang perpustakaan dan laboratorium dasar namun akses dan perangkat masih terbatas.',
      4: 'Tersedia ruang perpustakaan, laboratorium, dan internet dengan kecukupan 60%–74%.',
      5: 'Tersedia koleksi perpustakaan, laboratorium, dan jaringan kampus memadai untuk kegiatan belajar.',
      6: 'Tersedia koleksi perpustakaan, laboratorium lengkap, ruang baca, dan akses internet cepat bagi mahasiswa dan dosen.',
      7: 'Tersedia koleksi perpustakaan mutakhir mencakup buku teks, skripsi/tesis, jurnal nasional terakreditasi, jurnal internasional, laboratorium terkalibrasi, serta akses internet memadai.',
    },
  },
  {
    id: 'ind-5-2',
    standard_id: 5,
    code: '5.2',
    uraian: 'Kemudahan akses perpustakaan digital (e-library, e-journal, repositori institusi)',
    rubric_levels: {
      1: 'Belum tersedia layanan akses perpustakaan maupun bahan pustaka digital.',
      2: 'Layanan perpustakaan sepenuhnya manual dan koleksi terbatas.',
      3: 'Tersedia katalog perpustakaan terbatas di jam kerja.',
      4: 'Ada kemudahan akses layanan bahan pustaka secara manual maupun katalog daring dasar.',
      5: 'Bahan pustaka dan repositori skripsi dapat diakses daring melalui jaringan internal kampus.',
      6: 'Tersedia akses e-library, e-journal nasional/internasional, dan repositori UNPATTI secara daring.',
      7: 'Akses perpustakaan digital dan e-journal bereputasi (IEEE/ScienceDirect/Springer/SINTA) dapat diakses 24/7 oleh seluruh sivitas.',
    },
  },
  {
    id: 'ind-5-3',
    standard_id: 5,
    code: '5.3',
    uraian: 'Kecukupan ruang kuliah, kapasitas, pencahayaan, ventilasi/AC, dan perangkat multimedia',
    rubric_levels: makeStandardRubric('kecukupan dan kenyamanan ruang kuliah multimedia'),
  },
  {
    id: 'ind-5-4',
    standard_id: 5,
    code: '5.4',
    uraian: 'Kecukupan ruang kerja dosen tetap dan ruang layanan administrasi Program Studi',
    rubric_levels: makeStandardRubric('kecukupan ruang kerja dosen (>= 4 m2/dosen) dan layanan prodi'),
  },
  {
    id: 'ind-5-5',
    standard_id: 5,
    code: '5.5',
    uraian: 'Fasilitas K3 (Keamanan, Keselamatan, Kesehatan) kampus dan aksesibilitas ramah disabilitas',
    rubric_levels: makeStandardRubric('fasilitas K3 dan aksesibilitas ramah disabilitas'),
  },
  {
    id: 'ind-5-6',
    standard_id: 5,
    code: '5.6',
    uraian: 'Sistem pemeliharaan, kalibrasi peralatan laboratorium, dan inventarisasi aset (BMN)',
    rubric_levels: makeStandardRubric('pemeliharaan dan kalibrasi sarana laboratorium'),
  },
  {
    id: 'ind-5-7',
    standard_id: 5,
    code: '5.7',
    uraian: 'Kecukupan prasarana penunjang kegiatan kemahasiswaan, ruang baca, ibadah, dan layanan konseling',
    rubric_levels: makeStandardRubric('kecukupan prasarana penunjang kegiatan kemahasiswaan dan layanan mahasiswa'),
  },
  {
    id: 'ind-5-8',
    standard_id: 5,
    code: '5.8',
    uraian: 'Ketersediaan perangkat lunak berlisensi, sistem informasi akademik, dan infrastruktur teknologi pembelajaran daring',
    rubric_levels: makeStandardRubric('ketersediaan perangkat lunak berlisensi dan infrastruktur pembelajaran daring'),
  },
  {
    id: 'ind-5-9',
    standard_id: 5,
    code: '5.9',
    uraian: 'Sistem manajemen keamanan, kebersihan, sanitasi, dan kenyamanan lingkungan belajar kampus',
    rubric_levels: makeStandardRubric('manajemen keamanan, kebersihan, dan kenyamanan lingkungan kampus'),
  },
  {
    id: 'ind-5-10',
    standard_id: 5,
    code: '5.10',
    uraian: 'Rencana induk pengembangan, pemutakhiran, dan investasi sarana prasarana pembelajaran serta riset',
    rubric_levels: makeStandardRubric('rencana pengembangan dan pemutakhiran sarana prasarana'),
  },

  // ================= STANDAR 6: PENGELOLAAN PROGRAM STUDI (6.1 - 6.16) =================
  {
    id: 'ind-6-1',
    standard_id: 6,
    code: '6.1',
    uraian: 'Kejelasan struktur tata pamong, uraian tugas (tupoksi), dan SOP layanan akademik Prodi',
    rubric_levels: makeStandardRubric('tata pamong dan SOP layanan akademik Prodi'),
  },
  {
    id: 'ind-6-2',
    standard_id: 6,
    code: '6.2',
    uraian: 'Ketersediaan Renstra, Renop, dan Rencana Kerja Tahunan (RKT) Program Studi selaras Renstra UNPATTI',
    rubric_levels: makeStandardRubric('perencanaan strategis Renstra/Renop Program Studi'),
  },
  {
    id: 'ind-6-3',
    standard_id: 6,
    code: '6.3',
    uraian: 'Pelaksanaan siklus PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan) di tingkat Prodi',
    rubric_levels: makeStandardRubric('implementasi siklus SPMI PPEPP di Program Studi'),
  },
  {
    id: 'ind-6-4',
    standard_id: 6,
    code: '6.4',
    uraian: 'Penggunaan Sistem Informasi Manajemen Akademik (SIMPATTI/SIAKAD/PDDIKTI) secara mutakhir',
    rubric_levels: makeStandardRubric('pemanfaatan sistem informasi akademik SIMPATTI dan pelaporan PDDIKTI'),
  },
  {
    id: 'ind-6-5',
    standard_id: 6,
    code: '6.5',
    uraian: 'Survei kepuasan mahasiswa, dosen, dan tendik terhadap layanan manajemen Program Studi',
    rubric_levels: makeStandardRubric('pengukuran kepuasan sivitas terhadap layanan manajemen prodi'),
  },
  {
    id: 'ind-6-6',
    standard_id: 6,
    code: '6.6',
    uraian: 'Efektivitas kepemimpinan operasional, organisasional, dan publik pimpinan Program Studi',
    rubric_levels: makeStandardRubric('efektivitas kepemimpinan operasional, organisasional, dan publik Prodi'),
  },
  {
    id: 'ind-6-7',
    standard_id: 6,
    code: '6.7',
    uraian: 'Penerapan prinsip tata pamong yang kredibel, transparan, akuntabel, bertanggung jawab, dan adil (Good Governance)',
    rubric_levels: makeStandardRubric('penerapan prinsip tata pamong Good University Governance'),
  },
  {
    id: 'ind-6-8',
    standard_id: 6,
    code: '6.8',
    uraian: 'Ketersediaan dokumen Kebijakan SPMI, Manual SPMI, Standar SPMI, dan Formulir Mutu di tingkat unit pengelola',
    rubric_levels: makeStandardRubric('kelengkapan 4 dokumen pokok SPMI (Kebijakan, Manual, Standar, Formulir)'),
  },
  {
    id: 'ind-6-9',
    standard_id: 6,
    code: '6.9',
    uraian: 'Keberadaan dan keaktifan Gugus Kendali Mutu (GKM) / Gugus Jaminan Mutu (GJM) di Program Studi',
    rubric_levels: makeStandardRubric('keaktifan Gugus Kendali Mutu / GJM Program Studi'),
  },
  {
    id: 'ind-6-10',
    standard_id: 6,
    code: '6.10',
    uraian: 'Pelaksanaan Rapat Tinjauan Manajemen (RTM) dan tindak lanjut hasil Audit Mutu Internal secara berkala',
    rubric_levels: makeStandardRubric('pelaksanaan Rapat Tinjauan Manajemen dan tindak lanjut AMI'),
  },
  {
    id: 'ind-6-11',
    standard_id: 6,
    code: '6.11',
    uraian: 'Pengendalian dokumen mutu, arsip rekaman akademik, dan ketertelusuran surat menyurat Program Studi',
    rubric_levels: makeStandardRubric('pengendalian dokumen mutu dan arsip rekaman akademik'),
  },
  {
    id: 'ind-6-12',
    standard_id: 6,
    code: '6.12',
    uraian: 'Pengembangan dan realisasi jejaring kerja sama tridharma dengan mitra dalam negeri dan luar negeri',
    rubric_levels: makeStandardRubric('pengembangan dan realisasi kerja sama tridharma dengan mitra'),
  },
  {
    id: 'ind-6-13',
    standard_id: 6,
    code: '6.13',
    uraian: 'Layanan informasi akademik, bimbingan karier, dan kewirausahaan bagi mahasiswa dan calon lulusan',
    rubric_levels: makeStandardRubric('layanan informasi akademik, bimbingan karier, dan kewirausahaan mahasiswa'),
  },
  {
    id: 'ind-6-14',
    standard_id: 6,
    code: '6.14',
    uraian: 'Sosialisasi dan tingkat pemahaman sivitas akademika terhadap Visi, Misi, Tujuan, dan Sasaran (VMTS) Prodi',
    rubric_levels: makeStandardRubric('sosialisasi dan pemahaman VMTS Program Studi oleh sivitas akademika'),
  },
  {
    id: 'ind-6-15',
    standard_id: 6,
    code: '6.15',
    uraian: 'Penerapan sistem pengendalian internal, manajemen risiko operasional, dan pencegahan pelanggaran integritas akademik',
    rubric_levels: makeStandardRubric('pengendalian internal, manajemen risiko, dan integritas akademik'),
  },
  {
    id: 'ind-6-16',
    standard_id: 6,
    code: '6.16',
    uraian: 'Evaluasi ketercapaian target Indikator Kinerja Utama (IKU) dan Renstra Program Studi setiap tahun',
    rubric_levels: makeStandardRubric('evaluasi ketercapaian IKU dan Renstra Program Studi'),
  },

  // ================= STANDAR 7: STANDAR PEMBIAYAAN (7.1 - 7.12) =================
  {
    id: 'ind-7-1',
    standard_id: 7,
    code: '7.1',
    uraian: 'Kecukupan dan realisasi dana operasional pendidikan per mahasiswa per tahun',
    rubric_levels: makeStandardRubric('kecukupan dana operasional pendidikan per mahasiswa', {
      3: 'Dana operasional pendidikan per mahasiswa masih di bawah standar minimal fakultas dan realisasi penyerapan belum merata.',
      4: 'Dana operasional pendidikan memenuhi standar minimal namun dukungan anggaran praktikum/inovasi masih terbatas.',
    }),
  },
  {
    id: 'ind-7-2',
    standard_id: 7,
    code: '7.2',
    uraian: 'Kecukupan alokasi dan serapan dana penelitian serta PkM per dosen tetap per tahun',
    rubric_levels: makeStandardRubric('alokasi dan serapan dana penelitian dan PkM dosen'),
  },
  {
    id: 'ind-7-3',
    standard_id: 7,
    code: '7.3',
    uraian: 'Transparansi, akuntabilitas, dan pelibatan Program Studi dalam penyusunan RKA-KL/RKAT',
    rubric_levels: makeStandardRubric('transparansi dan keterlibatan Prodi dalam perencanaan anggaran'),
  },
  {
    id: 'ind-7-4',
    standard_id: 7,
    code: '7.4',
    uraian: 'Upaya perolehan sumber pendanaan eksternal (hibah riset, kerja sama DUDI/Pemda, beasiswa)',
    rubric_levels: makeStandardRubric('diversifikasi dan perolehan dana kerja sama/hibah eksternal'),
  },
  {
    id: 'ind-7-5',
    standard_id: 7,
    code: '7.5',
    uraian: 'Kecukupan dana investasi sarana prasarana pembelajaran, laboratorium, dan koleksi pustaka Program Studi',
    rubric_levels: makeStandardRubric('kecukupan dana investasi sarana prasarana dan pustaka Prodi'),
  },
  {
    id: 'ind-7-6',
    standard_id: 7,
    code: '7.6',
    uraian: 'Kecukupan alokasi dana pengembangan kompetensi, sertifikasi, dan studi lanjut SDM (dosen dan tendik)',
    rubric_levels: makeStandardRubric('alokasi dana pengembangan kompetensi dan studi lanjut SDM'),
  },
  {
    id: 'ind-7-7',
    standard_id: 7,
    code: '7.7',
    uraian: 'Dukungan pendanaan kegiatan kemahasiswaan, lomba ilmiah, serta pembinaan bakat dan minat',
    rubric_levels: makeStandardRubric('dukungan pendanaan kegiatan dan prestasi kemahasiswaan'),
  },
  {
    id: 'ind-7-8',
    standard_id: 7,
    code: '7.8',
    uraian: 'Efisiensi dan efektivitas penyerapan anggaran tahunan Program Studi sesuai Rencana Kerja Tahunan',
    rubric_levels: makeStandardRubric('efisiensi dan efektivitas penyerapan anggaran tahunan Prodi'),
  },
  {
    id: 'ind-7-9',
    standard_id: 7,
    code: '7.9',
    uraian: 'Pelaksanaan sistem audit keuangan internal/eksternal serta pelaporan pertanggungjawaban penggunaan anggaran',
    rubric_levels: makeStandardRubric('audit keuangan dan akuntabilitas pelaporan anggaran'),
  },
  {
    id: 'ind-7-10',
    standard_id: 7,
    code: '7.10',
    uraian: 'Ketersediaan mekanisme keringanan UKT, beasiswa, dan bantuan biaya pendidikan bagi mahasiswa berprestasi/kurang mampu',
    rubric_levels: makeStandardRubric('fasilitasi beasiswa dan keringanan UKT bagi mahasiswa'),
  },
  {
    id: 'ind-7-11',
    standard_id: 7,
    code: '7.11',
    uraian: 'Kesesuaian realisasi pengeluaran unit pengelola terhadap rencana anggaran biaya operasional pembelajaran',
    rubric_levels: makeStandardRubric('kesesuaian realisasi pengeluaran dengan RKAT pembelajaran'),
  },
  {
    id: 'ind-7-12',
    standard_id: 7,
    code: '7.12',
    uraian: 'Analisis keberlanjutan pembiayaan untuk menjamin kesinambungan operasional dan peningkatan mutu Program Studi',
    rubric_levels: makeStandardRubric('keberlanjutan pembiayaan operasional dan peningkatan mutu Prodi'),
  },

  // ================= STANDAR 8: STANDAR PENILAIAN (8.1 - 8.12) =================
  {
    id: 'ind-8-1',
    standard_id: 8,
    code: '8.1',
    uraian: 'Kejelasan prinsip penilaian (edukatif, otentik, objektif, akuntabel, transparan) dan rubrik dalam RPS',
    rubric_levels: makeStandardRubric('prinsip dan rubrik penilaian dalam RPS'),
  },
  {
    id: 'ind-8-2',
    standard_id: 8,
    code: '8.2',
    uraian: 'Kesesuaian teknik dan instrumen penilaian terhadap capaian CPMK dan CPL (OBE Assessment)',
    rubric_levels: makeStandardRubric('kesesuaian instrumen penilaian dengan CPMK/CPL'),
  },
  {
    id: 'ind-8-3',
    standard_id: 8,
    code: '8.3',
    uraian: 'Ketepatan waktu pengumuman nilai, transparansi umpan balik, dan mekanisme keberatan/banding nilai',
    rubric_levels: makeStandardRubric('ketepatan waktu dan transparansi pengumuman nilai'),
  },
  {
    id: 'ind-8-4',
    standard_id: 8,
    code: '8.4',
    uraian: 'Validasi/review soal ujian (UTS/UAS) dan kelengkapan portofolio asesmen mata kuliah',
    rubric_levels: makeStandardRubric('validasi soal ujian dan portofolio asesmen'),
  },
  {
    id: 'ind-8-5',
    standard_id: 8,
    code: '8.5',
    uraian: 'Pelaksanaan evaluasi hasil belajar dan analisis ketercapaian CPL tiap akhir semester',
    rubric_levels: makeStandardRubric('analisis ketercapaian CPL pada akhir semester'),
  },
  {
    id: 'ind-8-6',
    standard_id: 8,
    code: '8.6',
    uraian: 'Sosialisasi kriteria, bobot komponen penilaian, dan kontrak perkuliahan pada pertemuan awal semester',
    rubric_levels: makeStandardRubric('sosialisasi bobot dan kontrak penilaian pada awal perkuliahan'),
  },
  {
    id: 'ind-8-7',
    standard_id: 8,
    code: '8.7',
    uraian: 'Penerapan penilaian otentik berbasis proses dan produk (portofolio, proyek, studi kasus, praktikum)',
    rubric_levels: makeStandardRubric('penerapan penilaian otentik berbasis proyek dan portofolio'),
  },
  {
    id: 'ind-8-8',
    standard_id: 8,
    code: '8.8',
    uraian: 'Objektivitas dan kejelasan rubrik penilaian ujian tugas akhir/skripsi/tesis serta ujian komprehensif',
    rubric_levels: makeStandardRubric('objektivitas dan rubrik penilaian tugas akhir/skripsi'),
  },
  {
    id: 'ind-8-9',
    standard_id: 8,
    code: '8.9',
    uraian: 'Sistem penyimpanan, validitas, dan keamanan arsip nilai hasil belajar mahasiswa pada SIAKAD',
    rubric_levels: makeStandardRubric('keamanan dan validitas rekaman nilai mahasiswa pada SIAKAD'),
  },
  {
    id: 'ind-8-10',
    standard_id: 8,
    code: '8.10',
    uraian: 'Pemberian umpan balik konstruktif atas tugas, kuis, dan ujian untuk perbaikan belajar mahasiswa',
    rubric_levels: makeStandardRubric('pemberian umpan balik hasil evaluasi pembelajaran kepada mahasiswa'),
  },
  {
    id: 'ind-8-11',
    standard_id: 8,
    code: '8.11',
    uraian: 'Pengendalian mutu tata tertib ujian dan pencegahan plagiarisme pada tugas maupun karya ilmiah mahasiswa',
    rubric_levels: makeStandardRubric('pengendalian tata tertib ujian dan uji anti-plagiarisme'),
  },
  {
    id: 'ind-8-12',
    standard_id: 8,
    code: '8.12',
    uraian: 'Rekapitulasi dan pelaporan capaian pembelajaran individu mahasiswa dalam transkrip dan SKPI',
    rubric_levels: makeStandardRubric('pelaporan capaian pembelajaran individu dalam transkrip dan SKPI'),
  },

  // ================= STANDAR 9: STANDAR PENELITIAN (9.1 - 9.12) =================
  {
    id: 'ind-9-1',
    standard_id: 9,
    code: '9.1',
    uraian: 'Ketersediaan Peta Jalan (Roadmap) Penelitian Program Studi yang selaras dengan VMTS dan LPPM UNPATTI',
    rubric_levels: makeStandardRubric('Peta Jalan (Roadmap) Penelitian Program Studi'),
  },
  {
    id: 'ind-9-2',
    standard_id: 9,
    code: '9.2',
    uraian: 'Persentase penelitian dosen yang melibatkan mahasiswa sebagai bagian dari tugas akhir/skripsi',
    rubric_levels: makeStandardRubric('pelibatan mahasiswa dalam penelitian dosen'),
  },
  {
    id: 'ind-9-3',
    standard_id: 9,
    code: '9.3',
    uraian: 'Produktivitas luaran publikasi ilmiah (jurnal nasional SINTA & internasional bereputasi) serta HKI/Paten',
    rubric_levels: makeStandardRubric('luaran publikasi ilmiah bereputasi dan HKI dosen'),
  },
  {
    id: 'ind-9-4',
    standard_id: 9,
    code: '9.4',
    uraian: 'Keberhasilan dosen memperoleh pendanaan hibah penelitian kompetitif nasional/internasional',
    rubric_levels: makeStandardRubric('perolehan hibah penelitian kompetitif'),
  },
  {
    id: 'ind-9-5',
    standard_id: 9,
    code: '9.5',
    uraian: 'Monitoring kesesuaian pelaksanaan penelitian dengan standar mutu dan etika penelitian',
    rubric_levels: makeStandardRubric('monitoring mutu dan etika penelitian'),
  },
  {
    id: 'ind-9-6',
    standard_id: 9,
    code: '9.6',
    uraian: 'Kesesuaian topik penelitian dosen dengan bidang keilmuan Program Studi dan isu strategis wilayah kepulauan',
    rubric_levels: makeStandardRubric('kesesuaian topik riset dengan keilmuan Prodi dan isu kepulauan'),
  },
  {
    id: 'ind-9-7',
    standard_id: 9,
    code: '9.7',
    uraian: 'Ketersediaan fasilitas laboratorium, perangkat lunak analisis, dan klinik proposal pendukung penelitian dosen',
    rubric_levels: makeStandardRubric('fasilitas pendukung dan klinik proposal penelitian'),
  },
  {
    id: 'ind-9-8',
    standard_id: 9,
    code: '9.8',
    uraian: 'Kebijakan insentif publikasi ilmiah, pendaftaran HKI/paten, dan penerbitan buku ajar/referensi hasil riset',
    rubric_levels: makeStandardRubric('dukungan insentif publikasi ilmiah dan perolehan HKI'),
  },
  {
    id: 'ind-9-9',
    standard_id: 9,
    code: '9.9',
    uraian: 'Kolaborasi penelitian dosen lintas program studi, perguruan tinggi dalam negeri, dan mitra luar negeri',
    rubric_levels: makeStandardRubric('kolaborasi penelitian antar-institusi dalam dan luar negeri'),
  },
  {
    id: 'ind-9-10',
    standard_id: 9,
    code: '9.10',
    uraian: 'Integrasi hasil penelitian dosen ke dalam pemutakhiran bahan ajar, modul praktikum, dan RPS mata kuliah',
    rubric_levels: makeStandardRubric('integrasi hasil penelitian ke dalam bahan ajar dan RPS'),
  },
  {
    id: 'ind-9-11',
    standard_id: 9,
    code: '9.11',
    uraian: 'Keteraturan pelaporan dan pemutakhiran data kinerja penelitian dosen pada SINTA, BIMA, dan LPPM UNPATTI',
    rubric_levels: makeStandardRubric('pelaporan kinerja penelitian dosen pada SINTA/BIMA/LPPM'),
  },
  {
    id: 'ind-9-12',
    standard_id: 9,
    code: '9.12',
    uraian: 'Evaluasi pemanfaatan dan sitasi hasil penelitian dosen bagi pengembangan keilmuan serta kebijakan daerah',
    rubric_levels: makeStandardRubric('evaluasi pemanfaatan dan dampak luaran penelitian dosen'),
  },

  // ================= STANDAR 10: PENGABDIAN KEPADA MASYARAKAT (10.1 - 10.12) =================
  {
    id: 'ind-10-1',
    standard_id: 10,
    code: '10.1',
    uraian: 'Ketersediaan Peta Jalan (Roadmap) PkM Program Studi berbasis kebutuhan masyarakat kepulauan Maluku',
    rubric_levels: makeStandardRubric('Peta Jalan PkM Program Studi berbasis kebutuhan lokal'),
  },
  {
    id: 'ind-10-2',
    standard_id: 10,
    code: '10.2',
    uraian: 'Keterlibatan mahasiswa dalam kegiatan PkM dosen dan KKN Tematik berbasis keilmuan Prodi',
    rubric_levels: makeStandardRubric('keterlibatan mahasiswa dalam kegiatan PkM dosen'),
  },
  {
    id: 'ind-10-3',
    standard_id: 10,
    code: '10.3',
    uraian: 'Luaran PkM berupa publikasi, teknologi tepat guna, produk inovasi, dan dampak terukur bagi mitra',
    rubric_levels: makeStandardRubric('luaran dan dampak PkM bagi masyarakat mitra'),
  },
  {
    id: 'ind-10-4',
    standard_id: 10,
    code: '10.4',
    uraian: 'Keberlanjutan kemitraan PkM dengan pemerintah daerah, sekolah, UMKM, dan masyarakat pesisir',
    rubric_levels: makeStandardRubric('keberlanjutan kemitraan PkM dengan mitra eksternal'),
  },
  {
    id: 'ind-10-5',
    standard_id: 10,
    code: '10.5',
    uraian: 'Evaluasi kepuasan masyarakat mitra dan integrasi hasil PkM ke dalam bahan ajar mata kuliah',
    rubric_levels: makeStandardRubric('evaluasi kepuasan mitra dan integrasi hasil PkM'),
  },
  {
    id: 'ind-10-6',
    standard_id: 10,
    code: '10.6',
    uraian: 'Kesesuaian program PkM dosen dengan bidang keahlian Program Studi dan permasalahan strategis masyarakat pesisir/pulau kecil',
    rubric_levels: makeStandardRubric('kesesuaian program PkM dengan keilmuan Prodi dan masalah mitra'),
  },
  {
    id: 'ind-10-7',
    standard_id: 10,
    code: '10.7',
    uraian: 'Keberhasilan dosen memperoleh pendanaan hibah PkM kompetitif nasional maupun kemitraan industri/Pemda',
    rubric_levels: makeStandardRubric('perolehan hibah PkM kompetitif nasional dan kemitraan'),
  },
  {
    id: 'ind-10-8',
    standard_id: 10,
    code: '10.8',
    uraian: 'Ketersediaan alokasi anggaran, peralatan lapangan, dan dukungan administrasi pelaksanaan PkM Program Studi',
    rubric_levels: makeStandardRubric('dukungan dana dan sarana pelaksanaan PkM Program Studi'),
  },
  {
    id: 'ind-10-9',
    standard_id: 10,
    code: '10.9',
    uraian: 'Kolaborasi pelaksanaan PkM multidisiplin dengan organisasi profesi, lembaga swadaya masyarakat, dan dunia usaha',
    rubric_levels: makeStandardRubric('kolaborasi PkM multidisiplin dengan mitra eksternal'),
  },
  {
    id: 'ind-10-10',
    standard_id: 10,
    code: '10.10',
    uraian: 'Diseminasi dan publikasi hasil kegiatan PkM pada jurnal pengabdian terakreditasi dan media massa',
    rubric_levels: makeStandardRubric('publikasi hasil PkM pada jurnal pengabdian dan media'),
  },
  {
    id: 'ind-10-11',
    standard_id: 10,
    code: '10.11',
    uraian: 'Perolehan HKI/Hak Cipta, model pemberdayaan, atau buku panduan praktis dari hasil kegiatan PkM',
    rubric_levels: makeStandardRubric('luaran HKI dan panduan praktis dari kegiatan PkM'),
  },
  {
    id: 'ind-10-12',
    standard_id: 10,
    code: '10.12',
    uraian: 'Pelaksanaan monitoring, evaluasi ketercapaian target luaran, dan pelaporan kinerja PkM kepada LPPM UNPATTI',
    rubric_levels: makeStandardRubric('monitoring, evaluasi, dan pelaporan kinerja PkM Prodi'),
  },
];

export const INITIAL_STUDY_PROGRAMS: StudyProgramIdentity[] = UNPATTI_118_PROGRAMS;

const EMPTY_PLOR = {
  problem: '',
  location: '',
  objectiveEvidence: '',
  reference: '',
  correction: '',
  action: '',
};

export function getDefaultIndicatorsByJenis(jenis: JenisProdi): AmiIndicator[] {
  return jenis === 'Kependidikan' ? AMI_INDICATORS_KEPENDIDIKAN : AMI_INDICATORS;
}

/**
 * Generates initial evaluation seed records per indicator so all tabs
 * (especially Rekap, Charts, Temuan KTS/OB, PTK/RTL, Ranking, and Monev) reflect
 * realistic Universitas Pattimura AMI data out-of-the-box.
 */
export function buildSeedEvaluations(
  prodiId: string,
  cycleYear = '2025/2026',
  jenisProdi: JenisProdi = 'Non-Kependidikan'
): Record<string, AmiEvaluation> {
  const isInformatika = prodiId === '22222222-2222-2222-2222-222222220001';
  const isIlmuKelautan = prodiId === '22222222-2222-2222-2222-222222220002';
  const isPenjasAru = prodiId === '22222222-2222-2222-2222-222222220114';
  const suffixNum = Number(prodiId.slice(-4)) || 1;
  const startYear = Number(cycleYear.split('/')[0]) || 2025;
  const yearDelta = startYear < 2025 ? Math.max(-2, startYear - 2025) : 0;

  if (jenisProdi === 'Kependidikan') {
    const result: Record<string, AmiEvaluation> = {};
    const profileMod = (suffixNum * 13 + 5) % 10;
    const isDipYear =
      !isPenjasAru &&
      ((suffixNum % 6 === 2 && startYear === 2025) ||
        (suffixNum % 7 === 4 && startYear === 2024) ||
        (suffixNum % 8 === 3 && startYear === 2026) ||
        (suffixNum % 9 === 5 && startYear === 2028));
    const isPembinaanProfile = !isPenjasAru && profileMod <= 1;
    const isUnggulProfile = !isPenjasAru && profileMod >= 7 && !isDipYear;
    const strengthHash = (suffixNum * 17 + startYear * 3) % 11;
    const isPastCycle = startYear < 2025;

    AMI_INDICATORS_KEPENDIDIKAN.forEach((ind, indIdx) => {
      const preset = KEPENDIDIKAN_PRESET_EVALS[ind.id] ?? {
        c: 5 as RubricLevelKey,
        t: 6 as RubricLevelKey,
        akar: '',
      };

      const unggulBonus =
        isUnggulProfile &&
        (indIdx + suffixNum) % (3 + (strengthHash % 4)) === 0
          ? 1
          : 0;
      const prodiBump = isPenjasAru
        ? 0
        : isUnggulProfile
        ? (strengthHash >= 7 ? 1 : 0) +
          unggulBonus -
          ((indIdx + suffixNum) % 7 === 0 ? 1 : 0)
        : isPembinaanProfile
        ? -2 + ((suffixNum + indIdx) % 3 === 0 ? 1 : 0)
        : ((suffixNum * 7 + indIdx * 3) % 3) - 1;
      const dipShift = isDipYear ? -2 : 0;

      const rawBase = preset.c;
      const normalizedBase =
        isUnggulProfile &&
        !isPenjasAru &&
        rawBase >= 6 &&
        (indIdx + strengthHash) % 4 !== 0
          ? 6
          : rawBase;
      const baseCapaian = Math.min(
        7,
        Math.max(1, normalizedBase + prodiBump + dipShift)
      ) as RubricLevelKey;
      const futureBoost =
        startYear > 2025 &&
        !isDipYear &&
        !isPembinaanProfile &&
        (indIdx + suffixNum + startYear) % 6 === 0
          ? 1
          : 0;
      const adjustedCapaian = isPenjasAru && (startYear === 2024 || startYear === 2025)
        ? preset.c
        : (Math.min(
            7,
            Math.max(
              1,
              baseCapaian + (startYear < 2025 && baseCapaian > 2 ? yearDelta : futureBoost)
            )
          ) as RubricLevelKey);

      const targetScore =
        adjustedCapaian >= preset.t
          ? (Math.min(7, Math.max(adjustedCapaian, preset.t)) as RubricLevelKey)
          : preset.t;

      const needsPtk = adjustedCapaian <= 5;
      const ptkDraft = needsPtk
        ? `Menindaklanjuti peningkatan mutu indikator ${ind.code} (${ind.uraian.slice(0, 75)}${ind.uraian.length > 75 ? '...' : ''}) pada Program Studi Kependidikan.`
        : '';

      const defaultMonev: AmiEvaluation['monev_status'] = isPastCycle
        ? isPembinaanProfile && indIdx % 3 === 0
          ? 'In Progress'
          : 'Closed - Verified'
        : isPembinaanProfile || isDipYear
        ? 'Open'
        : isUnggulProfile && indIdx % 2 === 0
        ? 'Closed - Verified'
        : 'Open';

      const workflowStatus: AmiEvaluation['ptk_workflow_status'] =
        defaultMonev === 'Closed - Verified'
          ? 'Terverifikasi Auditor (Closed-Verified)'
          : defaultMonev === 'In Progress'
          ? 'Disetujui Dekan (Siap Monev)'
          : ptkDraft
          ? 'Menunggu Persetujuan Dekan'
          : 'Draft Prodi';

      result[ind.id] = {
        indicator_id: ind.id,
        nilai_capaian: adjustedCapaian,
        target_1_yr: targetScore,
        kategori_override: null,
        akar_masalah:
          preset.akar ||
          (needsPtk
            ? `Diperlukan penguatan dokumen kebijakan, bukti pelaksanaan, serta evaluasi berkala terkait ${ind.code}.`
            : ''),
        plor_ca: { ...EMPTY_PLOR },
        ptk_rtl: ptkDraft,
        pic: needsPtk ? 'Kaprodi & Tim GJM Prodi' : '',
        waktu_ptk: needsPtk ? `${startYear + 1}-02-28` : '',
        waktu_monev: needsPtk ? `${startYear + 1}-04-30` : '',
        bukti_link:
          adjustedCapaian >= 6
            ? `https://drive.google.com/drive/folders/simpatti-fkip-${ind.code.replace('.', '-')}`
            : '',
        bukti_realisasi:
          isPastCycle && ptkDraft
            ? `Tindak lanjut siklus ${cycleYear} telah diverifikasi LPMPP`
            : '',
        tanggal_penyelesaian:
          isPastCycle && ptkDraft ? `${startYear + 1}-01-15` : '',
        monev_status: defaultMonev,
        ptk_workflow_status: workflowStatus,
        dekan_approved_by:
          workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
          workflowStatus === 'Terverifikasi Auditor (Closed-Verified)'
            ? 'Dekan Fakultas (Persetujuan Awal Siklus)'
            : undefined,
        dekan_approved_at:
          workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
          workflowStatus === 'Terverifikasi Auditor (Closed-Verified)'
            ? `${startYear + 1}-02-10`
            : undefined,
      };
    });

    return result;
  }

  const presetScores: Record<
    string,
    {
      c: RubricLevelKey;
      t: RubricLevelKey;
      akar?: string;
      ptk?: string;
      pic?: string;
      wPtk?: string;
      wMonev?: string;
      link?: string;
      realisasi?: string;
      tglSelesai?: string;
      monev?: 'Open' | 'In Progress' | 'Closed - Verified';
      plor?: Partial<typeof EMPTY_PLOR>;
    }
  > = {
    'ind-1-1': {
      c: isIlmuKelautan ? 6 : 1,
      t: isIlmuKelautan ? 7 : 5,
      akar: isIlmuKelautan
        ? 'Pedoman pengembangan kurikulum OBE Fakultas telah diperbarui dan disahkan.'
        : 'Belum adanya koordinasi yang konsisten antara pimpinan institusi/fakultas dan program studi dalam merumuskan dan mengesahkan dokumen kebijakan penyusunan dan peninjauan kurikulum OBE secara tertulis.',
      ptk: isIlmuKelautan
        ? ''
        : 'Menyusun, mengesahkan, dan mensosialisasikan SK & Buku Pedoman Pengembangan Kurikulum OBE Program Studi Teknik Informatika.',
      pic: 'Kaprodi & Tim Kurikulum Prodi',
      wPtk: '2026-01-31',
      wMonev: '2026-03-15',
      link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-1',
      realisasi: isIlmuKelautan ? '' : 'Draf pedoman kurikulum 2025 telah dibahas di rapat senat fakultas',
      tglSelesai: '',
      monev: 'In Progress',
      plor: isIlmuKelautan
        ? {}
        : {
            problem: 'Tidak ditemukan dokumen kebijakan tertulis dan SOP penyusunan kurikulum tingkat Program Studi.',
            location: 'Ruang Akademik Jurusan & Repositori SIMPATTI Prodi Teknik Informatika',
            objectiveEvidence: 'Wawancara Kaprodi dan pemeriksaan folder dokumen kurikulum 2024/2025 tidak memuat SK kebijakan penyusunan kurikulum.',
            reference: 'Permendikbudristek No. 53 Tahun 2023 & Standar Isi SPMI UNPATTI Butir 1.1',
            correction: 'Menginventarisasi aturan akademik universitas dan menyusun SK Pedoman Kurikulum Prodi.',
            action: 'Menjadwalkan audit tinjauan kurikulum tahunan dalam kalender akademik prodi.',
          },
    },
    'ind-1-2': {
      c: 4,
      t: 6,
      akar: 'Belum optimalnya penjadwalan dan mekanisme undangan resmi bagi seluruh elemen stakeholder eksternal (khususnya alumni dan asosiasi profesi APTIKOM/maritim).',
      ptk: 'Menyelenggarakan Lokakarya Peninjauan Kurikulum dengan mengundang minimal 5 unsur pemangku kepentingan lengkap dengan berita acara.',
      pic: 'Sekretaris Jurusan & Koordinator Kurikulum',
      wPtk: '2026-02-20',
      wMonev: '2026-04-10',
      link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-2',
      realisasi: '',
      monev: 'Open',
      plor: {
        problem: 'Pelibatan pemangku kepentingan baru mencakup 3 unsur (dosen, mahasiswa, pengguna lokal), belum melibatkan asosiasi profesi dan alumni lintas angkatan.',
        location: 'Dokumen Berita Acara Lokakarya Kurikulum Tahun 2024',
        objectiveEvidence: 'Daftar hadir lokakarya menunjukkan ketiadaan perwakilan asosiasi profesi dan pakar eksternal.',
        reference: 'Standar Isi SPMI UNPATTI Butir 1.2',
        correction: 'Mengirimkan surat permohonan review kurikulum kepada asosiasi profesi dan ikatan alumni.',
        action: 'Menetapkan SOP pelibatan minimal 5 unsur pemangku kepentingan dalam setiap revisi kurikulum.',
      },
    },
    'ind-1-3': {
      c: 6,
      t: 7,
      akar: 'Faktor Penunjang: Program studi telah memiliki tim kendali mutu yang aktif melakukan monitoring evaluasi kurikulum setiap akhir semester.',
      link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-3',
    },
    'ind-1-4': { c: 6, t: 7, link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-4' },
    'ind-1-5': { c: 7, t: 7, link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-5' },
    'ind-1-6': {
      c: 5,
      t: 6,
      akar: 'Matriks pemetaan antara profil lulusan, CPL, dan bahan kajian beberapa mata kuliah pilihan belum diperbarui mengikuti kurikulum OBE terbaru.',
      ptk: 'Memutakhirkan matriks kesesuaian CPL-Profil Lulusan untuk seluruh mata kuliah pilihan semester 5–7.',
      pic: 'Tim Kurikulum OBE Prodi',
      wPtk: '2026-01-25',
      wMonev: '2026-03-01',
      link: 'https://drive.google.com/drive/folders/simpatti-unpatti-std1-6',
      realisasi: 'https://drive.google.com/file/d/matriks-obe-revisi-2026',
      tglSelesai: '2026-01-20',
      monev: 'Closed - Verified',
    },
    'ind-1-7': {
      c: 4,
      t: 6,
      akar: 'Dokumen analisis kesesuaian kurikulum terhadap perkembangan IPTEKS dan kebutuhan masyarakat kepulauan Maluku belum terdokumentasi terstruktur.',
      ptk: 'Menyusun laporan kajian kebutuhan IPTEKS & DUDI Maluku sebagai lampiran resmi naskah akademik kurikulum.',
      pic: 'Tim Penyusun Kurikulum',
      wPtk: '2026-02-15',
      wMonev: '2026-03-30',
      monev: 'Open',
    },
    'ind-1-8': {
      c: 5,
      t: 6,
      akar: 'Sebagian kecil mata kuliah umum belum menautkan indikator pencapaian kompetensi profesional spesifik prodi.',
      ptk: 'Menyelaraskan deskripsi silabus mata kuliah pendukung terhadap CPL profesional Prodi.',
      pic: 'Koordinator Bidang Minat',
      wPtk: '2026-02-28',
      wMonev: '2026-04-15',
      monev: 'In Progress',
    },
    'ind-1-9': { c: 6, t: 7 },
    'ind-1-10': {
      c: 5,
      t: 7,
      akar: 'Sebanyak 14% mata kuliah belum mengunggah RPS versi OBE terbaru dan modul praktikum di sistem SIAKAD/LMS UNPATTI.',
      ptk: 'Mewajibkan seluruh dosen pengampu mengunggah RPS OBE, SAP, dan Modul Ajar ke SIAKAD sebelum perkuliahan dimulai.',
      pic: 'Gugus Jaminan Mutu (GJM) Prodi',
      wPtk: '2026-01-15',
      wMonev: '2026-02-10',
      link: 'https://siakad.unpatti.ac.id/rps-repository',
      realisasi: '94% RPS telah terunggah di SIAKAD per 12 Januari 2026',
      tglSelesai: '2026-01-14',
      monev: 'Closed - Verified',
    },

    // Standar 2
    'ind-2-1': { c: 7, t: 7 },
    'ind-2-2': { c: 6, t: 7 },
    'ind-2-3': { c: 6, t: 7 },
    'ind-2-4': { c: 6, t: 7 },
    'ind-2-5': { c: 7, t: 7 },
    'ind-2-6': {
      c: 4,
      t: 6,
      akar: 'Frekuensi kuliah tamu dari praktisi industri teknologi/maritim baru terlaksana 1 kali dalam 2 semester terakhir akibat keterbatasan skema anggaran.',
      ptk: 'Menjadwalkan program Praktisi Mengajar / Kuliah Umum daring maupun luring minimal 2 kali setiap semester.',
      pic: 'Kaprodi & Koordinator Kerja Sama',
      wPtk: '2026-03-01',
      wMonev: '2026-05-01',
      monev: 'Open',
    },
    'ind-2-7': { c: 5, t: 6 },
    'ind-2-8': { c: 6, t: 7 },
    'ind-2-9': {
      c: 5,
      t: 7,
      akar: 'Rekapitulasi monitoring kehadiran dosen di atas 14 pertemuan sudah berjalan di SIAKAD, namun berita acara tindak lanjut perkuliahan yang kurang pertemuan belum rutin dibuat.',
      ptk: 'Menerbitkan berita acara evaluasi kehadiran tengah semester (minggu ke-7) dan akhir semester (minggu ke-15).',
      pic: 'Admin Akademik Prodi & GJM',
      wPtk: '2026-02-10',
      wMonev: '2026-04-01',
      monev: 'In Progress',
    },
    'ind-2-10': { c: 7, t: 7 },
    'ind-2-11': { c: 5, t: 6 },
    'ind-2-12': { c: 6, t: 7 },
    'ind-2-13': { c: 6, t: 7 },
    'ind-2-14': { c: 6, t: 7 },
    'ind-2-15': { c: 6, t: 7 },
    'ind-2-16': { c: 6, t: 7 },

    // Standar 3
    'ind-3-1': { c: 7, t: 7 },
    'ind-3-2': { c: 6, t: 7 },
    'ind-3-3': { c: 5, t: 6 },
    'ind-3-4': { c: 6, t: 7 },
    'ind-3-5': { c: 6, t: 7 },
    'ind-3-6': {
      c: 4,
      t: 6,
      akar: 'Rata-rata masa studi lulusan 3 tahun terakhir masih 4,6 tahun karena hambatan penyelesaian skripsi pada mahasiswa tingkat akhir.',
      ptk: 'Membentuk klinik percepatan tugas akhir & sistem monitoring progres bimbingan skripsi berbasis milestone semester 7–8.',
      pic: 'Koordinator Tugas Akhir & Dosen PA',
      wPtk: '2026-02-28',
      wMonev: '2026-06-30',
      monev: 'In Progress',
    },
    'ind-3-7': { c: 5, t: 6 },
    'ind-3-8': {
      c: isIlmuKelautan ? 6 : 2,
      t: isIlmuKelautan ? 7 : 5,
      akar: isIlmuKelautan
        ? 'Sistem monitoring studi mahasiswa berjalan efektif setiap semester.'
        : 'Belum tersedia instrumen evaluasi dan intervensi dini bagi mahasiswa semester > 8 serta belum ada mekanisme portofolio pemenuhan CPL sebelum yudisium.',
      ptk: isIlmuKelautan
        ? ''
        : 'Membangun SOP Evaluasi Kelulusan Tepat Waktu dan Portofolio Ketercapaian CPL sebagai syarat pendaftaran yudisium Prodi.',
      pic: 'Kaprodi & GJM Prodi',
      wPtk: '2026-01-31',
      wMonev: '2026-03-20',
      monev: 'Open',
      plor: isIlmuKelautan
        ? {}
        : {
            problem: 'Tidak ditemukan SOP intervensi dini kelulusan tepat waktu maupun rekapitulasi portofolio CPL mahasiswa calon lulusan.',
            location: 'Dokumen Yudisium & Bimbingan Akademik Program Studi',
            objectiveEvidence: 'Data kelulusan TS menunjukkan 38% lulusan menempuh masa studi > 4,5 tahun tanpa catatan peringatan dini PA.',
            reference: 'Standar Kompetensi Lulusan SPMI UNPATTI Butir 3.8',
            correction: 'Menetapkan daftar mahasiswa berisiko terlambat studi dan menugaskan pembimbing pendamping.',
            action: 'Mengintegrasikan cek ketercapaian CPL ke dalam checklist prasyarat ujian skripsi.',
          },
    },
    'ind-3-9': { c: 6, t: 7 },
    'ind-3-10': { c: 5, t: 6 },
    'ind-3-11': {
      c: 3,
      t: 5,
      akar: 'Tingkat partisipasi respon alumni pada Tracer Study tahun terakhir baru mencapai 26% karena basis data kontak alumni belum terbarukan.',
      ptk: 'Melakukan pemutakhiran database alumni 5 angkatan terakhir bersama Himpunan Alumni dan mewajibkan pengisian data kontak saat legalisir ijazah.',
      pic: 'Tim Tracer Study Prodi',
      wPtk: '2026-02-28',
      wMonev: '2026-05-15',
      monev: 'Open',
    },

    // Standar 4
    'ind-4-1': { c: 6, t: 7 },
    'ind-4-2': { c: 6, t: 7 },
    'ind-4-3': {
      c: 4,
      t: 6,
      akar: 'Proporsi dosen dengan jabatan fungsional Lektor Kepala dan Guru Besar masih di bawah 20% karena beberapa dosen baru menyelesaikan studi S3.',
      ptk: 'Membentuk tim pendampingan kenaikan jabatan akademik (Lektor Kepala & Guru Besar) serta target publikasi Scopus.',
      pic: 'Ketua Jurusan & Wakil Dekan II',
      wPtk: '2026-04-30',
      wMonev: '2026-07-15',
      monev: 'Open',
    },
    'ind-4-4': { c: 6, t: 7 },
    'ind-4-5': { c: 6, t: 7 },
    'ind-4-6': { c: 6, t: 7 },
    'ind-4-7': { c: 5, t: 6 },
    'ind-4-8': { c: 5, t: 6 },
    'ind-4-9': {
      c: 4,
      t: 6,
      akar: 'Sebagian tenaga kependidikan administrasi dan teknisi laboratorium belum memiliki sertifikat kompetensi teknis di bidangnya.',
      ptk: 'Mengusulkan pelatihan dan uji sertifikasi kompetensi bagi laboran dan tenaga administrasi prodi.',
      pic: 'Kasubbag TU Fakultas & Kaprodi',
      wPtk: '2026-03-30',
      wMonev: '2026-06-01',
      monev: 'Open',
    },
    'ind-4-10': { c: 6, t: 7 },
    'ind-4-11': { c: 5, t: 6 },
    'ind-4-12': { c: 4, t: 5 },

    // Standar 5
    'ind-5-1': { c: 7, t: 7 },
    'ind-5-2': { c: 6, t: 7 },
    'ind-5-3': { c: 6, t: 7 },
    'ind-5-4': { c: 5, t: 6 },
    'ind-5-5': {
      c: 4,
      t: 6,
      akar: 'Jalur landai (ramp) akses disabilitas dan penanda jalur evakuasi K3 di beberapa koridor laboratorium lantai 2 belum lengkap.',
      ptk: 'Mengajukan pengadaan rambu K3, APAR terkalibrasi, dan perbaikan akses ramah disabilitas pada RKT Fakultas.',
      pic: 'Wakil Dekan II & Koordinator Lab',
      wPtk: '2026-03-15',
      wMonev: '2026-05-30',
      monev: 'In Progress',
    },
    'ind-5-6': { c: 6, t: 7 },

    // Standar 6
    'ind-6-1': { c: 6, t: 7 },
    'ind-6-2': { c: 6, t: 7 },
    'ind-6-3': { c: 5, t: 7 },
    'ind-6-4': { c: 6, t: 7 },
    'ind-6-5': {
      c: 4,
      t: 6,
      akar: 'Instrumen survei kepuasan layanan manajemen prodi terhadap tendik dan dosen belum dianalisis per butir layanan untuk rencana perbaikan tahun berikutnya.',
      ptk: 'Menyusun laporan analisis survei kepuasan sivitas akademika beserta rencana tindak lanjut (RTL) semesteran.',
      pic: 'GJM Prodi',
      wPtk: '2026-02-20',
      wMonev: '2026-04-10',
      monev: 'Open',
    },

    // Standar 7
    'ind-7-1': {
      c: 3,
      t: 5,
      akar: 'Alokasi dana operasional praktikum dan pengembangan inovasi mahasiswa di tingkat Prodi masih terbatas dan belum memenuhi rasio standar ideal.',
      ptk: 'Menyusun usulan RKAT berbasis kebutuhan riil praktikum dan riset mahasiswa untuk tahun anggaran berikutnya.',
      pic: 'Kaprodi & Bendahara Pengelola Fakultas',
      wPtk: '2026-03-01',
      wMonev: '2026-05-01',
      monev: 'Open',
    },
    'ind-7-2': {
      c: 3,
      t: 5,
      akar: 'Realisasi dana penelitian internal mandiri dan PkM per dosen tetap masih perlu ditingkatkan.',
      ptk: 'Meningkatkan pendampingan penyusunan proposal hibah internal UNPATTI dan DRTPM Kemdiktisaintek.',
      pic: 'Koordinator Penelitian & PkM Prodi',
      wPtk: '2026-03-15',
      wMonev: '2026-06-15',
      monev: 'Open',
    },
    'ind-7-3': { c: 5, t: 6 },
    'ind-7-4': {
      c: 4,
      t: 6,
      akar: 'Pendapatan dari skema kerja sama/hibah eksternal baru berasal dari 1 mitra pemerintah daerah.',
      ptk: 'Memperluas kemitraan riset terapan dan pelatihan dengan BUMN/DUDI di kawasan Indonesia Timur.',
      pic: 'Kaprodi & Tim Kerja Sama',
      wPtk: '2026-04-30',
      wMonev: '2026-07-01',
      monev: 'Open',
    },

    // Standar 8
    'ind-8-1': { c: 6, t: 7 },
    'ind-8-2': { c: 6, t: 7 },
    'ind-8-3': { c: 6, t: 7 },
    'ind-8-4': {
      c: 5,
      t: 6,
      akar: 'Review validasi soal ujian oleh Kelompok Bidang Keahlian (KBK) baru berjalan pada 65% mata kuliah inti.',
      ptk: 'Menerapkan formulir telaah soal UTS/UAS berbasis CPMK oleh koordinator KBK sebelum ujian dilaksanakan.',
      pic: 'Koordinator KBK & GJM Prodi',
      wPtk: '2026-02-01',
      wMonev: '2026-03-15',
      realisasi: 'Formulir telaah soal UTS Genap 2025/2026 telah diedarkan ke seluruh KBK',
      tglSelesai: '2026-01-28',
      monev: 'Closed - Verified',
    },
    'ind-8-5': { c: 6, t: 7 },

    // Standar 9
    'ind-9-1': { c: 6, t: 7 },
    'ind-9-2': { c: 6, t: 7 },
    'ind-9-3': {
      c: 5,
      t: 7,
      akar: 'Publikasi dosen pada jurnal internasional bereputasi Q1/Q2 dan pendaftaran paten/HKI perlu didorong lebih konsisten.',
      ptk: 'Menyelenggarakan klinik manuskrip ilmiah dan pengajuan HKI perangkat lunak/produk riset dosen-mahasiswa.',
      pic: 'Koordinator Riset Prodi',
      wPtk: '2026-04-15',
      wMonev: '2026-06-30',
      monev: 'In Progress',
    },
    'ind-9-4': { c: 6, t: 7 },
    'ind-9-5': { c: 7, t: 7 },

    // Standar 10
    'ind-10-1': { c: 6, t: 7 },
    'ind-10-2': { c: 5, t: 6 },
    'ind-10-3': {
      c: 4,
      t: 6,
      akar: 'Dokumentasi pengukuran dampak jangka menengah kegiatan PkM terhadap peningkatan kapasitas mitra pesisir Maluku belum terdokumentasi sistematis.',
      ptk: 'Membuat instrumen evaluasi dampak mitra pasca-PkM dan mewajibkan luaran publikasi/TTG pada setiap kegiatan PkM.',
      pic: 'Koordinator PkM Prodi',
      wPtk: '2026-03-30',
      wMonev: '2026-06-01',
      monev: 'Open',
    },
    'ind-10-4': { c: 5, t: 6 },
    'ind-10-5': { c: 5, t: 6 },
  };

  const result: Record<string, AmiEvaluation> = {};

  AMI_INDICATORS.forEach((ind, indIdx) => {
    const preset = presetScores[ind.id];

    // Deterministic prodi quality profile & cycle wave for realistic 4-cluster & Top-10 differentiation
    const profileMod = (suffixNum * 13 + 5) % 10;
    const isDipYear =
      !isInformatika &&
      !isIlmuKelautan &&
      ((suffixNum % 6 === 2 && startYear === 2025) ||
        (suffixNum % 7 === 4 && startYear === 2024) ||
        (suffixNum % 8 === 3 && startYear === 2026) ||
        (suffixNum % 9 === 5 && startYear === 2028));
    const isPembinaanProfile =
      !isInformatika && !isIlmuKelautan && profileMod <= 1;
    const isUnggulProfile =
      !isInformatika && !isIlmuKelautan && profileMod >= 7 && !isDipYear;

    // Fine-grained program strength tier (0..5) for natural Top 10 separation
    const strengthHash = (suffixNum * 17 + startYear * 3) % 11;
    const unggulBonus =
      isUnggulProfile &&
      (indIdx + suffixNum) % (3 + (strengthHash % 4)) === 0
        ? 1
        : 0;

    const prodiBump =
      isInformatika || isIlmuKelautan
        ? 0
        : isUnggulProfile
        ? (strengthHash >= 7 ? 1 : 0) + unggulBonus - ((indIdx + suffixNum) % 7 === 0 ? 1 : 0)
        : isPembinaanProfile
        ? -2 + ((suffixNum + indIdx) % 3 === 0 ? 1 : 0)
        : ((suffixNum * 7 + indIdx * 3) % 3) - 1;

    const dipShift = isDipYear ? -2 : 0;
    const rawBase = preset?.c ?? (isIlmuKelautan ? 6 : 5);
    // Keep Unggul programs nuanced (not uniformly hitting 7 on every indicator)
    const normalizedBase =
      isUnggulProfile && !isIlmuKelautan && rawBase >= 6 && (indIdx + strengthHash) % 4 !== 0
        ? 6
        : rawBase;
    const baseCapaian = Math.min(
      7,
      Math.max(1, normalizedBase + prodiBump + dipShift)
    ) as RubricLevelKey;
    const futureBoost =
      startYear > 2025 && !isDipYear && !isPembinaanProfile && (indIdx + suffixNum + startYear) % 6 === 0
        ? 1
        : 0;
    const adjustedCapaian = Math.min(
      7,
      Math.max(
        1,
        baseCapaian + (startYear < 2025 && baseCapaian > 2 ? yearDelta : futureBoost)
      )
    ) as RubricLevelKey;
    const defaultTarget: RubricLevelKey = 7;

    const isPastCycle = startYear < 2025;
    const defaultMonev = isPastCycle
      ? isPembinaanProfile && indIdx % 3 === 0
        ? 'In Progress'
        : 'Closed - Verified'
      : isPembinaanProfile || isDipYear
      ? 'Open'
      : isUnggulProfile && indIdx % 2 === 0
      ? 'Closed - Verified'
      : 'Open';
    const finalMonev =
      isPastCycle && !isPembinaanProfile
        ? 'Closed - Verified'
        : preset?.monev && !isDipYear && !isPembinaanProfile
        ? preset.monev
        : defaultMonev;

    const workflowStatus =
      finalMonev === 'Closed - Verified'
        ? 'Terverifikasi Auditor (Closed-Verified)'
        : finalMonev === 'In Progress'
        ? 'Disetujui Dekan (Siap Monev)'
        : preset?.ptk
        ? 'Menunggu Persetujuan Dekan'
        : 'Draft Prodi';

    result[ind.id] = {
      indicator_id: ind.id,
      nilai_capaian: adjustedCapaian,
      target_1_yr: preset?.t ?? defaultTarget,
      kategori_override: null,
      akar_masalah: preset?.akar ?? '',
      plor_ca: {
        ...EMPTY_PLOR,
        ...(preset?.plor ?? {}),
      },
      ptk_rtl: preset?.ptk ?? '',
      pic: preset?.pic ?? '',
      waktu_ptk: preset?.wPtk ?? '',
      waktu_monev: preset?.wMonev ?? '',
      bukti_link: preset?.link ?? '',
      bukti_realisasi:
        preset?.realisasi ??
        (isPastCycle && preset?.ptk
          ? `Tindak lanjut siklus ${cycleYear} telah diverifikasi LPMPP`
          : ''),
      tanggal_penyelesaian:
        preset?.tglSelesai ?? (isPastCycle && preset?.ptk ? `${startYear + 1}-01-15` : ''),
      monev_status: finalMonev,
      ptk_workflow_status: workflowStatus,
      dekan_approved_by:
        workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
        workflowStatus === 'Terverifikasi Auditor (Closed-Verified)'
          ? 'Dekan Fakultas (Persetujuan Awal Siklus)'
          : undefined,
      dekan_approved_at:
        workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
        workflowStatus === 'Terverifikasi Auditor (Closed-Verified)'
          ? `${startYear + 1}-02-10`
          : undefined,
    };
  });

  return result;
}
