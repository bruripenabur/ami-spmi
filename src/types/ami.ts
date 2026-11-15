export type UserRole = 'auditee' | 'auditor';

export type KategoriTemuan =
  | 'Mayor'
  | 'Minor'
  | 'Observasi'
  | 'Sesuai (Baik)'
  | 'Best Practice';

export type MonevStatus = 'Open' | 'In Progress' | 'Closed - Verified';

export type JenisProdi = 'Non-Kependidikan' | 'Kependidikan';

export type PeringkatAkreditasi =
  | 'Unggul'
  | 'Baik Sekali'
  | 'Baik'
  | 'Terakreditasi Pertama'
  | 'Terakreditasi'
  | 'A'
  | 'B'
  | 'C'
  | 'Belum Terakreditasi';

export interface PlorCaData {
  problem: string;
  location: string;
  objectiveEvidence: string;
  reference: string;
  correction: string;
  action: string;
}

export interface StudyProgramIdentity {
  id: string;
  kode_pt: string;
  nama_pt: string;
  alamat_pusat: string;
  kode_pos: string;
  jenis_prodi: JenisProdi;
  fakultas: string;
  pengelola_pembelajaran: string;
  alamat_pengelola: string;
  kode_ps: string;
  nama_jurusan: string;
  nama_prodi: string;
  tanggal_pendirian: string;
  no_sk_pendirian: string;
  no_sk_operasional: string;
  peringkat_akreditasi: PeringkatAkreditasi;
  riwayat_akreditasi: {
    akreditasi_1: string;
    akreditasi_2: string;
    akreditasi_3: string;
    akreditasi_4: string;
    akreditasi_5: string;
  };
  tanggal_kedaluwarsa_akreditasi: string;
  alamat_prodi: string;
  email_prodi: string;
  telepon_prodi: string;
  website_prodi: string;
  visi_prodi: string;
  misi_prodi: string;
  kompetensi_lulusan: string;
  kriteria_lulusan: {
    sks_minimal: number;
    nilai_d_maksimal: number;
    ipk_minimal: number;
    toefl_minimal: number;
    syarat_lainnya: string;
  };
  jumlah_mahasiswa_ts: number;
  jumlah_lulusan_ts: number;
  jumlah_dosen_homebase_ts: number;
  jumlah_dosen_tetap_ts: number;
  jumlah_dosen_tidak_tetap_ts: number;
  tenaga_kependidikan: {
    s3: number;
    s2: number;
    s1: number;
    diploma: number;
    sma: number;
  };
  kaprodi_nama: string;
  kaprodi_nip: string;
  kaprodi_hp: string;
  dekan_nama: string;
  dekan_nip: string;
  tahun_siklus_ppepp: string;
  tempat_pengesahan: string;
  tahun_pengesahan: string;
}

export interface AmiStandard {
  id: number;
  kode: string;
  nama: string;
  bobot: number;
}

export type RubricLevelKey = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AmiIndicator {
  id: string;
  standard_id: number;
  code: string;
  uraian: string;
  rubric_levels: Record<RubricLevelKey, string>;
}

export type PtkWorkflowStatus =
  | 'Draft Prodi'
  | 'Menunggu Persetujuan Dekan'
  | 'Disetujui Dekan (Siap Monev)'
  | 'Terverifikasi Auditor (Closed-Verified)';

export interface AmiEvaluation {
  indicator_id: string;
  nilai_capaian: RubricLevelKey | null;
  target_1_yr: RubricLevelKey | null;
  kategori_override: KategoriTemuan | null;
  akar_masalah: string;
  plor_ca: PlorCaData;
  ptk_rtl: string;
  pic: string;
  waktu_ptk: string;
  waktu_monev: string;
  bukti_link: string;
  bukti_realisasi: string;
  tanggal_penyelesaian: string;
  monev_status: MonevStatus;
  ptk_workflow_status?: PtkWorkflowStatus;
  dekan_catatan?: string;
  dekan_approved_by?: string;
  dekan_approved_at?: string;
}

export interface AmiCycle {
  id: string;
  tahun_siklus: string;
  label: string;
  status: 'Persiapan' | 'Aktif' | 'Selesai';
}

export interface StandardRecap {
  standardId: number;
  kode: string;
  nama: string;
  bobot: number;
  indicatorCount: number;
  avgCapaianRaw: number;
  avgTargetRaw: number;
  nilaiCapaian: number; // 0-100 scale
  sebutanCapaian: string;
  nilaiTarget: number; // 0-100 scale
  sebutanTarget: string;
  kategoriTemuan: KategoriTemuan | null;
  counts: {
    Mayor: number;
    Minor: number;
    Observasi: number;
    'Sesuai (Baik)': number;
    'Best Practice': number;
  };
}

export interface OverallAmiRecap {
  rataRataCapaianTerbobot: number;
  rataRataTargetTerbobot: number;
  sebutanOverall: string;
  totalIndikator: number;
  totalCounts: {
    Mayor: number;
    Minor: number;
    Observasi: number;
    'Sesuai (Baik)': number;
    'Best Practice': number;
  };
}

export type AmiTabId =
  | 'dashboard'
  | 'identitas'
  | 'instrumen'
  | 'rekap'
  | 'laporan'
  | 'temuan'
  | 'ptk'
  | 'monev'
  | 'panduan'
  | 'perengkingan'
  | 'laporan_spmi'
  | 'manajemen';

export type PpeppCluster = 'Unggul' | 'Stabil' | 'Menurun' | 'Pembinaan';

export type RankingTier = 'all' | 'top10' | 'top25' | 'top50';

export interface ProdiRankingEntry {
  rank: number;
  program: StudyProgramIdentity;
  cycleYear: string;
  prevCycleYear: string | null;
  penetapan: number;
  pelaksanaan: number;
  evaluasi: number;
  pengendalian: number;
  peningkatan: number;
  indeksPpepp: number;
  skorAmiTerbobot: number;
  skorAwal: number;
  penaltiMayor: number;
  penaltiMinor: number;
  penaltiObservasi: number;
  bonusBestPractice: number;
  skorIndeksKualitas: number;
  prevSkorIndeksKualitas: number | null;
  deltaKualitas: number;
  prevIndeksPpepp: number | null;
  deltaPpepp: number;
  ktsMayor: number;
  ktsMinor: number;
  observasi: number;
  bestPractice: number;
  ptkClosedPct: number;
  cluster: PpeppCluster;
  clusterReason: string;
}

export type RbacRole =
  | 'kaprodi'
  | 'auditor'
  | 'dekanat'
  | 'rektorat'
  | 'lembaga'
  | 'pusat'
  | 'asesor_lam'
  | 'asesor_banpt'
  | 'admin';

export type LembagaEntity = 'LPMPP' | 'LPPM';

export interface RoleAssignment {
  id: string;
  role: RbacRole;
  label: string;
  unitName: string;
  prodiId?: string;
  fakultas?: string;
  assignedProdiIds?: string[];
  assignedCycleYears?: string[];
  lembagaEntity?: LembagaEntity;
  pusatName?: string;
  allowedStandardIds?: number[];
}

export interface RbacUserAccount {
  id: string;
  username: string;
  nip: string;
  email: string;
  password: string;
  nama: string;
  gelarUnit: string;
  roles: RoleAssignment[];
  isActive: boolean;
}

export interface SsoUserProfile {
  id: string;
  email: string;
  full_name: string;
  nip: string;
  jabatan: string;
  role: string;
  unit_kode: string;
}

export interface RbacPermissions {
  role: RbacRole;
  assignment: RoleAssignment;
  legacyMode: UserRole;
  roleDisplayName: string;
  badgeColorClass: string;
  isExternalAssessor: boolean;
  isStrictReadOnly: boolean;
  readOnlyBanner: string | null;
  scopeLabel: string;
  lockFakultas: boolean;
  lockProdi: boolean;
  allowedFakultas: string[] | 'all';
  allowedProdiIds: string[] | 'all';
  allowedCycleYears: string[] | 'all';
  allowedStandardIds: number[] | 'all';
  allowedTabs: AmiTabId[];
  canCreateProdi: boolean;
  canEditIdentitas: boolean;
  canEditInstrumenEvidence: boolean;
  canScoreInstrumen: boolean;
  canCrudIndicators: boolean;
  canEditPlorCa: boolean;
  canEditPtkDraft: boolean;
  canSubmitPtkToDekan: boolean;
  canApprovePtkDekan: boolean;
  canUploadMonevEvidence: boolean;
  canVerifyMonevClosed: boolean;
  canManageCycleStatus: boolean;
  canManageUsers: boolean;
  canSyncSupabase: boolean;
  canExportReports: boolean;
}

export type SpmiReportScopeLevel = 'prodi' | 'fakultas' | 'universitas';

export type SpmiReportType =
  | 'ami'
  | 'rtm'
  | 'efektivitas_ppepp'
  | 'perbaikan_peningkatan';

export interface RtmDecisionItem {
  id: string;
  agenda: string;
  keputusan: string;
  sumberDaya: string;
  pic: string;
  tenggat: string;
}

export interface StandardUpgradeItem {
  id: string;
  namaStandar: string;
  targetLama: string;
  targetBaru: string;
  alasanPeningkatan: string;
  dokumenRevisi: string;
}

export interface SpmiReportMeta {
  nomorDokumen: string;
  noSkAuditor: string;
  ketuaAuditor: string;
  ketuaAuditorNip: string;
  anggotaAuditor1: string;
  anggotaAuditor2: string;
  tanggalAudit: string;
  lokasiAudit: string;
  kepalaLpmppNama: string;
  kepalaLpmppNip: string;
  pimpinanRtmNama: string;
  pimpinanRtmJabatan: string;
  tanggalRtm: string;
  tempatRtm: string;
  jadwalRtmBerikutnya: string;
  rtmSebelumnyaRingkasan: string;
  umpanBalikStakeholder: string;
  arahanPimpinanRtm: string;
  alokasiSumberDayaRtm: string;
  faktorPendukung: string;
  faktorPenghambat: string;
  kesimpulan: string;
  saran: string;
  rtmDecisions: RtmDecisionItem[];
  standardUpgrades: StandardUpgradeItem[];
}

