import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  ArrowRight,
  ShieldCheck,
  Cloud,
  FileDown,
} from 'lucide-react';
import { AmiTabId } from '../../types/ami';

interface TabPanduanPenggunaanProps {
  onNavigateTab: (tab: AmiTabId) => void;
  onOpenNewProdi: () => void;
  allowedTabs?: AmiTabId[];
  canCreateProdi?: boolean;
}

interface GuideSection {
  id: string;
  badge: string;
  title: string;
  targetTab?: AmiTabId;
  summary: string;
  steps: string[];
  buttons: { name: string; role: string; action: string }[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'awal',
    badge: 'Mulai Cepat',
    title: '0.1 Login Akun Resmi, Hak Akses Pengguna & Sinkronisasi Real-Time Cloud',
    summary:
      'Aplikasi PPEPP UNPATTI terhubung penuh secara real-time dengan penyimpanan Cloud terpusat. Seluruh data Program Studi, Indikator, dan isian Evaluasi dimulai dari data aktual institusi (kosong apabila belum diisi) tanpa data dummy atau penyimpanan lokal browser.',
    steps: [
      'Masuk pada halaman Login resmi PPEPP UNPATTI menggunakan Email dan Password akun institusional Anda. Setelah autentikasi berhasil, sistem otomatis membaca peran dan cakupan unit Anda dari profil pengguna.',
      'Periksa nama, NIP/jabatan, serta lencana peran aktif Anda di bagian kiri atas Sidebar dan Header atas (Super Admin, Admin LPMPP, Kaprodi, Auditor AMI, Dekanat, Rektorat, Lembaga, Pusat, Asesor LAM, atau Asesor BAN-PT).',
      'Pada Bilah Toolbar Atas, pilih filter "Fakultas", "Jenis Prodi" (Kependidikan 109 Indikator / Non-Kependidikan 127 Indikator), "Prodi", dan "Siklus" (2020/2021 s.d. 2030/2031). Bagi peran Kaprodi, filter Fakultas, Jenis Prodi, dan Prodi otomatis terkunci ke unit program studinya.',
      'Setiap pengisian nilai, target, analisis, maupun bukti tautan otomatis tersimpan ke Cloud dengan indikator status di Header atas ("Menyimpan..." lalu "Tersimpan di Cloud ✓") dan langsung tersinkron secara real-time.',
      'Gunakan tombol "Keluar" di pojok kanan atas (atau "Keluar dari Sistem" di bawah sidebar) untuk mengakhiri sesi login dengan aman.',
    ],
    buttons: [
      {
        name: 'Filter Fakultas, Jenis Prodi & Prodi',
        role: 'Admin / Auditor / Pimpinan (Terkunci untuk Kaprodi)',
        action:
          'Menyaring dan memilih Program Studi aktif beserta klasifikasi instrumen Kependidikan (109 Ind.) atau Non-Kependidikan (127 Ind.).',
      },
      {
        name: '+ Prodi Baru',
        role: 'Super Admin / Admin LPMPP',
        action:
          'Mendaftarkan Program Studi baru dan menyimpannya langsung ke tabel master ppepp_prodi di database.',
      },
      {
        name: 'Dropdown Siklus',
        role: 'Semua Peran (Terkunci sesuai SK untuk Asesor LAM)',
        action:
          'Berpindah tahun siklus PPEPP (2020/2021 s.d. 2030/2031).',
      },
      {
        name: 'Indikator Status Cloud & Export Excel',
        role: 'Semua Peran',
        action:
          'Memantau status penyimpanan real-time ke database dan mengunduh workbook Excel (.xlsx) lengkap kapan saja.',
      },
      {
        name: 'Tombol Keluar',
        role: 'Semua Peran',
        action:
          'Menutup sesi autentikasi secara aman, membersihkan state lokal, dan kembali ke halaman Login.',
      },
    ],
  },
  {
    id: 'modul-00',
    badge: 'Modul 00',
    title: '00. Dashboard PPEPP, Perengkingan Top 10 & Klaster Mutu Fakultas',
    targetTab: 'dashboard',
    summary:
      'Pusat kendali eksekutif untuk memantau efektifitas implementasi 5 tahap siklus mutu (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan), perengkingan Top 10 Program Studi, grafik sebaran klaster mutu per Fakultas/Pascasarjana/PSDKU, serta statistik progres pengisian evaluasi.',
    steps: [
      'Periksa kartu "Indeks Efektifitas PPEPP" dan 5 kartu tahap PPEPP (P1 Penetapan, P2 Pelaksanaan, E Evaluasi, P3 Pengendalian, P4 Peningkatan). Program studi yang belum memiliki isian evaluasi menampilkan nilai 0% / "Belum Dinilai".',
      'Tinjau grafik "Sebaran Klaster Mutu PPEPP per Fakultas" (Unggul, Stabil, Menurun, Pembinaan) dan daftar "Top 10 Program Studi Terbaik" untuk siklus yang dipilih.',
      'Gunakan grafik "Analisis Tren Capaian Mutu & Efektifitas PTK Antar Siklus" dan tabel "Prioritas Pengendalian Mutu per Standar", lalu klik "Audit →" untuk meninjau standar dengan selisih (Gap) terbesar.',
      'Pada bagian statistik & ringkasan kinerja Program Studi, cari atau pilih program studi untuk mengaktifkannya langsung.',
    ],
    buttons: [
      {
        name: 'Unduh Excel AMI & Cetak Ringkasan',
        role: 'Semua Peran',
        action:
          'Mengunduh laporan lengkap .xlsx atau membuka Pratinjau Dokumen Resmi A4 ber-kop UNPATTI (Simpan PDF / Cetak / HTML).',
      },
      {
        name: 'Pintasan Kartu Tahap PPEPP',
        role: 'Semua Peran sesuai hak akses modul',
        action:
          'Melompat langsung ke Modul 01 (Identitas), 02 (Instrumen), 05 (Temuan), 06 (PTK), atau 07 (Monev).',
      },
      {
        name: 'Audit → / Pilih Prodi',
        role: 'Semua Peran',
        action:
          'Membuka standar prioritas di Modul 02 atau mengaktifkan program studi dari tabel perbandingan.',
      },
    ],
  },
  {
    id: 'modul-01',
    badge: 'Modul 01',
    title: '01. Identitas Program Studi',
    targetTab: 'identitas',
    summary:
      'Mencatat profil institusional, pilihan Fakultas / Pascasarjana / PSDKU, legalitas SK, peringkat akreditasi, VMTS, CPL/PLO, kriteria kelulusan, data SDM PDDIKTI, serta blok pengesahan Dekan & Kaprodi.',
    steps: [
      'Hak penyuntingan aktif untuk peran Kaprodi (pada prodinya sendiri) dan Super Admin / Admin LPMPP. Peran lainnya melihat modul ini dalam mode Hanya Baca demi integritas data.',
      'Periksa atau perbarui Seksi 01 (Identitas PT & 3. Fakultas / Pascasarjana / PSDKU) serta jenis instrumen prodi.',
      'Lengkapi Seksi 02 (Kode PS, SK Pendirian/Operasional, Peringkat Akreditasi, Riwayat Akreditasi I–V, Tahun Siklus PPEPP) dan Seksi 03 (Visi, Misi, PLO, Kriteria Lulusan).',
      'Lengkapi Seksi 04 (Mahasiswa TS, Lulusan TS, Dosen Homebase/Tetap/Tidak Tetap, Tendik) dan Seksi 05 (Nama & NIP Dekan serta Kaprodi untuk blok tanda tangan dokumen). Perubahan otomatis tersinkron ke ppepp_prodi.',
    ],
    buttons: [
      {
        name: 'Form Identitas & Jenis Prodi',
        role: 'Kaprodi & Super Admin / Admin LPMPP',
        action:
          'Menyunting data identitas program studi dan menyinkronkan perubahan Nama Prodi, Fakultas, Akreditasi, Jenis Prodi, dan Nama Kaprodi ke database.',
      },
    ],
  },
  {
    id: 'modul-02',
    badge: 'Modul 02',
    title: '02. Instrumen Evaluasi Diri & Penilaian Auditor (10 Standar SPMI)',
    targetTab: 'instrumen',
    summary:
      'Inti pelaksanaan AMI untuk instrumen Non-Kependidikan (127 indikator) dan Kependidikan (109 indikator) pada 10 Standar SPMI UNPATTI. Indikator yang belum dinilai tampil kosong agar capaian terukur akurat, dan setiap perubahan otomatis tersimpan ke cloud.',
    steps: [
      'Gunakan filter Standar (Semua atau Standar 1–10), kotak pencarian, dan filter Kategori Temuan untuk memfokuskan butir indikator. Klik "Unduh Template Instrumen (.xlsx)" untuk mendapatkan template Excel lengkap beserta rubrik skala 1–7.',
      'Kaprodi mengisi "Target 1 Th yad" (skala 1–7), menempelkan URL dokumen pendukung pada "Bukti Link Dokumen", serta menyusun rencana awal "PTK / RTL" dan "PIC".',
      'Auditor AMI (dan Admin) menilai "Nilai Capaian" (skala 1–7) melalui dropdown tabel atau dengan mengklik sel "Keadaan Prodi Saat Ini" untuk membuka Panel Rubrik Skala 1–7 interaktif.',
      'Klik sel "Akar Masalah / Penunjang (PLOR+CA)" untuk mengisi analisis terstruktur Problem, Location, Objective Evidence, Reference, Correction, dan Action, atau melakukan penyesuaian (override) Kategori Temuan secara langsung.',
      'Khusus Super Admin / Admin LPMPP / Lembaga, tombol "+ Tambah Indikator", Edit, dan Hapus pada kolom Aksi tersedia untuk mengelola butir instrumen langsung di tabel ppepp_indikator.',
    ],
    buttons: [
      {
        name: '+ Tambah Indikator / Edit / Hapus',
        role: 'Super Admin, Admin LPMPP & Lembaga',
        action:
          'Menambah, memperbarui, atau menghapus butir indikator beserta deskripsi rubrik 1–7 langsung ke database ppepp_indikator.',
      },
      {
        name: 'Unduh Template Instrumen (.xlsx)',
        role: 'Semua Peran',
        action:
          'Mengunduh draf template Excel sesuai jenis instrumen prodi (109 atau 127 indikator) beserta deskriptor rubrik.',
      },
      {
        name: 'Sel Rubrik (Skala 1–7) & Dropdown Nilai/Target',
        role: 'Kaprodi (Target), Auditor AMI & Admin (Nilai & Target)',
        action:
          'Menetapkan skor capaian dan target dengan auto-save real-time ke tabel ppepp_evaluasi.',
      },
      {
        name: 'Modal PLOR+CA & Override Kategori',
        role: 'Auditor AMI & Admin (Sunting) / Lainnya (Baca)',
        action:
          'Mengisi akar masalah/penunjang terstruktur serta menyesuaikan kategori temuan (Mayor, Minor, Observasi, Sesuai, Best Practice).',
      },
      {
        name: 'Bukti Link Dokumen & Ikon Tautan',
        role: 'Kaprodi & Admin',
        action:
          'Menyimpan tautan repositori/Google Drive bukti indikator dan membukanya di tab baru.',
      },
    ],
  },
  {
    id: 'modul-03',
    badge: 'Modul 03',
    title: '03. Rekap & Analisis per Standar',
    targetTab: 'rekap',
    summary:
      'Kalkulasi otomatis rata-rata nilai capaian skala 0–100 per standar (hanya menghitung indikator yang sudah dinilai), rata-rata nilai terbobot keseluruhan, dan distribusi kategori temuan dari Standar 1 hingga Standar 10.',
    steps: [
      'Tinjau tabel Rekapitulasi per Standar untuk membandingkan Nilai Capaian, Sebutan, Target, Kategori Temuan Standar, serta jumlah temuan Mayor, Minor, Observasi, Sesuai, dan Best Practice.',
      'Periksa baris ringkasan "RATA-RATA NILAI TERBOBOT" di bagian bawah tabel.',
      'Klik "Buka Standar →" pada baris standar tertentu untuk langsung membuka dan memfilter butir indikator standar tersebut di Modul 02.',
    ],
    buttons: [
      {
        name: 'Buka Standar → (Inspeksi)',
        role: 'Peran dengan akses Modul 02',
        action:
          'Membuka Modul 02 dengan filter otomatis terkunci pada standar yang dipilih.',
      },
    ],
  },
  {
    id: 'modul-04',
    badge: 'Modul 04',
    title: '04. Laporan AMI & Visualisasi Grafik',
    targetTab: 'laporan',
    summary:
      'Menyajikan ringkasan eksekutif hasil AMI program studi, analisis statistik deskriptif, grafik interaktif distribusi temuan dan perbandingan Capaian vs Target, serta ekspor dokumen cetak A4 resmi.',
    steps: [
      'Periksa kartu ringkasan skor terbobot dan statistik komposisi temuan di bagian atas.',
      'Arahkan kursor pada grafik batang untuk melihat angka rinci per standar dan perbandingan terhadap rata-rata terbobot.',
      'Klik "Cetak / Export PDF" untuk membuka pratinjau A4 ber-kop UNPATTI (dengan opsi Simpan PDF, Cetak, atau Unduh HTML) atau "Export Excel (.xlsx)" untuk mengunduh workbook lengkap.',
    ],
    buttons: [
      {
        name: 'Export Excel (.xlsx) & Cetak / Export PDF',
        role: 'Semua Peran dengan izin Ekspor',
        action:
          'Menghasilkan workbook Excel lengkap atau dokumen PDF/HTML ber-kop UNPATTI.',
      },
    ],
  },
  {
    id: 'modul-05',
    badge: 'Modul 05',
    title: '05. Daftar Temuan AMI',
    targetTab: 'temuan',
    summary:
      'Register terpusat seluruh indikator yang memiliki temuan (Mayor, Minor, Observasi, dan Best Practice) lengkap dengan narasi Akar Masalah/Penunjang (PLOR+CA) dan tautan bukti pendukung.',
    steps: [
      'Gunakan tombol filter kategori ("Semua Temuan", "Mayor", "Minor", "Observasi", "Best Practice") atau kotak pencarian untuk menelusuri temuan.',
      'Klik tautan "Lihat Bukti Dokumen" untuk memverifikasi berkas yang diunggah Prodi.',
      'Klik "PLOR+CA" di kolom Aksi untuk meninjau atau menyempurnakan uraian Akar Masalah/Penunjang beserta koreksi dan tindakan pencegahan.',
    ],
    buttons: [
      {
        name: 'Filter Kategori Temuan',
        role: 'Semua Peran',
        action:
          'Menyaring daftar temuan audit secara instan beserta jumlah butir tiap kategori.',
      },
      {
        name: 'Tombol PLOR+CA',
        role: 'Auditor AMI & Admin (Sunting) / Lainnya (Baca)',
        action:
          'Membuka modal analisis Akar Masalah/Penunjang PLOR+CA pada indikator terkait.',
      },
    ],
  },
  {
    id: 'modul-06',
    badge: 'Modul 06',
    title: '06. Formulir PTK / RTL & Persetujuan Berjenjang Dekan',
    targetTab: 'ptk',
    summary:
      'Mengelola rencana Permintaan Tindakan Koreksi (PTK) dan Rencana Tindak Lanjut (RTL) untuk temuan Mayor, Minor, dan Observasi, lengkap dengan kolom Akar Masalah/Penunjang, PIC, jadwal, dan alur persetujuan Dekanat.',
    steps: [
      'Kaprodi menyusun rencana "PTK / RTL" dan mengisi "PIC", kemudian dapat mengajukan formulir dengan alur pengiriman ke Dekan.',
      'Auditor AMI (dan Admin) melengkapi kolom "Akar Masalah/Penunjang", "Waktu Selesaikan PTK/RTL", dan "Waktu Monev PTK/RTL" sebagai batas tindak lanjut.',
      'Dekanat (Pimpinan Fakultas) meninjau usulan PTK/RTL program studi di fakultasnya, menambahkan catatan fakultas bila diperlukan, dan memberikan persetujuan resmi sebelum tahap Monev.',
      'Klik "Cetak Formulir PTK/RTL" untuk mengunduh PDF atau HTML format A4 lanskap siap tanda tangan.',
    ],
    buttons: [
      {
        name: 'Kirim ke Dekan / Persetujuan Dekan',
        role: 'Kaprodi (Ajukan) & Dekanat / Admin (Setujui)',
        action:
          'Menjalankan alur persetujuan berjenjang PTK/RTL tingkat Fakultas dan menyimpannya ke database.',
      },
      {
        name: 'Cetak Formulir PTK/RTL',
        role: 'Semua Peran',
        action:
          'Membuka pratinjau resmi A4 lanskap dengan tombol Simpan PDF (.pdf), Cetak, dan Unduh HTML.',
      },
    ],
  },
  {
    id: 'modul-07',
    badge: 'Modul 07',
    title: '07. Monitoring & Evaluasi (Monev) PTK / RTL',
    targetTab: 'monev',
    summary:
      'Memantau realisasi penyelesaian PTK/RTL oleh Program Studi hingga diverifikasi tuntas menjadi status "Closed - Verified" oleh Auditor AMI atau Admin.',
    steps: [
      'Gunakan filter status ("Semua", "Open", "In Progress", "Closed - Verified") dan kartu KPI di atas untuk memantau progres penutupan temuan.',
      'Kaprodi mengisi kolom "Bukti Realisasi PTK/RTL" (tautan repositori/deskripsi bukti) dan "Tanggal Penyelesaian", lalu mengubah status menjadi "In Progress".',
      'Auditor AMI (dan Admin) memeriksa bukti realisasi melalui tombol "Buka Bukti Realisasi" dan menetapkan status "Closed - Verified" bila tindakan koreksi dinyatakan tuntas.',
    ],
    buttons: [
      {
        name: 'Filter Status Verifikasi',
        role: 'Semua Peran',
        action: 'Menyaring daftar tindak lanjut PTK sesuai status realisasi.',
      },
      {
        name: 'Dropdown Status Verifikasi',
        role: 'Kaprodi (Open / In Progress) & Auditor / Admin (Termasuk Closed - Verified)',
        action:
          'Memperbarui status pelaksanaan koreksi dan melakukan verifikasi penutupan temuan.',
      },
    ],
  },
  {
    id: 'modul-09',
    badge: 'Modul 09',
    title: '09. Perengkingan & Klasterisasi Mutu PPEPP',
    targetTab: 'perengkingan',
    summary:
      'Menyusun pemeringkatan Program Studi per siklus 1 tahun (Semua Prodi, Top 10, Top 25, Top 50) berdasarkan Skor Indeks Kualitas serta mengelompokkan prodi ke dalam 4 klaster mutu: Unggul, Stabil, Menurun, dan Pembinaan.',
    steps: [
      'Pahami rumus metodologi Skor Indeks Kualitas yang tercantum pada panel modul: Skor Awal (Rata-rata Capaian %) dikurangi Penalti Mayor (2,0 poin/temuan), Penalti Minor (0,5 poin/temuan), Penalti Observasi (0,1 poin/temuan), dan ditambah Bonus Best Practice (0,5 poin/temuan).',
      'Pilih siklus tahunan serta filter tingkatan peringkat ("Semua Prodi", "Top 10 Terbaik", "Top 25 Terbaik", "Top 50 Terbaik"), Fakultas, atau Klaster Mutu (Unggul, Stabil, Menurun, Pembinaan).',
      'Prodi yang belum memiliki isian nilai capaian pada siklus terpilih ditandai sebagai "Belum Dinilai" agar tidak tercampur dengan prodi yang sudah diaudit.',
      'Klik nama Program Studi pada tabel peringkat untuk berpindah konteks ke prodi tersebut, atau klik tombol Ekspor Excel / PDF untuk mengunduh rekap peringkat.',
    ],
    buttons: [
      {
        name: 'Filter Peringkat (Top 10 / 25 / 50) & Klaster Mutu',
        role: 'Semua Peran',
        action:
          'Menampilkan kelompok peringkat terbaik atau menyaring prodi berdasarkan klaster Unggul, Stabil, Menurun, atau Pembinaan.',
      },
      {
        name: 'Export Excel & Export PDF Peringkat',
        role: 'Semua Peran dengan izin Ekspor',
        action:
          'Mengunduh tabel perengkingan dan klasterisasi mutu PPEPP untuk bahan RTM dan evaluasi universitas.',
      },
    ],
  },
  {
    id: 'modul-10',
    badge: 'Modul 10',
    title: '10. Laporan AMI / RTM / Efektifitas & Peningkatan Standar SPMI',
    targetTab: 'laporan_spmi',
    summary:
      'Generator 4 dokumen resmi ber-kop UNPATTI (logo 2 cm × 2 cm) pada cakupan Program Studi, Fakultas, atau Universitas lengkap dengan grafik, analisis statistik yang relevan, matriks temuan PLOR+CA, keputusan RTM, dan ekspor langsung ke Word (.docx) serta PDF (.pdf).',
    steps: [
      'Pilih cakupan level laporan (Program Studi / Fakultas / Universitas sesuai hak akses peran) serta salah satu dari 4 jenis dokumen: Laporan AMI, Laporan RTM, Evaluasi & Efektivitas Implementasi SPMI, atau Perbaikan & Peningkatan Standar.',
      'Klik "Edit Metadata & Narasi" apabila perlu menyesuaikan Ketua Tim Auditor, Nomor SK Penugasan, Kepala LPMPP, Tanggal Audit/RTM, butir Keputusan RTM, atau target peningkatan standar baru.',
      'Tinjau pratinjau dokumen beserta grafik capaian, ringkasan statistik, dan blok pengesahan resmi.',
      'Klik "Export Word (.docx)" untuk menghasilkan berkas Microsoft Word siap sunting, atau "Export PDF (.pdf)" untuk mengunduh dokumen PDF resmi siap cetak.',
    ],
    buttons: [
      {
        name: '4 Kartu Jenis Dokumen & Pemilih Level Laporan',
        role: 'Semua Peran sesuai cakupan akses',
        action:
          'Memilih sistematika laporan SPMI dan cakupan level unit (Prodi, Fakultas, atau Universitas).',
      },
      {
        name: 'Edit Metadata & Narasi',
        role: 'Semua Peran',
        action:
          'Menyesuaikan metadata tim auditor, tanggal, keputusan RTM, dan narasi tindak lanjut.',
      },
      {
        name: 'Export Word (.docx) & Export PDF (.pdf)',
        role: 'Semua Peran dengan izin Ekspor',
        action:
          'Mengunduh laporan SPMI lengkap (.docx atau .pdf) beserta grafik dan analisis statistik.',
      },
    ],
  },
  {
    id: 'modul-11',
    badge: 'Modul 11',
    title: '11. Manajemen Pengguna & Sistem',
    targetTab: 'manajemen',
    summary:
      'Modul administrasi khusus Super Admin, Admin LPMPP, dan Lembaga untuk mengelola akun & wewenang pengguna terverifikasi, mengatur status siklus PPEPP, dan mendaftarkan Program Studi baru.',
    steps: [
      'Pada bagian Manajemen Pengguna Terpadu, cari nama/email/NIP pengguna dan klik "Edit Profil & Peran" untuk mengatur Role (SUPER_ADMIN, ADMIN_LPMPP, KAPRODI, AUDITOR_AMI, DEKANAT, REKTORAT, LEMBAGA, PUSAT, ASESOR_LAM, ASESOR_BANPT) serta penautan unit_kode (kode prodi atau nama fakultas).',
      'Klik "Segarkan" untuk menarik daftar akun pengguna terbaru dari basis data pusat.',
      'Pada bagian Manajemen Siklus & Prodi, ubah status siklus PPEPP (Aktif, Selesai, Ditutup) atau klik "+ Tambah Prodi Baru" untuk menambahkan program studi baru.',
    ],
    buttons: [
      {
        name: 'Edit Profil & Peran Pengguna',
        role: 'Super Admin & Admin LPMPP',
        action:
          'Memperbarui nama, NIP, jabatan, hak akses peran, dan unit kerja pengguna ke server pusat.',
      },
      {
        name: 'Status Siklus & + Tambah Prodi Baru',
        role: 'Super Admin, Admin LPMPP & Lembaga (Siklus)',
        action:
          'Mengatur status periode siklus PPEPP dan menambah master Program Studi baru.',
      },
    ],
  },
];

export const TabPanduanPenggunaan: React.FC<TabPanduanPenggunaanProps> = ({
  onNavigateTab,
  onOpenNewProdi,
  allowedTabs,
  canCreateProdi = true,
}) => {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.badge.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.steps.some((s) => s.toLowerCase().includes(q)) ||
        sec.buttons.some(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.role.toLowerCase().includes(q) ||
            b.action.toLowerCase().includes(q)
        )
    );
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-lg bg-blue-900 p-2.5 text-amber-400 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Panduan Lengkap Penggunaan PPEPP UNPATTI
              </h2>
              <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                Alur operasional lengkap mulai dari login akun resmi, sinkronisasi real-time Cloud, pengisian Modul 00 s.d. 11, perengkingan & klasterisasi mutu, hingga ekspor laporan Word, PDF, dan Excel.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari modul, peran, atau fitur..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Role & Integration Summary Strip */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900">
              <ShieldCheck className="h-4 w-4" />
              Autentikasi & Multi-Peran Terstandarisasi
            </div>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Login email/password terintegrasi akun institusional resmi. Kaprodi otomatis terkunci ke prodinya, Auditor menilai & memverifikasi Monev, Dekanat menyetujui PTK, dan Admin mengelola seluruh sistem.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Cloud className="h-4 w-4 text-emerald-600" />
              Penyimpanan Real-Time Terpusat
            </div>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Master Prodi, Indikator, dan isian Evaluasi tersimpan otomatis secara real-time. Indikator yang belum diisi dimulai dari kondisi kosong siap pakai.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <FileDown className="h-4 w-4 text-amber-600" />
                Ekspor Word, PDF, HTML & Excel
              </div>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Laporan AMI, RTM, Efektivitas SPMI, Perengkingan, dan PTK/RTL mendukung ekspor <strong>.docx</strong>, <strong>.pdf</strong>, <strong>.xlsx</strong>, dan pratinjau cetak ber-kop UNPATTI.
              </p>
            </div>
            {canCreateProdi && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onOpenNewProdi}
                  className="text-[11px] font-semibold text-blue-900 hover:underline"
                >
                  + Prodi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Tidak ditemukan bagian panduan yang cocok dengan kata kunci &ldquo;{query}&rdquo;.
          </div>
        ) : (
          filteredSections.map((sec) => {
            const canOpenTarget =
              Boolean(sec.targetTab) &&
              (!allowedTabs || allowedTabs.includes(sec.targetTab!));

            return (
              <section
                key={sec.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      {sec.badge}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {sec.title}
                    </h3>
                  </div>
                  {sec.targetTab && canOpenTarget && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab(sec.targetTab!)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Buka {sec.badge}
                      <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {sec.summary}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2.5">
                        Langkah Penggunaan Rinci
                      </h4>
                      <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside">
                        {sec.steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2.5">
                        Daftar Tombol & Kontrol Akses
                      </h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Tombol / Aksi</th>
                              <th className="px-3 py-2 font-semibold w-32">Peran</th>
                              <th className="px-3 py-2 font-semibold">Fungsi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {sec.buttons.map((btn, idx) => (
                              <tr key={idx} className="align-top">
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {btn.name}
                                </td>
                                <td className="px-3 py-2 text-blue-900 font-medium">
                                  {btn.role}
                                </td>
                                <td className="px-3 py-2 text-slate-600 leading-snug">
                                  {btn.action}
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
            );
          })
        )}
      </div>
    </div>
  );
};
