export type Language = 'ID' | 'EN';

export const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ppepp_lang');
    if (saved === 'EN' || saved === 'ID') return saved;
  }
  return 'ID';
};

export const setStoredLanguage = (lang: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ppepp_lang', lang);
  }
};

const DICTIONARY: Record<string, Record<Language, string>> = {
  // Landing Card
  'landing.headline': {
    ID: 'Kendali Mutu Unpatti Dalam Satu Genggaman',
    EN: 'Unpatti Quality Control in One Hand',
  },
  'landing.desc': {
    ID: 'Wujudkan budaya mutu yang terukur, transparan, dan akuntabel melalui sistem digital PPEPP UNPATTI. Platform ini menghubungkan Kaprodi, Auditor AMI, Dekanat, hingga Pimpinan Universitas dalam satu alur kerja kolaboratif—memudahkan pengisian instrumen SPMI, analisis akar masalah, pemeringkatan klaster mutu, serta pencetakan dokumen resmi secara instan dan akurat.',
    EN: 'Realize a measurable, transparent, and accountable quality culture through the UNPATTI PPEPP digital system. This platform connects Study Program Heads, AMI Auditors, Deans, and University Leadership in a collaborative workflow—simplifying SPMI instrument completion, root cause analysis, quality cluster ranking, and official document printing instantly and accurately.',
  },
  'landing.unit': {
    ID: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran',
    EN: 'Institute for Quality Assurance and Learning Development',
  },
  'landing.tagline': {
    ID: '"Menggerakkan Budaya Mutu Universitas Pattimura Menuju World Class University"',
    EN: '"Driving Pattimura University Quality Culture Towards a World Class University"',
  },
  'landing.join': {
    ID: 'Join ke Aplikasi',
    EN: 'Enter Application',
  },
  'landing.badge': {
    ID: 'Sistem Penjaminan Mutu Internal (SPMI) Digital',
    EN: 'Digital Internal Quality Assurance System (SPMI)',
  },
  'landing.certified': {
    ID: 'Sistem Manajemen Mutu Akademik Terstandarisasi LPMPP UNPATTI',
    EN: 'Standardized Academic Quality Management System LPMPP UNPATTI',
  },

  // Login Screen
  'login.title': {
    ID: 'Masuk Modul Siklus PPEPP',
    EN: 'Sign In to PPEPP Cycle Module',
  },
  'login.subtitle': {
    ID: 'Sistem Penjaminan Mutu Internal Universitas Pattimura',
    EN: 'Internal Quality Assurance System of Pattimura University',
  },
  'login.campusTitle': {
    ID: 'PPEPP UNPATTI',
    EN: 'PPEPP UNPATTI',
  },
  'login.campusSub': {
    ID: 'Bina Mulia ke Lautan • Sistem Informasi PPEPP — LPMPP Universitas Pattimura',
    EN: 'Bina Mulia ke Lautan • PPEPP Information System — LPMPP Pattimura University',
  },
  'login.campusDesc': {
    ID: 'Platform terintegrasi PPEPP, AMI, RTM dan evaluasi efektifitas Implementasi SPMI Program Studi di Universitas Pattimura.',
    EN: 'Integrated platform for PPEPP, AMI, MRM, and SPMI implementation effectiveness evaluation for Study Programs at Pattimura University.',
  },
  'login.cardTitle': {
    ID: 'Masuk ke Sistem PPEPP Unpatti',
    EN: 'Sign In to Unpatti PPEPP System',
  },
  'login.cardSub': {
    ID: 'Gunakan Email dan Password resmi LPMPP Universitas Pattimura.',
    EN: 'Use official Pattimura University LPMPP Email and Password.',
  },
  'login.emailLabel': {
    ID: 'Email Institusi / Username',
    EN: 'Institutional Email / Username',
  },
  'login.emailPlaceholder': {
    ID: 'nama@unpatti.ac.id',
    EN: 'name@unpatti.ac.id',
  },
  'login.passwordLabel': {
    ID: 'Password Akun',
    EN: 'Account Password',
  },
  'login.passwordPlaceholder': {
    ID: 'Masukkan kata sandi akun Anda',
    EN: 'Enter your account password',
  },
  'login.submit': {
    ID: 'Masuk ke Sistem',
    EN: 'Sign In to System',
  },
  'login.verifying': {
    ID: 'Memverifikasi Sesi...',
    EN: 'Verifying Session...',
  },
  'login.emptyError': {
    ID: 'Masukkan Email dan Password akun PPEPP UNPATTI Anda.',
    EN: 'Please enter your UNPATTI PPEPP account Email and Password.',
  },
  'login.invalidError': {
    ID: 'Email atau password tidak sesuai. Silakan periksa kembali.',
    EN: 'Invalid email or password. Please verify your credentials.',
  },
  'login.backToLanding': {
    ID: 'Kembali ke Sambutan',
    EN: 'Back to Welcome',
  },

  // Navbar & Global App
  'nav.moduleTitle': {
    ID: 'Modul Siklus PPEPP',
    EN: 'PPEPP Cycle Module',
  },
  'nav.logout': {
    ID: 'Keluar',
    EN: 'Sign Out',
  },
  'nav.switchRole': {
    ID: 'Peran Pengguna',
    EN: 'User Role',
  },
  'nav.selectRole': {
    ID: 'Pilih Peran Pengguna',
    EN: 'Select User Role',
  },
  'nav.cycle': {
    ID: 'Tahun Siklus',
    EN: 'Cycle Year',
  },
  'nav.faculty': {
    ID: 'Fakultas / Unit',
    EN: 'Faculty / Unit',
  },
  'nav.program': {
    ID: 'Program Studi',
    EN: 'Study Program',
  },
  'nav.loadingSession': {
    ID: 'Memeriksa sesi autentikasi sistem...',
    EN: 'Verifying system authentication session...',
  },
  'nav.loadingData': {
    ID: 'Memuat data Program Studi, Indikator & Evaluasi...',
    EN: 'Loading Study Programs, Indicators & Evaluations...',
  },

  // Sidebar Stages
  'sidebar.title': {
    ID: 'Modul Siklus PPEPP',
    EN: 'PPEPP Cycle Modules',
  },
  'sidebar.search': {
    ID: 'Cari modul siklus...',
    EN: 'Search cycle modules...',
  },
  'sidebar.penetapan': {
    ID: '1. Penetapan Standar',
    EN: '1. Standard Setting',
  },
  'sidebar.pelaksanaan': {
    ID: '2. Pelaksanaan Standar',
    EN: '2. Standard Implementation',
  },
  'sidebar.evaluasi': {
    ID: '3. Evaluasi Standar',
    EN: '3. Standard Evaluation',
  },
  'sidebar.pengendalian': {
    ID: '4. Pengendalian Standar',
    EN: '4. Standard Control',
  },
  'sidebar.peningkatan': {
    ID: '5. Peningkatan Standar',
    EN: '5. Standard Improvement',
  },
  'sidebar.utilitas': {
    ID: 'Utilitas & Sistem',
    EN: 'Utilities & System',
  },

  // Tabs
  'tab.dashboard': {
    ID: '00. Dashboard PPEPP',
    EN: '00. PPEPP Dashboard',
  },
  'tab.identitas': {
    ID: '01. Identitas Prodi',
    EN: '01. Study Program Identity',
  },
  'tab.instrumen': {
    ID: '02. Instrumen Standar',
    EN: '02. Standard Instruments',
  },
  'tab.rekap': {
    ID: '03. Rekap & Analisis',
    EN: '03. Recap & Analysis',
  },
  'tab.laporan': {
    ID: '04. Laporan & Grafik',
    EN: '04. Reports & Charts',
  },
  'tab.temuan': {
    ID: '05. Daftar Temuan AMI',
    EN: '05. AMI Findings List',
  },
  'tab.ptk': {
    ID: '06. Formulir PTK / RTL',
    EN: '06. CAR / Follow-up Plan Form',
  },
  'tab.monev': {
    ID: '07. Monev PTK / RTL',
    EN: '07. CAR / Follow-up Monitoring',
  },
  'tab.panduan': {
    ID: '08. Panduan Penggunaan',
    EN: '08. User Guide',
  },
  'tab.perengkingan': {
    ID: '09. Perengkingan & Klasterisasi',
    EN: '09. Ranking & Clustering',
  },
  'tab.laporan_spmi': {
    ID: '10. Laporan AMI/RTM/Efektivitas',
    EN: '10. AMI/MRM/Effectiveness Reports',
  },
  'tab.manajemen': {
    ID: '11. Manajemen Pengguna & Sistem',
    EN: '11. User & System Management',
  },

  // Common Actions & Headers
  'common.search': {
    ID: 'Cari...',
    EN: 'Search...',
  },
  'common.save': {
    ID: 'Simpan',
    EN: 'Save',
  },
  'common.saving': {
    ID: 'Menyimpan...',
    EN: 'Saving...',
  },
  'common.saved': {
    ID: 'Tersimpan',
    EN: 'Saved',
  },
  'common.cancel': {
    ID: 'Batal',
    EN: 'Cancel',
  },
  'common.edit': {
    ID: 'Edit',
    EN: 'Edit',
  },
  'common.delete': {
    ID: 'Hapus',
    EN: 'Delete',
  },
  'common.download': {
    ID: 'Unduh',
    EN: 'Download',
  },
  'common.upload': {
    ID: 'Unggah File',
    EN: 'Upload File',
  },
  'common.print': {
    ID: 'Cetak / Pratinjau',
    EN: 'Print / Preview',
  },
  'common.refresh': {
    ID: 'Segarkan',
    EN: 'Refresh',
  },
  'common.filterAll': {
    ID: 'Semua',
    EN: 'All',
  },
  'common.allStandards': {
    ID: 'Semua Standar',
    EN: 'All Standards',
  },
  'common.allFaculties': {
    ID: 'Semua Fakultas / Unit',
    EN: 'All Faculties / Units',
  },
  'common.allPrograms': {
    ID: 'Semua Program Studi',
    EN: 'All Study Programs',
  },
  'common.status': {
    ID: 'Status',
    EN: 'Status',
  },
  'common.actions': {
    ID: 'Aksi',
    EN: 'Actions',
  },
  'common.indicators': {
    ID: 'Indikator',
    EN: 'Indicators',
  },
  'common.score': {
    ID: 'Skor Mutu',
    EN: 'Quality Score',
  },
  'common.achievement': {
    ID: 'Nilai Capaian',
    EN: 'Achievement Score',
  },
  'common.target': {
    ID: 'Target 1 Th yad',
    EN: 'Target in 1 Year',
  },
  'common.evidence': {
    ID: 'Bukti Link / File Dokumen',
    EN: 'Evidence Link / Document File',
  },
  'common.rootCause': {
    ID: 'Akar Masalah (PLOR+CA)',
    EN: 'Root Cause (PLOR+CA)',
  },
  'common.actionPlan': {
    ID: 'Rencana Tindakan Koreksi (PTK/RTL)',
    EN: 'Corrective Action Plan (CAR/RTL)',
  },
  'common.pic': {
    ID: 'Penanggung Jawab (PIC)',
    EN: 'Person in Charge (PIC)',
  },
  'common.schedule': {
    ID: 'Jadwal Penyelesaian',
    EN: 'Completion Schedule',
  },
  'common.monevSchedule': {
    ID: 'Jadwal Monev',
    EN: 'Monitoring Schedule',
  },
  'common.findings': {
    ID: 'Kategori Temuan',
    EN: 'Findings Category',
  },
  'common.condition': {
    ID: 'Keadaan Prodi Saat Ini (Rubrik 1–7)',
    EN: 'Current Study Program State (Rubric 1–7)',
  },

  // Export
  'export.pdf.id': {
    ID: 'Ekspor PDF (Bahasa Indonesia)',
    EN: 'Export PDF (Indonesian)',
  },
  'export.pdf.en': {
    ID: 'Ekspor PDF (English)',
    EN: 'Export PDF (English)',
  },
  'export.docx.id': {
    ID: 'Ekspor Word .docx (Bahasa Indonesia)',
    EN: 'Export Word .docx (Indonesian)',
  },
  'export.docx.en': {
    ID: 'Ekspor Word .docx (English)',
    EN: 'Export Word .docx (English)',
  },

  // Summary Cards & Charts
  'stats.totalPrograms': {
    ID: 'Total Program Studi',
    EN: 'Total Study Programs',
  },
  'stats.totalIndicators': {
    ID: 'Total Indikator SPMI',
    EN: 'Total SPMI Indicators',
  },
  'stats.evaluatedIndicators': {
    ID: 'Indikator Selesai Dinilai',
    EN: 'Evaluated Indicators',
  },
  'stats.overallAverage': {
    ID: 'Rata-rata Skor Capaian',
    EN: 'Average Achievement Score',
  },
  'stats.targetAverage': {
    ID: 'Rata-rata Target 1 Th',
    EN: 'Average Target in 1 Year',
  },
  'stats.clusterUnggul': {
    ID: 'Klaster Unggul',
    EN: 'Superior Cluster',
  },
  'stats.clusterStabil': {
    ID: 'Klaster Stabil',
    EN: 'Stable Cluster',
  },
  'stats.clusterMenurun': {
    ID: 'Klaster Menurun',
    EN: 'Declining Cluster',
  },
  'stats.clusterPembinaan': {
    ID: 'Klaster Pembinaan',
    EN: 'Coaching Cluster',
  },
  'stats.upcoming30': {
    ID: 'Kegiatan 30 Hari Ke Depan',
    EN: 'Activities in Next 30 Days',
  },
  'stats.agendaWeek': {
    ID: 'Agenda Minggu Ini',
    EN: 'This Week Agenda',
  },
  'stats.overdue': {
    ID: 'Kegiatan Terlambat / Lewat Tenggat',
    EN: 'Overdue Activities',
  },
  'stats.days': {
    ID: 'Hari',
    EN: 'Days',
  },
  'stats.months': {
    ID: 'Bulan',
    EN: 'Months',
  },

  // Toolbar
  'toolbar.faculty': {
    ID: 'Fakultas / Unit:',
    EN: 'Faculty / Unit:',
  },
  'toolbar.programType': {
    ID: 'Jenis Prodi:',
    EN: 'Program Type:',
  },
  'toolbar.studyProgram': {
    ID: 'Prodi:',
    EN: 'Study Program:',
  },
  'toolbar.cycle': {
    ID: 'Siklus:',
    EN: 'Cycle:',
  },
  'toolbar.allFaculties': {
    ID: 'Semua Fakultas / Unit',
    EN: 'All Faculties / Units',
  },
  'toolbar.allTypes': {
    ID: 'Semua Jenis',
    EN: 'All Types',
  },
  'toolbar.kependidikan': {
    ID: 'Kependidikan',
    EN: 'Education',
  },
  'toolbar.nonKependidikan': {
    ID: 'Non-Kependidikan',
    EN: 'Non-Education',
  },
  'toolbar.locked': {
    ID: 'Terkunci',
    EN: 'Locked',
  },
  'toolbar.newProdi': {
    ID: 'Prodi Baru',
    EN: 'New Program',
  },

  // Cloud Sync
  'sync.saving': {
    ID: 'Menyimpan...',
    EN: 'Saving...',
  },
  'sync.saved': {
    ID: 'Tersimpan di Cloud',
    EN: 'Saved to Cloud',
  },
  'sync.error': {
    ID: 'Gagal Sinkron',
    EN: 'Sync Failed',
  },

  // Sidebar Extra
  'sidebar.currentScore': {
    ID: 'Skor Terbobot Saat Ini',
    EN: 'Current Weighted Score',
  },
  'sidebar.logout': {
    ID: 'Keluar dari Sistem',
    EN: 'Sign Out from System',
  },
};

export const t = (key: string, lang: Language): string => {
  return DICTIONARY[key]?.[lang] || DICTIONARY[key]?.['ID'] || key;
};

export const getNavLabel = (
  item: { id: string; num: string; label: string },
  lang: Language
): string => {
  const localized = DICTIONARY['tab.' + item.id]?.[lang];
  if (localized) {
    return localized;
  }
  return `${item.num}. ${item.label}`;
};

export const getTabTitle = (id: string, lang: Language): string => {
  const full = t('tab.' + id, lang);
  return full.replace(/^\d{2}\.\s*/, '');
};

// 10 Standards Translation
const STANDARDS_EN: Record<string, string> = {
  'Standar Isi': 'Content Standard',
  'Standar Proses': 'Process Standard',
  'Standar Kompetensi Lulusan': 'Graduate Competency Standard',
  'Standar Pendidik dan Tenaga Kependidikan': 'Lecturers and Education Staff Standard',
  'Standar Sarana dan Prasarana Pendidikan': 'Educational Facilities and Infrastructure Standard',
  'Standar Pengelolaan Program Studi': 'Study Program Management Standard',
  'Standar Pembiayaan': 'Financing Standard',
  'Standar Penilaian': 'Assessment Standard',
  'Standar Penelitian': 'Research Standard',
  'Standar Pengabdian kepada Masyarakat': 'Community Service Standard',
};

export const translateStandardName = (name: string, lang: Language): string => {
  if (lang === 'ID') return name;
  return STANDARDS_EN[name] || name;
};

// Faculty / Campus Unit Translation
const FACULTIES_EN: Record<string, string> = {
  'FKIP': 'Faculty of Teacher Training and Education (FKIP)',
  'FEB': 'Faculty of Economics and Business (FEB)',
  'FH': 'Faculty of Law (FH)',
  'FISIP': 'Faculty of Social and Political Sciences (FISIP)',
  'FAPERTA': 'Faculty of Agriculture (FAPERTA)',
  'FPIK': 'Faculty of Fisheries and Marine Science (FPIK)',
  'FATEK': 'Faculty of Engineering (FATEK)',
  'FK': 'Faculty of Medicine (FK)',
  'FST': 'Faculty of Science and Technology (FST)',
  'Pascasarjana': 'Postgraduate School',
  'PSDKU KAB. KEP. ARU': 'Aru Islands Regency PSDKU Campus',
  'PSDKU KAB. MBD': 'Southwest Maluku Regency PSDKU Campus',
  'Universitas Pattimura': 'Pattimura University',
  'LPMPP': 'LPMPP (Quality Assurance Institute)',
};

export const translateFaculty = (fac: string, lang: Language): string => {
  if (lang === 'ID') return fac;
  const match = FACULTIES_EN[fac] || FACULTIES_EN[fac.trim().toUpperCase()];
  if (match) return match;
  if (fac.includes('ARU') || fac.includes('Aru')) return 'Aru Islands Regency Campus';
  if (fac.includes('MBD') || fac.includes('Mbd')) return 'Southwest Maluku Regency Campus';
  return fac;
};

// Degree / Jenjang Translation
const DEGREE_EN: Record<string, string> = {
  'S1': "Bachelor's Degree (S1)",
  'S2': "Master's Degree (S2)",
  'S3': "Doctoral Degree (S3)",
  'Sp-1': 'Medical Specialist (Sp-1)',
  'Profesi': 'Professional Program',
  'D3': 'Diploma 3',
};

export const translateDegree = (jenjang: string, lang: Language): string => {
  if (lang === 'ID') return jenjang;
  return DEGREE_EN[jenjang] || jenjang;
};

// Program Name Translation Map
const PROGRAM_DICT: Record<string, string> = {
  'Administrasi Pendidikan': 'Educational Administration',
  'Administrasi Publik': 'Public Administration',
  'Agribisnis': 'Agribusiness',
  'Agrobisnis Perikanan': 'Fisheries Agribusiness',
  'Agroteknologi': 'Agrotechnology',
  'Akuntansi': 'Accounting',
  'Bimbingan Dan Konseling': 'Guidance and Counseling',
  'Bioteknologi': 'Biotechnology',
  'Budidaya Perairan': 'Aquaculture',
  'Ekonomi Pembangunan': 'Development Economics',
  'Ekonomi Terapan': 'Applied Economics',
  'Farmasi': 'Pharmacy',
  'Fisika': 'Physics',
  'Gizi': 'Nutrition Science',
  'Hukum': 'Law',
  'Ilmu Administrasi Negara': 'State Administrative Science',
  'Ilmu Ekonomi': 'Economics',
  'Ilmu Hukum': 'Legal Science',
  'Ilmu Kelautan': 'Marine Science',
  'Ilmu Komputer': 'Computer Science',
  'Ilmu Komunikasi': 'Communication Science',
  'Ilmu Lingkungan': 'Environmental Science',
  'Ilmu Manajemen': 'Management Science',
  'Ilmu Pemerintahan': 'Government Science',
  'Ilmu Penyakit Dalam': 'Internal Medicine',
  'Ilmu Pertanian': 'Agricultural Science',
  'Ilmu Tanah': 'Soil Science',
  'Kedokteran Gigi': 'Dentistry',
  'Keselamatan dan Kesehatan Kerja': 'Occupational Health and Safety',
  'Kewirausahaan': 'Entrepreneurship',
  'Kimia': 'Chemistry',
  'Manajemen Hutan': 'Forest Management',
  'Manajemen Pendidikan': 'Educational Management',
  'Manajemen Sumber Daya Perairan': 'Aquatic Resources Management',
  'Manajemen': 'Management',
  'Matematika': 'Mathematics',
  'Pemanfaatan Sumberdaya Perikanan': 'Fisheries Resources Utilization',
  'Pendidikan Bahasa Inggris': 'English Language Education',
  'Pendidikan Bahasa Jerman': 'German Language Education',
  'Pendidikan Bahasa dan Sastra Indonesia': 'Indonesian Language and Literature Education',
  'Pendidikan Biologi': 'Biology Education',
  'Pendidikan Ekonomi': 'Economics Education',
  'Pendidikan Fisika': 'Physics Education',
  'Pendidikan Geografi': 'Geography Education',
  'Pendidikan Guru Pendidikan Anak Usia Dini': 'Early Childhood Education Teacher Education',
  'Pendidikan Guru Sekolah Dasar': 'Elementary School Teacher Education',
  'Pendidikan Kimia': 'Chemistry Education',
  'Pendidikan Luar Sekolah': 'Non-Formal Education',
  'Pendidikan Matematika': 'Mathematics Education',
  'Pendidikan Pancasila dan Kewarganegaraan': 'Pancasila and Civic Education',
  'Pendidikan Sejarah': 'History Education',
  'Pendidikan Sosiologi': 'Sociology Education',
  'Pendidikan Jasmani, Kesehatan dan Rekreasi': 'Physical Education, Health and Recreation',
  'Pendidikan Jasmani': 'Physical Education',
  'Pendidikan Profesi Dokter': 'Medical Doctor Professional Program',
  'Pendidikan Dokter': 'Medical Doctor Education',
  'Pendidikan Dokter Gigi': 'Dentistry Doctor Education',
  'Pendidikan IPA': 'Natural Science Education',
  'Pengelolaan Lahan Kering': 'Dryland Management',
  'Pengelolaan Sumberdaya Kepulauan': 'Island Resources Management',
  'Penyuluhan Pertanian': 'Agricultural Extension',
  'Perencanaan Wilayah dan Kota': 'Urban and Regional Planning',
  'Peternakan': 'Animal Husbandry',
  'Sastra Daerah': 'Regional Literature',
  'Sastra Inggris': 'English Literature',
  'Sistem Informasi': 'Information Systems',
  'Sosiologi': 'Sociology',
  'Statistika': 'Statistics',
  'Teknik Geofisika': 'Geophysical Engineering',
  'Teknik Geologi': 'Geological Engineering',
  'Teknik Industri': 'Industrial Engineering',
  'Teknik Mesin': 'Mechanical Engineering',
  'Teknik Perminyakan': 'Petroleum Engineering',
  'Teknik Sipil': 'Civil Engineering',
  'Teknik Sistem Perkapalan': 'Marine System Engineering',
  'Teknologi Hasil Hutan': 'Forest Products Technology',
  'Teknologi Hasil Pertanian': 'Agricultural Product Technology',
  'Teknologi Hasil Perikanan': 'Fishery Product Technology',
  'Teknologi Industri Pertanian': 'Agro-Industrial Technology',
  'Teknologi Pangan': 'Food Technology',
  'Bedah': 'Surgery',
};

export const translateProgramName = (namaProdi: string, lang: Language): string => {
  if (lang === 'ID' || !namaProdi) return namaProdi;

  // Extract campus suffix like (Kampus Kab. Kep. Aru) or (Kampus Kab. MBD)
  let campusSuffix = '';
  let cleanName = namaProdi.trim();

  if (cleanName.includes('(Kampus Kab. Kep. Aru)')) {
    campusSuffix = ' (Aru Islands Regency Campus)';
    cleanName = cleanName.replace('(Kampus Kab. Kep. Aru)', '').trim();
  } else if (cleanName.includes('(Kampus Kab. MBD)')) {
    campusSuffix = ' (Southwest Maluku Regency Campus)';
    cleanName = cleanName.replace('(Kampus Kab. MBD)', '').trim();
  }

  // Check prefix
  let prefix = '';
  let field = cleanName;
  if (cleanName.startsWith('S1 ')) {
    prefix = 'Bachelor of ';
    field = cleanName.substring(3).trim();
  } else if (cleanName.startsWith('S2 ')) {
    prefix = 'Master of ';
    field = cleanName.substring(3).trim();
  } else if (cleanName.startsWith('S3 ')) {
    prefix = 'Doctor of ';
    field = cleanName.substring(3).trim();
  } else if (cleanName.startsWith('Sp-1 ')) {
    prefix = 'Medical Specialist in ';
    field = cleanName.substring(5).trim();
  } else if (cleanName.startsWith('Profesi ')) {
    prefix = 'Professional Program in ';
    field = cleanName.substring(8).trim();
  } else if (cleanName.startsWith('D3 ')) {
    prefix = 'Diploma 3 in ';
    field = cleanName.substring(3).trim();
  }

  const translatedField = PROGRAM_DICT[field] || field;
  return `${prefix}${translatedField}${campusSuffix}`;
};

// Kategori Temuan Translation
const KATEGORI_EN: Record<string, string> = {
  'Mayor': 'Major Finding',
  'Minor': 'Minor Finding',
  'Observasi': 'Observation',
  'Sesuai (Baik)': 'Achieved (Good)',
  'Best Practice': 'Best Practice',
};

export const translateKategori = (
  kat: string | null | undefined,
  lang: Language
): string => {
  if (!kat) return '-';
  if (lang === 'ID') return kat;
  return KATEGORI_EN[kat] || kat;
};

// Monev Status Translation
const MONEV_EN: Record<string, string> = {
  'Open': 'Open (Unresolved)',
  'In Progress': 'In Progress',
  'Closed - Verified': 'Closed - Verified',
};

export const translateMonevStatus = (status: string, lang: Language): string => {
  if (lang === 'ID') return status;
  return MONEV_EN[status] || status;
};

// Months Translation
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const translateMonth = (monthIdx: number, lang: Language): string => {
  if (monthIdx < 0 || monthIdx > 11) return '';
  return lang === 'EN' ? MONTHS_EN[monthIdx] : MONTHS_ID[monthIdx];
};

export const translateUnit = (unit: string, lang: Language): string => {
  if (lang === 'ID') return unit;
  const map: Record<string, string> = {
    'Indikator': 'Indicators',
    'Prodi': 'Study Programs',
    'Program Studi': 'Study Programs',
    'Hari': 'Days',
    'Bulan': 'Months',
    'Skor': 'Score',
    'Tahun': 'Years',
  };
  return map[unit] || unit;
};

// Sebutan / Predicate Translation
const SEBUTAN_MAP: Record<string, string> = {
  'Sangat Baik': 'Excellent',
  'Baik': 'Good',
  'Cukup': 'Fair',
  'Kurang': 'Poor',
  'Sangat Kurang': 'Very Poor',
  'Belum Dinilai': 'Not Evaluated',
  'Tidak Terisi': 'Unfilled',
};

export const translateSebutan = (
  sebutan: string | null | undefined,
  lang: Language
): string => {
  if (!sebutan) return '-';
  if (lang === 'ID') return sebutan;
  return SEBUTAN_MAP[sebutan] || sebutan;
};

// Indicator Uraian dictionary & keyword-based translator
const INDICATOR_URAIAN_DICT: Record<string, string> = {
  'Kejelasan dan kelengkapan dokumen kebijakan tentang penyusunan dan pengembangan kurikulum':
    'Clarity and completeness of policy documents concerning curriculum formulation and development',
  'Pelibatan stakeholder (dosen, alumni, mahasiswa, asosiasi profesi, pengguna lulusan, dan penentu kebijakan pendidikan) dalam penyusunan kurikulum':
    'Stakeholder involvement (lecturers, alumni, students, professional associations, graduate employers, and education policymakers) in curriculum formulation',
  'Kesesuaian kurikulum dengan visi, misi, tujuan, dan sasaran (VMTS) program studi serta profil lulusan':
    'Alignment of curriculum with vision, mission, goals, and objectives (VMTS) of the study program and graduate profile',
  'Kelengkapan dan kejelasan dokumen Capaian Pembelajaran Lulusan (CPL) yang mencakup aspek sikap, pengetahuan, keterampilan umum, dan keterampilan khusus':
    'Completeness and clarity of Graduate Learning Outcomes (CPL) documents covering attitude, knowledge, general skills, and specific skills',
  'Ketersediaan dan kebaruan Rencana Pembelajaran Semester (RPS) pada seluruh mata kuliah sesuai standar SN-Dikti / OBE':
    'Availability and currency of Semester Lesson Plans (RPS) across all courses in accordance with SN-Dikti / OBE standards',
  'Kedalaman dan keluasan materi pembelajaran yang selaras dengan perkembangan ipteks dan kebutuhan dunia kerja':
    'Depth and breadth of learning materials aligned with science and technology developments and job market needs',
  'Integrasi hasil penelitian dan pengabdian kepada masyarakat (PkM) dosen ke dalam materi pembelajaran kurikulum':
    "Integration of lecturers' research and community service results into curriculum course materials",
  'Mekanisme dan keteraturan peninjauan kurikulum secara berkala (maksimal setiap 4-5 tahun) dengan melibatkan pakar eksternal':
    'Mechanisms and regularity of periodic curriculum review (at least every 4-5 years) involving external experts',
  'Ketersediaan dan pelaksanaan kurikulum Merdeka Belajar Kampus Merdeka (MBKM) atau pembelajaran di luar prodi':
    'Availability and implementation of Merdeka Belajar Kampus Merdeka (MBKM) curriculum or off-program learning',
  'Ketersediaan pedoman akademik, modul praktikum/lapangan, dan buku panduan kurikulum bagi mahasiswa dan dosen':
    'Availability of academic guidelines, practicum/field modules, and curriculum handbooks for students and faculty',
};

export const translateIndicatorUraian = (uraian: string, lang: Language): string => {
  if (lang === 'ID' || !uraian) return uraian;
  if (INDICATOR_URAIAN_DICT[uraian.trim()]) {
    return INDICATOR_URAIAN_DICT[uraian.trim()];
  }
  return uraian;
};

// Rubric level 1-7 text translator
export const translateRubricText = (
  text: string,
  lang: Language,
  _level?: number
): string => {
  if (lang === 'ID' || !text) return text;

  // Check standard rubric pattern
  if (text.startsWith('Tidak terdapat kebijakan, pedoman, maupun implementasi terkait')) {
    const topic = text.replace('Tidak terdapat kebijakan, pedoman, maupun implementasi terkait', '').replace(/\.$/, '').trim();
    return `No policy, guidelines, or implementation exists regarding ${topic}.`;
  }
  if (text.includes('Terdapat praktik insidental terkait') && text.includes('namun belum memiliki dokumen kebijakan')) {
    return text
      .replace('Terdapat praktik insidental terkait', 'Incidental practices exist regarding')
      .replace('namun belum memiliki dokumen kebijakan dan pedoman tertulis.', 'but without written policy and guideline documents.');
  }
  if (text.includes('Terdapat dokumen kebijakan tertulis mengenai') && text.includes('tetapi implementasinya belum menyeluruh')) {
    return text
      .replace('Terdapat dokumen kebijakan tertulis mengenai', 'Written policy documents exist concerning')
      .replace('tetapi implementasinya belum menyeluruh dan belum konsisten.', 'but implementation is not yet comprehensive or consistent.');
  }
  if (text.includes('Terdapat dokumen kebijakan dan pedoman') && text.includes('yang memadai serta mulai diimplementasikan')) {
    return text
      .replace('Terdapat dokumen kebijakan dan pedoman', 'Adequate policy and guideline documents exist for')
      .replace('yang memadai serta mulai diimplementasikan pada sebagian unit/mata kuliah.', 'and implementation has commenced in some units/courses.');
  }
  if (text.includes('berjalan secara konsisten sesuai pedoman, namun evaluasi dan tindak lanjutnya belum terdokumentasi')) {
    return text
      .replace('Implementasi', 'Implementation of')
      .replace('berjalan secara konsisten sesuai pedoman, namun evaluasi dan tindak lanjutnya belum terdokumentasi berkala.', 'proceeds consistently according to guidelines, but evaluation and follow-up are not periodically documented.');
  }
  if (text.includes('berjalan baik, terdokumentasi lengkap, dan dievaluasi secara berkala')) {
    return text
      .replace('Implementasi', 'Implementation of')
      .replace('berjalan baik, terdokumentasi lengkap, dan dievaluasi secara berkala setiap tahun akademik.', 'proceeds well, is fully documented, and periodically evaluated each academic year.');
  }
  if (text.includes('berjalan sangat baik, terintegrasi sistem informasi mutu')) {
    return text
      .replace('Implementasi', 'Implementation of')
      .replace('berjalan sangat baik, terintegrasi sistem informasi mutu, dievaluasi berkelanjutan setiap semester, dan menunjukkan peningkatan capaian nyata.', 'proceeds exceptionally well, integrated with quality information systems, continuously evaluated each semester, demonstrating tangible improvements.');
  }

  // Common replacements for specific indicator 1.1 - 1.2
  let res = text;
  res = res
    .replace('Tidak terdapat kebijakan tertulis maupun tidak tertulis tentang penyusunan dan pengembangan kurikulum.', 'No written or unwritten policy exists regarding curriculum formulation and development.')
    .replace('Terdapat kebijakan tidak tertulis tentang penyusunan dan pengembangan kurikulum.', 'Unwritten policy exists regarding curriculum formulation and development.')
    .replace('Terdapat kebijakan tertulis tetapi tidak lengkap tentang penyusunan dan pengembangan kurikulum.', 'Incomplete written policy exists regarding curriculum formulation and development.')
    .replace('Terdapat dokumen kebijakan yang mencakup ketetapan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan peninjauan dan pengembangan kurikulum.', 'Policy documents exist including regulations, rules, and guidelines facilitating the study program to conduct curriculum review and development.')
    .replace('Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala setiap 5 tahun.', 'Documents exist covering policies, regulations, and guidelines facilitating the study program to plan, develop, and update curriculum periodically every 5 years.')
    .replace('Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala kurang dari setiap 5 tahun.', 'Documents exist covering policies, regulations, and guidelines facilitating the study program to plan, develop, and update curriculum periodically in less than 5 years.')
    .replace('Terdapat dokumen yang mencakup kebijakan, peraturan, dan pedoman yang memfasilitasi program studi untuk melakukan perencanaan, pengembangan, dan pemutakhiran kurikulum secara berkala kurang dari setiap 5 tahun dan evaluasi/penyempurnaan setiap akhir tahun ajaran.', 'Documents exist covering policies, regulations, and guidelines facilitating the study program to plan, develop, and update curriculum in less than 5 years with evaluation/refinement at the end of each academic year.')
    .replace('Penyusunan kurikulum hanya dilakukan oleh ketua program studi tanpa melibatkan dosen dan pemangku kepentingan.', 'Curriculum formulation is only conducted by the head of study program without involving lecturers and stakeholders.')
    .replace('Penyusunan kurikulum dilakukan oleh pimpinan program studi dengan melibatkan sebagian dosen internal tanpa pemangku kepentingan eksternal.', 'Curriculum formulation is conducted by study program leadership involving some internal lecturers without external stakeholders.')
    .replace('Penyusunan kurikulum dilakukan dengan melibatkan dosen dan mahasiswa, namun belum melibatkan alumni atau pengguna lulusan.', 'Curriculum formulation involves lecturers and students, but not yet alumni or graduate employers.')
    .replace('Penyusunan kurikulum melibatkan seluruh pemangku kepentingan secara terstruktur, terdokumentasi lengkap, dan hasil masukan ditindaklanjuti dalam struktur kurikulum OBE.', 'Curriculum formulation involves all stakeholders in a structured manner, fully documented, and feedback is incorporated into the OBE curriculum structure.');

  return res;
};
