import {
  JenisProdi,
  PeringkatAkreditasi,
  StudyProgramIdentity,
} from '../types/ami';

interface CompactProdiSpec {
  idSuffix: number;
  kode_ps: string;
  fakultas: string;
  pengelola: string;
  jurusan: string;
  nama_prodi: string;
  jenis: JenisProdi;
  akreditasi: PeringkatAkreditasi;
  expired: string;
  mhs: number;
  lulusan: number;
  dosen: number;
  dekan: string;
  dekan_nip: string;
  alamat_unit?: string;
}

const FAC_DEANS: Record<
  string,
  { nama: string; nip: string; alamat: string; emailDomain: string }
> = {
  'Fakultas Teknik': {
    nama: 'Prof. Dr. Ir. Pieter Th. Berhitu, M.T.',
    nip: '196608121992031003',
    alamat: 'Gedung Fakultas Teknik, Kampus Poka, Ambon 97233',
    emailDomain: 'fatek.unpatti.ac.id',
  },
  'Fakultas Perikanan dan Ilmu Kelautan': {
    nama: 'Prof. Dr. Yoisye Lopulalan, S.Pi., M.Si.',
    nip: '196903141995122001',
    alamat: 'Gedung FPIK, Kampus Poka, Ambon 97233',
    emailDomain: 'fpik.unpatti.ac.id',
  },
  'Fakultas Keguruan dan Ilmu Pendidikan': {
    nama: 'Prof. Dr. Izaak H. Wenno, S.Pd., M.Pd.',
    nip: '197005111997021001',
    alamat: 'Gedung FKIP, Kampus Poka, Ambon 97233',
    emailDomain: 'fkip.unpatti.ac.id',
  },
  'Fakultas Hukum': {
    nama: 'Prof. Dr. Hendrik Salmon, S.H., M.H.',
    nip: '196504181990031002',
    alamat: 'Gedung Fakultas Hukum, Kampus Poka, Ambon 97233',
    emailDomain: 'fh.unpatti.ac.id',
  },
  'Fakultas Ekonomi dan Bisnis': {
    nama: 'Prof. Dr. Teddy Christianto Leasiwal, S.E., M.Si.',
    nip: '197409102000031001',
    alamat: 'Gedung FEB, Kampus Poka, Ambon 97233',
    emailDomain: 'feb.unpatti.ac.id',
  },
  'Fakultas Ilmu Sosial dan Ilmu Politik': {
    nama: 'Dr. Wahab Tuanaya, M.Si.',
    nip: '196811041994031002',
    alamat: 'Gedung FISIP, Kampus Poka, Ambon 97233',
    emailDomain: 'fisip.unpatti.ac.id',
  },
  'Fakultas Pertanian': {
    nama: 'Prof. Dr. Ir. August E. Pattiselanno, M.Si.',
    nip: '196408191989031003',
    alamat: 'Gedung Fakultas Pertanian, Kampus Poka, Ambon 97233',
    emailDomain: 'faperta.unpatti.ac.id',
  },
  'Fakultas Sains dan Teknologi': {
    nama: 'Dr. Henry Junus Wattimanela, S.Si., M.Si.',
    nip: '197306152000121001',
    alamat: 'Gedung FST, Kampus Poka, Ambon 97233',
    emailDomain: 'fst.unpatti.ac.id',
  },
  'Fakultas Kedokteran': {
    nama: 'Dr. dr. Bertha Jean Que, Sp.S., M.Kes.',
    nip: '196702281998022001',
    alamat: 'Gedung Fakultas Kedokteran, Kampus Poka, Ambon 97233',
    emailDomain: 'fk.unpatti.ac.id',
  },
  Pascasarjana: {
    nama: 'Prof. Dr. Richard B. Luhulima, S.H., M.Hum.',
    nip: '196307121988031004',
    alamat: 'Gedung Pascasarjana UNPATTI, Jl. Dr. Tamaela, Ambon 97114',
    emailDomain: 'pasca.unpatti.ac.id',
  },
  'PSDKU Kab. Kepulauan Aru': {
    nama: 'Prof. Dr. Aholiab Watloly, S.Pak., M.Hum.',
    nip: '196210081989031002',
    alamat: 'Kampus PSDKU UNPATTI Kab. Kepulauan Aru, Dobo 97662',
    emailDomain: 'psdku-aru.unpatti.ac.id',
  },
  'PSDKU Kab. Maluku Barat Daya': {
    nama: 'Prof. Dr. Aholiab Watloly, S.Pak., M.Hum.',
    nip: '196210081989031002',
    alamat: 'Kampus PSDKU UNPATTI Kab. Maluku Barat Daya, Tiakur 97652',
    emailDomain: 'psdku-mbd.unpatti.ac.id',
  },
};

function makeSpec(
  idSuffix: number,
  kode_ps: string,
  fakultas: string,
  jurusan: string,
  nama_prodi: string,
  jenis: JenisProdi,
  akreditasi: PeringkatAkreditasi,
  mhs: number,
  dosen: number
): CompactProdiSpec {
  const fac = FAC_DEANS[fakultas];
  return {
    idSuffix,
    kode_ps,
    fakultas,
    pengelola: `Jurusan ${jurusan}`,
    jurusan,
    nama_prodi,
    jenis,
    akreditasi,
    expired: `202${(idSuffix % 4) + 6}-0${((idSuffix % 9) + 1)}-15`,
    mhs,
    lulusan: Math.max(8, Math.round(mhs * 0.19)),
    dosen,
    dekan: fac.nama,
    dekan_nip: fac.nip,
    alamat_unit: fac.alamat,
  };
}

// 118 Program Studi Universitas Pattimura (UNPATTI) — Kode PT 001021
const COMPACT_SPECS: CompactProdiSpec[] = [
  // Featured #1 & #2 (preserve IDs ...0001 and ...0002)
  makeSpec(1, '55201', 'Fakultas Teknik', 'Teknik Elektro dan Informatika', 'S1 Teknik Informatika', 'Non-Kependidikan', 'Baik Sekali', 342, 14),
  makeSpec(2, '54241', 'Fakultas Perikanan dan Ilmu Kelautan', 'Ilmu Kelautan', 'S1 Ilmu Kelautan', 'Non-Kependidikan', 'Unggul', 285, 18),

  // Fakultas Keguruan dan Ilmu Pendidikan (FKIP) — 28 Prodi (idSuffix 3..30)
  makeSpec(3, '88201', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan Bahasa dan Seni', 'S1 Pendidikan Bahasa Indonesia', 'Kependidikan', 'Unggul', 410, 22),
  makeSpec(4, '88203', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan Bahasa dan Seni', 'S1 Pendidikan Bahasa Inggris', 'Kependidikan', 'Unggul', 435, 24),
  makeSpec(5, '88204', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan Bahasa dan Seni', 'S1 Pendidikan Bahasa Jerman', 'Kependidikan', 'Baik Sekali', 165, 11),
  makeSpec(6, '84202', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan MIPA', 'S1 Pendidikan Matematika', 'Kependidikan', 'Unggul', 390, 21),
  makeSpec(7, '84205', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan MIPA', 'S1 Pendidikan Biologi', 'Kependidikan', 'Unggul', 380, 22),
  makeSpec(8, '84203', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan MIPA', 'S1 Pendidikan Fisika', 'Kependidikan', 'Baik Sekali', 240, 16),
  makeSpec(9, '84204', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan MIPA', 'S1 Pendidikan Kimia', 'Kependidikan', 'Baik Sekali', 255, 17),
  makeSpec(10, '84201', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan MIPA', 'S1 Pendidikan IPA', 'Kependidikan', 'Baik', 175, 10),
  makeSpec(11, '87203', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan IPS', 'S1 Pendidikan Ekonomi', 'Kependidikan', 'Baik Sekali', 320, 16),
  makeSpec(12, '87201', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan IPS', 'S1 Pendidikan Sejarah', 'Kependidikan', 'Unggul', 260, 15),
  makeSpec(13, '87202', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan IPS', 'S1 Pendidikan Geografi', 'Kependidikan', 'Baik Sekali', 245, 14),
  makeSpec(14, '87205', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan IPS', 'S1 Pendidikan Pancasila dan Kewarganegaraan', 'Kependidikan', 'Baik Sekali', 270, 15),
  makeSpec(15, '87204', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan IPS', 'S1 Pendidikan Akuntansi', 'Kependidikan', 'Baik Sekali', 210, 12),
  makeSpec(16, '86206', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Ilmu Pendidikan', 'S1 Pendidikan Guru Sekolah Dasar (PGSD)', 'Kependidikan', 'Unggul', 680, 32),
  makeSpec(17, '86207', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Ilmu Pendidikan', 'S1 Pendidikan Guru PAUD (PG-PAUD)', 'Kependidikan', 'Baik Sekali', 230, 13),
  makeSpec(18, '85201', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan Jasmani dan Olahraga', 'S1 Pendidikan Jasmani Kesehatan dan Rekreasi', 'Kependidikan', 'Baik Sekali', 360, 18),
  makeSpec(19, '86201', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Ilmu Pendidikan', 'S1 Bimbingan dan Konseling', 'Kependidikan', 'Baik Sekali', 295, 14),
  makeSpec(20, '86202', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Ilmu Pendidikan', 'S1 Pendidikan Luar Sekolah', 'Kependidikan', 'Baik', 160, 10),
  makeSpec(21, '86208', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Ilmu Pendidikan', 'S1 Manajemen Pendidikan', 'Kependidikan', 'Terakreditasi Pertama', 120, 8),
  makeSpec(22, '88101', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan Bahasa', 'S2 Pendidikan Bahasa Indonesia', 'Kependidikan', 'Baik Sekali', 68, 9),
  makeSpec(23, '88103', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan Bahasa', 'S2 Pendidikan Bahasa Inggris', 'Kependidikan', 'Baik Sekali', 74, 10),
  makeSpec(24, '84102', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan MIPA', 'S2 Pendidikan Matematika', 'Kependidikan', 'Baik Sekali', 62, 9),
  makeSpec(25, '84105', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan MIPA', 'S2 Pendidikan Biologi', 'Kependidikan', 'Unggul', 78, 11),
  makeSpec(26, '84104', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan MIPA', 'S2 Pendidikan Kimia', 'Kependidikan', 'Baik', 45, 7),
  makeSpec(27, '84103', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan MIPA', 'S2 Pendidikan Fisika', 'Kependidikan', 'Baik', 42, 7),
  makeSpec(28, '86104', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Ilmu Pendidikan', 'S2 Manajemen Pendidikan', 'Kependidikan', 'Unggul', 110, 12),
  makeSpec(29, '87103', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Magister Pendidikan IPS', 'S2 Pendidikan Ekonomi', 'Kependidikan', 'Baik', 52, 8),
  makeSpec(30, '86904', 'Fakultas Keguruan dan Ilmu Pendidikan', 'Pendidikan Profesi Guru', 'Profesi Pendidikan Profesi Guru (PPG)', 'Kependidikan', 'Unggul', 450, 28),

  // Fakultas Hukum (FH) — 5 Prodi (idSuffix 31..35)
  makeSpec(31, '74201', 'Fakultas Hukum', 'Ilmu Hukum', 'S1 Ilmu Hukum', 'Non-Kependidikan', 'Unggul', 1250, 56),
  makeSpec(32, '74101', 'Fakultas Hukum', 'Magister Ilmu Hukum', 'S2 Ilmu Hukum', 'Non-Kependidikan', 'Unggul', 190, 18),
  makeSpec(33, '74102', 'Fakultas Hukum', 'Magister Kenotariatan', 'S2 Kenotariatan', 'Non-Kependidikan', 'Baik', 85, 10),
  makeSpec(34, '74001', 'Fakultas Hukum', 'Doktor Ilmu Hukum', 'S3 Ilmu Hukum', 'Non-Kependidikan', 'Baik Sekali', 64, 14),
  makeSpec(35, '74205', 'Fakultas Hukum', 'Hukum Bisnis', 'S1 Hukum Bisnis', 'Non-Kependidikan', 'Terakreditasi Pertama', 95, 7),

  // Fakultas Ekonomi dan Bisnis (FEB) — 10 Prodi (idSuffix 36..45)
  makeSpec(36, '60201', 'Fakultas Ekonomi dan Bisnis', 'Ilmu Ekonomi dan Studi Pembangunan', 'S1 Ekonomi Pembangunan', 'Non-Kependidikan', 'Unggul', 520, 24),
  makeSpec(37, '61201', 'Fakultas Ekonomi dan Bisnis', 'Manajemen', 'S1 Manajemen', 'Non-Kependidikan', 'Unggul', 860, 34),
  makeSpec(38, '62201', 'Fakultas Ekonomi dan Bisnis', 'Akuntansi', 'S1 Akuntansi', 'Non-Kependidikan', 'Unggul', 740, 30),
  makeSpec(39, '61209', 'Fakultas Ekonomi dan Bisnis', 'Manajemen', 'S1 Bisnis Digital', 'Non-Kependidikan', 'Terakreditasi Pertama', 140, 8),
  makeSpec(40, '60101', 'Fakultas Ekonomi dan Bisnis', 'Magister Ilmu Ekonomi', 'S2 Ilmu Ekonomi', 'Non-Kependidikan', 'Baik Sekali', 82, 11),
  makeSpec(41, '61101', 'Fakultas Ekonomi dan Bisnis', 'Magister Manajemen', 'S2 Manajemen', 'Non-Kependidikan', 'Unggul', 145, 14),
  makeSpec(42, '62101', 'Fakultas Ekonomi dan Bisnis', 'Magister Akuntansi', 'S2 Akuntansi', 'Non-Kependidikan', 'Baik Sekali', 78, 10),
  makeSpec(43, '60001', 'Fakultas Ekonomi dan Bisnis', 'Doktor Ilmu Ekonomi', 'S3 Ilmu Ekonomi', 'Non-Kependidikan', 'Baik', 42, 11),
  makeSpec(44, '62901', 'Fakultas Ekonomi dan Bisnis', 'Akuntansi', 'Profesi Akuntan (PPAk)', 'Non-Kependidikan', 'Baik', 48, 8),
  makeSpec(45, '62401', 'Fakultas Ekonomi dan Bisnis', 'Akuntansi', 'D4 Akuntansi Sektor Publik', 'Non-Kependidikan', 'Terakreditasi', 110, 8),

  // Fakultas Ilmu Sosial dan Ilmu Politik (FISIP) — 9 Prodi (idSuffix 46..54)
  makeSpec(46, '63201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Ilmu Administrasi', 'S1 Ilmu Administrasi Publik', 'Non-Kependidikan', 'Unggul', 610, 25),
  makeSpec(47, '65201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Ilmu Pemerintahan', 'S1 Ilmu Pemerintahan', 'Non-Kependidikan', 'Unggul', 540, 22),
  makeSpec(48, '69201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Sosiologi', 'S1 Sosiologi', 'Non-Kependidikan', 'Baik Sekali', 420, 19),
  makeSpec(49, '70201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Ilmu Komunikasi', 'S1 Ilmu Komunikasi', 'Non-Kependidikan', 'Baik Sekali', 490, 18),
  makeSpec(50, '64201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Ilmu Politik', 'S1 Hubungan Internasional', 'Non-Kependidikan', 'Baik', 210, 10),
  makeSpec(51, '72201', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Sosiologi', 'S1 Kesejahteraan Sosial', 'Non-Kependidikan', 'Terakreditasi Pertama', 135, 8),
  makeSpec(52, '63101', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Magister Administrasi Publik', 'S2 Administrasi Publik', 'Non-Kependidikan', 'Unggul', 120, 13),
  makeSpec(53, '69101', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Magister Sosiologi', 'S2 Sosiologi', 'Non-Kependidikan', 'Baik Sekali', 65, 10),
  makeSpec(54, '65101', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Magister Ilmu Pemerintahan', 'S2 Ilmu Pemerintahan', 'Non-Kependidikan', 'Baik', 58, 9),

  // Fakultas Pertanian (FAPERTA) — 14 Prodi (idSuffix 55..68)
  makeSpec(55, '54211', 'Fakultas Pertanian', 'Budidaya Pertanian', 'S1 Agroteknologi', 'Non-Kependidikan', 'Unggul', 390, 26),
  makeSpec(56, '54201', 'Fakultas Pertanian', 'Sosial Ekonomi Pertanian', 'S1 Agribisnis', 'Non-Kependidikan', 'Unggul', 410, 24),
  makeSpec(57, '54231', 'Fakultas Pertanian', 'Peternakan', 'S1 Peternakan', 'Non-Kependidikan', 'Baik Sekali', 290, 20),
  makeSpec(58, '54251', 'Fakultas Pertanian', 'Kehutanan', 'S1 Kehutanan', 'Non-Kependidikan', 'Unggul', 340, 23),
  makeSpec(59, '41231', 'Fakultas Pertanian', 'Teknologi Hasil Pertanian', 'S1 Teknologi Hasil Pertanian', 'Non-Kependidikan', 'Baik Sekali', 235, 16),
  makeSpec(60, '54294', 'Fakultas Pertanian', 'Budidaya Pertanian', 'S1 Ilmu Tanah', 'Non-Kependidikan', 'Baik', 145, 12),
  makeSpec(61, '54202', 'Fakultas Pertanian', 'Sosial Ekonomi Pertanian', 'S1 Penyuluhan Pertanian', 'Non-Kependidikan', 'Baik', 165, 12),
  makeSpec(62, '54295', 'Fakultas Pertanian', 'Budidaya Pertanian', 'S1 Proteksi Tanaman', 'Non-Kependidikan', 'Baik', 130, 11),
  makeSpec(63, '54212', 'Fakultas Pertanian', 'Budidaya Pertanian', 'S1 Pemuliaan Tanaman', 'Non-Kependidikan', 'Baik', 115, 10),
  makeSpec(64, '54101', 'Fakultas Pertanian', 'Magister Ilmu Pertanian', 'S2 Ilmu Pertanian', 'Non-Kependidikan', 'Baik Sekali', 72, 12),
  makeSpec(65, '54151', 'Fakultas Pertanian', 'Magister Kehutanan', 'S2 Ilmu Kehutanan', 'Non-Kependidikan', 'Baik Sekali', 64, 11),
  makeSpec(66, '54102', 'Fakultas Pertanian', 'Magister Agribisnis', 'S2 Agribisnis', 'Non-Kependidikan', 'Baik', 58, 10),
  makeSpec(67, '54131', 'Fakultas Pertanian', 'Magister Peternakan', 'S2 Ilmu Peternakan', 'Non-Kependidikan', 'Baik', 46, 9),
  makeSpec(68, '54001', 'Fakultas Pertanian', 'Doktor Ilmu Pertanian', 'S3 Ilmu Pertanian', 'Non-Kependidikan', 'Baik', 38, 12),

  // Fakultas Perikanan dan Ilmu Kelautan (FPIK) — 10 Prodi tambahan (+ #2 = 11 Prodi) (idSuffix 69..78)
  makeSpec(69, '54242', 'Fakultas Perikanan dan Ilmu Kelautan', 'Manajemen Sumberdaya Perairan', 'S1 Manajemen Sumberdaya Perairan', 'Non-Kependidikan', 'Unggul', 270, 19),
  makeSpec(70, '54243', 'Fakultas Perikanan dan Ilmu Kelautan', 'Budidaya Perairan', 'S1 Budidaya Perairan (Akuakultur)', 'Non-Kependidikan', 'Unggul', 260, 18),
  makeSpec(71, '54244', 'Fakultas Perikanan dan Ilmu Kelautan', 'Pemanfaatan Sumberdaya Perikanan', 'S1 Perikanan Tangkap', 'Non-Kependidikan', 'Baik Sekali', 225, 16),
  makeSpec(72, '54245', 'Fakultas Perikanan dan Ilmu Kelautan', 'Teknologi Hasil Perikanan', 'S1 Teknologi Hasil Perikanan', 'Non-Kependidikan', 'Unggul', 240, 17),
  makeSpec(73, '54246', 'Fakultas Perikanan dan Ilmu Kelautan', 'Sosial Ekonomi Perikanan', 'S1 Agrobisnis Perikanan', 'Non-Kependidikan', 'Baik Sekali', 210, 14),
  makeSpec(74, '54141', 'Fakultas Perikanan dan Ilmu Kelautan', 'Magister Ilmu Kelautan', 'S2 Ilmu Kelautan', 'Non-Kependidikan', 'Unggul', 76, 13),
  makeSpec(75, '54142', 'Fakultas Perikanan dan Ilmu Kelautan', 'Magister Sumberdaya Perairan', 'S2 Manajemen Sumberdaya Perairan', 'Non-Kependidikan', 'Baik Sekali', 54, 11),
  makeSpec(76, '54145', 'Fakultas Perikanan dan Ilmu Kelautan', 'Magister Teknologi Hasil Perikanan', 'S2 Teknologi Hasil Perikanan', 'Non-Kependidikan', 'Baik', 42, 9),
  makeSpec(77, '54041', 'Fakultas Perikanan dan Ilmu Kelautan', 'Doktor Ilmu Kelautan', 'S3 Ilmu Kelautan', 'Non-Kependidikan', 'Baik Sekali', 44, 14),
  makeSpec(78, '54247', 'Fakultas Perikanan dan Ilmu Kelautan', 'Ilmu Kelautan', 'S1 Oseanografi Terapan', 'Non-Kependidikan', 'Terakreditasi Pertama', 88, 7),

  // Fakultas Teknik (FATEK) — 11 Prodi tambahan (+ #1 = 12 Prodi) (idSuffix 79..89)
  makeSpec(79, '21201', 'Fakultas Teknik', 'Teknik Mesin', 'S1 Teknik Mesin', 'Non-Kependidikan', 'Baik Sekali', 330, 18),
  makeSpec(80, '22201', 'Fakultas Teknik', 'Teknik Sipil', 'S1 Teknik Sipil', 'Non-Kependidikan', 'Unggul', 510, 25),
  makeSpec(81, '26201', 'Fakultas Teknik', 'Teknik Industri', 'S1 Teknik Industri', 'Non-Kependidikan', 'Baik Sekali', 370, 17),
  makeSpec(82, '36201', 'Fakultas Teknik', 'Teknik Perkapalan', 'S1 Teknik Perkapalan', 'Non-Kependidikan', 'Baik Sekali', 240, 15),
  makeSpec(83, '36202', 'Fakultas Teknik', 'Teknik Sistem Perkapalan', 'S1 Teknik Sistem Perkapalan', 'Non-Kependidikan', 'Baik Sekali', 220, 14),
  makeSpec(84, '20201', 'Fakultas Teknik', 'Teknik Elektro', 'S1 Teknik Elektro', 'Non-Kependidikan', 'Baik', 260, 13),
  makeSpec(85, '34201', 'Fakultas Teknik', 'Teknik Geologi', 'S1 Teknik Geologi', 'Non-Kependidikan', 'Baik Sekali', 245, 14),
  makeSpec(86, '33201', 'Fakultas Teknik', 'Teknik Geofisika', 'S1 Teknik Geofisika', 'Non-Kependidikan', 'Baik', 165, 10),
  makeSpec(87, '32201', 'Fakultas Teknik', 'Teknik Perminyakan', 'S1 Teknik Perminyakan', 'Non-Kependidikan', 'Baik', 190, 11),
  makeSpec(88, '24201', 'Fakultas Teknik', 'Teknik Kimia', 'S1 Teknik Kimia', 'Non-Kependidikan', 'Baik', 155, 10),
  makeSpec(89, '35201', 'Fakultas Teknik', 'Perencanaan Wilayah dan Kota', 'S1 Perencanaan Wilayah dan Kota', 'Non-Kependidikan', 'Baik', 180, 10),

  // Fakultas Sains dan Teknologi (FST / MIPA) — 12 Prodi (idSuffix 90..101)
  makeSpec(90, '44201', 'Fakultas Sains dan Teknologi', 'Matematika', 'S1 Matematika', 'Non-Kependidikan', 'Unggul', 230, 16),
  makeSpec(91, '45201', 'Fakultas Sains dan Teknologi', 'Fisika', 'S1 Fisika', 'Non-Kependidikan', 'Baik Sekali', 195, 15),
  makeSpec(92, '47201', 'Fakultas Sains dan Teknologi', 'Kimia', 'S1 Kimia', 'Non-Kependidikan', 'Unggul', 245, 18),
  makeSpec(93, '46201', 'Fakultas Sains dan Teknologi', 'Biologi', 'S1 Biologi', 'Non-Kependidikan', 'Unggul', 260, 19),
  makeSpec(94, '49201', 'Fakultas Sains dan Teknologi', 'Matematika', 'S1 Statistika', 'Non-Kependidikan', 'Baik Sekali', 275, 14),
  makeSpec(95, '55202', 'Fakultas Sains dan Teknologi', 'Ilmu Komputer', 'S1 Ilmu Komputer', 'Non-Kependidikan', 'Baik Sekali', 310, 15),
  makeSpec(96, '46202', 'Fakultas Sains dan Teknologi', 'Biologi', 'S1 Bioteknologi', 'Non-Kependidikan', 'Baik', 145, 10),
  makeSpec(97, '49203', 'Fakultas Sains dan Teknologi', 'Matematika', 'S1 Sains Data', 'Non-Kependidikan', 'Terakreditasi Pertama', 125, 8),
  makeSpec(98, '44101', 'Fakultas Sains dan Teknologi', 'Magister Matematika', 'S2 Matematika', 'Non-Kependidikan', 'Baik', 38, 8),
  makeSpec(99, '47101', 'Fakultas Sains dan Teknologi', 'Magister Kimia', 'S2 Kimia', 'Non-Kependidikan', 'Baik Sekali', 52, 10),
  makeSpec(100, '46101', 'Fakultas Sains dan Teknologi', 'Magister Biologi', 'S2 Biologi', 'Non-Kependidikan', 'Baik Sekali', 56, 11),
  makeSpec(101, '45101', 'Fakultas Sains dan Teknologi', 'Magister Fisika', 'S2 Fisika', 'Non-Kependidikan', 'Baik', 34, 8),

  // Fakultas Kedokteran (FK) — 5 Prodi (idSuffix 102..106)
  makeSpec(102, '11201', 'Fakultas Kedokteran', 'Pendidikan Dokter', 'S1 Pendidikan Dokter', 'Non-Kependidikan', 'Baik Sekali', 520, 42),
  makeSpec(103, '11901', 'Fakultas Kedokteran', 'Pendidikan Dokter', 'Profesi Dokter', 'Non-Kependidikan', 'Baik Sekali', 280, 38),
  makeSpec(104, '48201', 'Fakultas Kedokteran', 'Farmasi', 'S1 Farmasi', 'Non-Kependidikan', 'Baik', 190, 12),
  makeSpec(105, '12201', 'Fakultas Kedokteran', 'Kedokteran Gigi', 'S1 Kedokteran Gigi', 'Non-Kependidikan', 'Terakreditasi Pertama', 95, 10),
  makeSpec(106, '13201', 'Fakultas Kedokteran', 'Ilmu Keperawatan', 'S1 Ilmu Keperawatan', 'Non-Kependidikan', 'Terakreditasi', 140, 11),

  // Pascasarjana Multidisiplin — 6 Prodi (idSuffix 107..112)
  makeSpec(107, '95101', 'Pascasarjana', 'Pengelolaan Sumberdaya Alam dan Lingkungan', 'S2 Pengelolaan Sumberdaya Alam dan Lingkungan', 'Non-Kependidikan', 'Baik Sekali', 68, 12),
  makeSpec(108, '95104', 'Pascasarjana', 'Pengelolaan Lahan', 'S2 Pengelolaan Lahan Kepulauan', 'Non-Kependidikan', 'Baik', 45, 9),
  makeSpec(109, '54149', 'Pascasarjana', 'Ilmu Kelautan', 'S2 Pengelolaan Sumberdaya Kelautan dan Pulau Kecil', 'Non-Kependidikan', 'Baik Sekali', 54, 11),
  makeSpec(110, '93102', 'Pascasarjana', 'Pariwisata Budaya', 'S2 Kajian Budaya dan Pariwisata Kepulauan', 'Non-Kependidikan', 'Terakreditasi', 42, 8),
  makeSpec(111, '95001', 'Pascasarjana', 'Pengelolaan Sumberdaya Alam', 'S3 Ilmu Lingkungan Kepulauan', 'Non-Kependidikan', 'Baik', 32, 11),
  makeSpec(112, '54009', 'Pascasarjana', 'Manajemen Sumberdaya Kepulauan', 'S3 Manajemen Sumberdaya Kepulauan', 'Non-Kependidikan', 'Baik Sekali', 36, 12),

  // PSDKU Kab. Kepulauan Aru — 3 Prodi (idSuffix 113..115)
  makeSpec(113, '86206-ARU', 'PSDKU Kab. Kepulauan Aru', 'Pendidikan Dasar PSDKU Aru', 'S1 PGSD (PSDKU Kepulauan Aru)', 'Kependidikan', 'Baik', 195, 9),
  makeSpec(114, '85201-ARU', 'PSDKU Kab. Kepulauan Aru', 'Penjaskesrek PSDKU Aru', 'S1 Penjaskesrek (PSDKU Kepulauan Aru)', 'Kependidikan', 'Baik', 140, 8),
  makeSpec(115, '62201-ARU', 'PSDKU Kab. Kepulauan Aru', 'Akuntansi PSDKU Aru', 'S1 Akuntansi (PSDKU Kepulauan Aru)', 'Non-Kependidikan', 'Baik', 155, 8),

  // PSDKU Kab. Maluku Barat Daya (MBD) — 3 Prodi (idSuffix 116..118)
  makeSpec(116, '86206-MBD', 'PSDKU Kab. Maluku Barat Daya', 'Pendidikan Dasar PSDKU MBD', 'S1 PGSD (PSDKU Maluku Barat Daya)', 'Kependidikan', 'Baik', 180, 9),
  makeSpec(117, '54231-MBD', 'PSDKU Kab. Maluku Barat Daya', 'Peternakan PSDKU MBD', 'S1 Peternakan (PSDKU Maluku Barat Daya)', 'Non-Kependidikan', 'Baik', 135, 8),
  makeSpec(118, '74201-MBD', 'PSDKU Kab. Maluku Barat Daya', 'Ilmu Hukum PSDKU MBD', 'S1 Ilmu Hukum (PSDKU Maluku Barat Daya)', 'Non-Kependidikan', 'Baik', 160, 8),
];

const KAPRODI_NAMES = [
  'Dr. Hendrik J. Wattimena, S.T., M.Kom.',
  'Dr. Ir. Maria S. Noya, M.Si.',
  'Dr. Juliana R. Tuasikal, M.Pd.',
  'Dr. Johanis Pattiiha, S.Pd., M.Pd.',
  'Dr. Nurhayati Latuconsina, S.H., M.H.',
  'Dr. Victor E. Tahapary, S.E., M.Si.',
  'Dr. Christina M. Siahaya, S.Sos., M.Si.',
  'Dr. Ir. Dominggus Malle, M.Sc.',
  'Dr. Freddy L. Hallatu, S.Si., M.Si.',
  'dr. Noviyanti Tuharea, M.Kes.',
  'Dr. Markus J. Pattinama, M.Si.',
  'Dr. Samuel A. Renjaan, M.Pd.',
];

function pad4(num: number): string {
  return String(num).padStart(4, '0');
}

function slugifyEmail(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(s1|s2|s3|d4|profesi)\s+/i, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 28);
}

function getDegreeCriteria(namaProdi: string) {
  if (namaProdi.startsWith('S3 ')) {
    return { sks: 42, ipk: 3.25, toefl: 500, syarat: 'Publikasi Jurnal Internasional Bereputasi (Scopus/WoS) & Ujian Disertasi' };
  }
  if (namaProdi.startsWith('S2 ')) {
    return { sks: 36, ipk: 3.0, toefl: 475, syarat: 'Publikasi Jurnal Nasional Terakreditasi SINTA & Ujian Tesis' };
  }
  if (namaProdi.startsWith('Profesi')) {
    return { sks: 36, ipk: 3.0, toefl: 450, syarat: 'Lulus Uji Kompetensi Profesi Nasional (UKOM)' };
  }
  return { sks: 144, ipk: 2.75, toefl: 450, syarat: 'Lulus Ujian Skripsi / Tugas Akhir & Sertifikat Kompetensi Pendukung' };
}

export const UNPATTI_118_PROGRAMS: StudyProgramIdentity[] = COMPACT_SPECS.map(
  (spec) => {
    const fac = FAC_DEANS[spec.fakultas];
    const id = `22222222-2222-2222-2222-22222222${pad4(spec.idSuffix)}`;
    const criteria = getDegreeCriteria(spec.nama_prodi);
    const emailUser = slugifyEmail(spec.nama_prodi);

    // Preserve bespoke rich profiles for featured #1 and #2
    const isInformatika = spec.idSuffix === 1;
    const isIlmuKelautan = spec.idSuffix === 2;

    const visiDefault = isInformatika
      ? 'Menjadi Program Studi Teknik Informatika yang unggul dalam rekayasa sistem cerdas dan komputasi kepulauan berbasis kearifan lokal Maluku pada tahun 2030.'
      : isIlmuKelautan
      ? 'Menjadi pusat unggulan pendidikan dan riset ilmu kelautan tropis kepulauan yang berdaya saing internasional sesuai sesanti Bina Mulia ke Lautan.'
      : `Menjadi program studi ${spec.nama_prodi} yang unggul, berkarakter kepulauan, dan berdaya saing nasional menuju kawasan Indo-Pasifik pada tahun 2030.`;

    const misiDefault = isInformatika
      ? '1. Menyelenggarakan pendidikan tinggi informatika berbasis Outcome-Based Education (OBE) yang adaptif terhadap transformasi digital.\n2. Mengembangkan penelitian inovatif di bidang kecerdasan buatan, sistem terdistribusi, dan keamanan siber kepulauan.\n3. Melaksanakan pengabdian kepada masyarakat melalui penerapan teknologi tepat guna bagi pemerintah daerah dan masyarakat pesisir Maluku.'
      : isIlmuKelautan
      ? '1. Menyelenggarakan pendidikan kelautan tropis berbasis riset lapangan laut dalam dan pesisir.\n2. Menghasilkan publikasi bereputasi tinggi di bidang oseanografi, ekologi terumbu karang, dan bioteknologi laut.\n3. Memberdayakan masyarakat pesisir Maluku melalui konservasi dan ekonomi biru berkelanjutan.'
      : `1. Menyelenggarakan pembelajaran bermutu berbasis OBE di bidang ${spec.jurusan} dengan kekhasan wilayah kepulauan.\n2. Menghasilkan riset terapan dan publikasi ilmiah yang berkontribusi pada pembangunan masyarakat Maluku.\n3. Memperluas jejaring kemitraan pendidikan, pemerintah daerah, dan DUDI secara berkelanjutan.`;

    const ploDefault = isInformatika
      ? 'PLO-1: Mampu menerapkan prinsip matematika, algoritma, dan rekayasa perangkat lunak modern.\nPLO-2: Mampu merancang arsitektur sistem informasi cerdas dan jaringan tangguh wilayah kepulauan.\nPLO-3: Mampu berkomunikasi efektif, bekerja kolaboratif lintas disiplin, dan menjunjung tinggi etika profesi.'
      : isIlmuKelautan
      ? 'PLO-1: Menguasai teori oseanografi, ekologi laut tropis, dan metode survei bawah air.\nPLO-2: Mampu merancang analisis spasial kelautan dan konservasi sumber daya pesisir.\nPLO-3: Mampu bekerja di lapangan laut dengan standar keselamatan dan etika ilmiah.'
      : `PLO-1: Menguasai konsep teoretis dan metodologi mutakhir bidang ${spec.nama_prodi}.\nPLO-2: Mampu merumuskan solusi permasalahan profesional secara analitis, etis, dan berbasis data kepulauan.\nPLO-3: Mampu berkolaborasi lintas disiplin, berkomunikasi efektif, dan belajar sepanjang hayat.`;

    const kaprodiName = isInformatika
      ? KAPRODI_NAMES[0]
      : isIlmuKelautan
      ? KAPRODI_NAMES[1]
      : KAPRODI_NAMES[(spec.idSuffix + 2) % KAPRODI_NAMES.length];

    const kaprodiNip = isInformatika
      ? '198104152008121002'
      : isIlmuKelautan
      ? '197609222005012001'
      : `197${(spec.idSuffix % 9)}0${((spec.idSuffix % 8) + 1)}15200${(spec.idSuffix % 9)}01100${(spec.idSuffix % 4) + 1}`;

    return {
      id,
      kode_pt: '001021',
      nama_pt: 'UNIVERSITAS PATTIMURA (UNPATTI)',
      alamat_pusat: 'Jl. Ir. M. Putuhena Kampus Poka, Ambon 97233',
      kode_pos: '97233',
      jenis_prodi: spec.jenis,
      fakultas: spec.fakultas,
      pengelola_pembelajaran: spec.pengelola,
      alamat_pengelola: spec.alamat_unit ?? fac.alamat,
      kode_ps: spec.kode_ps,
      nama_jurusan: spec.jurusan,
      nama_prodi: spec.nama_prodi,
      tanggal_pendirian: isInformatika
        ? '2014-06-12'
        : isIlmuKelautan
        ? '1998-04-21'
        : `${1985 + (spec.idSuffix % 36)}-0${((spec.idSuffix % 8) + 1)}-14`,
      no_sk_pendirian: isInformatika
        ? 'SK Mendikbud RI No. 184/E/O/2014'
        : isIlmuKelautan
        ? 'SK Dirjen Dikti No. 122/DIKTI/Kep/1998'
        : `SK Kemendikbud No. ${100 + spec.idSuffix}/E/O/${1995 + (spec.idSuffix % 28)}`,
      no_sk_operasional: `SK Rektor UNPATTI No. ${800 + spec.idSuffix}/UN13/SK/2023`,
      peringkat_akreditasi: spec.akreditasi,
      riwayat_akreditasi: {
        akreditasi_1: isInformatika
          ? 'C (2016 - BAN-PT)'
          : isIlmuKelautan
          ? 'B (2012 - BAN-PT)'
          : 'B (2015 - BAN-PT)',
        akreditasi_2: isInformatika
          ? 'B (2019 - BAN-PT)'
          : isIlmuKelautan
          ? 'A (2017 - BAN-PT)'
          : `${spec.akreditasi} (2020 - BAN-PT/LAM)`,
        akreditasi_3: `${spec.akreditasi} (2023/2024)`,
        akreditasi_4: '-',
        akreditasi_5: '-',
      },
      tanggal_kedaluwarsa_akreditasi: spec.expired,
      alamat_prodi: spec.alamat_unit ?? fac.alamat,
      email_prodi: isInformatika
        ? 'informatika@fatek.unpatti.ac.id'
        : isIlmuKelautan
        ? 'ilmu.kelautan@fpik.unpatti.ac.id'
        : `${emailUser}@${fac.emailDomain}`,
      telepon_prodi: `(0911) 322${String(400 + spec.idSuffix).slice(0, 3)}`,
      website_prodi: isInformatika
        ? 'https://informatika.unpatti.ac.id'
        : isIlmuKelautan
        ? 'https://fpik.unpatti.ac.id/ilmu-kelautan'
        : `https://${fac.emailDomain}/${emailUser}`,
      visi_prodi: visiDefault,
      misi_prodi: misiDefault,
      kompetensi_lulusan: ploDefault,
      kriteria_lulusan: {
        sks_minimal: criteria.sks,
        nilai_d_maksimal: 2,
        ipk_minimal: criteria.ipk,
        toefl_minimal: criteria.toefl,
        syarat_lainnya: isInformatika
          ? 'Lulus Uji Kompetensi Pemrograman & Publikasi Tugas Akhir'
          : isIlmuKelautan
          ? 'Sertifikat Selam Ilmiah (Scientific Diving) Dasar'
          : criteria.syarat,
      },
      jumlah_mahasiswa_ts: spec.mhs,
      jumlah_lulusan_ts: spec.lulusan,
      jumlah_dosen_homebase_ts: spec.dosen,
      jumlah_dosen_tetap_ts: spec.dosen,
      jumlah_dosen_tidak_tetap_ts: Math.max(1, Math.round(spec.dosen * 0.2)),
      tenaga_kependidikan: {
        s3: 0,
        s2: spec.idSuffix % 3,
        s1: 3 + (spec.idSuffix % 3),
        diploma: 1 + (spec.idSuffix % 3),
        sma: 1 + (spec.idSuffix % 2),
      },
      kaprodi_nama: kaprodiName,
      kaprodi_nip: kaprodiNip,
      kaprodi_hp: `0812-4700-${String(1000 + spec.idSuffix).slice(-4)}`,
      dekan_nama: spec.dekan,
      dekan_nip: spec.dekan_nip,
      tahun_siklus_ppepp: '2025/2026',
      tempat_pengesahan: 'Ambon',
      tahun_pengesahan: '2025',
    };
  }
);

export const UNPATTI_FACULTIES: string[] = Array.from(
  new Set(UNPATTI_118_PROGRAMS.map((p) => p.fakultas))
);
