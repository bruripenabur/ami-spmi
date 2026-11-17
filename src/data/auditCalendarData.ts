export interface AuditCalendarEvent {
  id: string;
  nama_kegiatan: string;
  tahapan_siklus: string;
  tanggal_mulai: string;
  tanggal_tenggat: string;
  unit_prodi: string;
  status: 'Selesai' | 'Akan Datang' | 'Minggu Ini' | 'Terlambat';
  keterangan: string;
}

export const INITIAL_AUDIT_CALENDAR: AuditCalendarEvent[] = [
  {
    id: 'cal-1',
    nama_kegiatan: 'Sosialisasi Instrumen SPMI & Unggah Dokumen Pendirian',
    tahapan_siklus: 'Persiapan',
    tanggal_mulai: '2025-10-01',
    tanggal_tenggat: '2025-10-15',
    unit_prodi: 'Semua 118 Program Studi',
    status: 'Selesai',
    keterangan: 'Sosialisasi daring via Zoom & unggah portofolio awal di SIMPATTI.',
  },
  {
    id: 'cal-2',
    nama_kegiatan: 'Pengisian Evaluasi Diri & Rubrik 1-7 oleh Kaprodi',
    tahapan_siklus: 'Pengisian Instrumen',
    tanggal_mulai: '2025-10-16',
    tanggal_tenggat: '2025-11-15',
    unit_prodi: 'Semua 118 Program Studi',
    status: 'Selesai',
    keterangan: 'Pengisian 10 standar SPMI & penautan bukti Google Drive.',
  },
  {
    id: 'cal-3',
    nama_kegiatan: 'Audit Kecukupan & Desk Evaluation oleh Tim Auditor',
    tahapan_siklus: 'Audit Kecukupan',
    tanggal_mulai: '2025-11-16',
    tanggal_tenggat: '2025-11-30',
    unit_prodi: 'Fakultas & Prodi Binaan SK LPMPP',
    status: 'Selesai',
    keterangan: 'Verifikasi dokumen instrumen, penilaian capaian, dan penentuan awal temuan.',
  },
  {
    id: 'cal-4',
    nama_kegiatan: 'Audit Lapangan / Visitasi Program Studi',
    tahapan_siklus: 'Audit Lapangan',
    tanggal_mulai: '2025-12-01',
    tanggal_tenggat: '2025-12-20',
    unit_prodi: 'Seluruh Fakultas & PSDKU',
    status: 'Selesai',
    keterangan: 'Wawancara pimpinan prodi, dosen, mahasiswa, dan peninjauan fasilitas.',
  },
  {
    id: 'cal-5',
    nama_kegiatan: 'Penyusunan & Pengesahan Dekan atas PTK / RTL',
    tahapan_siklus: 'Penyusunan PTK/RTL',
    tanggal_mulai: '2026-01-02',
    tanggal_tenggat: '2026-01-20',
    unit_prodi: 'Kaprodi & Dekanat Fakultas',
    status: 'Selesai',
    keterangan: 'Penyusunan akar masalah PLOR+CA dan persetujuan Dekan.',
  },
  {
    id: 'cal-6',
    nama_kegiatan: 'Monitoring & Evaluasi (Monev) Tindak Lanjut PTK',
    tahapan_siklus: 'Monev Berjenjang',
    tanggal_mulai: '2026-02-01',
    tanggal_tenggat: '2026-02-28',
    unit_prodi: 'Tim Auditor LPMPP & Prodi',
    status: 'Minggu Ini',
    keterangan: 'Pemeriksaan bukti realisasi perbaikan dan verifikasi penutupan temuan.',
  },
  {
    id: 'cal-7',
    nama_kegiatan: 'Rapat Tinjauan Manajemen (RTM) & Pelaporan Rektorat',
    tahapan_siklus: 'RTM & Pelaporan',
    tanggal_mulai: '2026-03-01',
    tanggal_tenggat: '2026-03-15',
    unit_prodi: 'Pimpinan Universitas, LPMPP & Dekan',
    status: 'Akan Datang',
    keterangan: 'Sidang pleno RTM penyampaian efektivitas siklus PPEPP universitas.',
  },
];
