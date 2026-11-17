import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  JenisProdi,
  KategoriTemuan,
  MonevStatus,
  PeringkatAkreditasi,
  PlorCaData,
  RubricLevelKey,
  SsoUserProfile,
  StudyProgramIdentity,
} from '../types/ami';
import {
  AMI_STANDARDS,
  AMI_INDICATORS,
  AMI_INDICATORS_KEPENDIDIKAN,
} from '../data/amiInstrumentData';
import { UNPATTI_118_PROGRAMS } from '../data/unpattiPrograms118';

export const SUPABASE_URL = 'https://eysccwxpgdcoqfvaalye.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_z-P7ucdZVBwh8dH4kcU7Pg_mH6vL9P8';

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

const LEGACY_LOCAL_STORAGE_KEYS = [
  'siami_unpatti_workspace_v2',
  'siami_unpatti_workspace_v1',
  'ppepp_unpatti_rbac_users_v1',
  'ppepp_unpatti_auth_session_v1',
  'siami_unpatti_state_v2',
  'siami_unpatti_state_v1',
  'siami_unpatti_rbac_v1',
  'siami_unpatti_supabase_config_v1',
];

export function clearLegacyLocalStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch {
    // ignore storage errors
  }
}

export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Galat tidak diketahui saat menghubungi Supabase.';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    if (parts.length > 0) {
      return `${parts.join(' — ')}${e.code ? ` (Kode: ${e.code})` : ''}`;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Galat objek Supabase.';
    }
  }
  return String(err);
}

// ============================================================================
// AUTH & SSO USER PROFILES (sso_user_profiles)
// ============================================================================

export async function fetchUserProfile(
  userId: string
): Promise<SsoUserProfile | null> {
  const { data, error } = await supabase
    .from('sso_user_profiles')
    .select('id, email, full_name, nip, jabatan, role, unit_kode')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;

  return {
    id: String(data.id),
    email: String(data.email ?? ''),
    full_name: String(data.full_name ?? ''),
    nip: String(data.nip ?? ''),
    jabatan: String(data.jabatan ?? ''),
    role: String(data.role ?? ''),
    unit_kode: String(data.unit_kode ?? ''),
  };
}

export async function fetchAllUserProfiles(): Promise<SsoUserProfile[]> {
  const { data, error } = await supabase
    .from('sso_user_profiles')
    .select('id, email, full_name, nip, jabatan, role, unit_kode')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email ?? ''),
    full_name: String(row.full_name ?? ''),
    nip: String(row.nip ?? ''),
    jabatan: String(row.jabatan ?? ''),
    role: String(row.role ?? ''),
    unit_kode: String(row.unit_kode ?? ''),
  }));
}

export async function updateUserProfileInSupabase(
  userId: string,
  patch: Partial<
    Pick<SsoUserProfile, 'full_name' | 'nip' | 'jabatan' | 'role' | 'unit_kode'>
  >
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sso_user_profiles')
      .update(patch)
      .eq('id', userId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

// ============================================================================
// MASTER DATA: PROGRAM STUDI (ppepp_prodi)
// ============================================================================

interface PpeppProdiRow {
  kode_prodi: string;
  nama_prodi: string;
  fakultas: string;
  jenis_prodi: string;
  akreditasi: string | null;
  nama_kaprodi: string | null;
  created_at?: string | null;
}

const VALID_AKREDITASI: PeringkatAkreditasi[] = [
  'Unggul',
  'Baik Sekali',
  'Baik',
  'Terakreditasi Pertama',
  'Terakreditasi',
  'A',
  'B',
  'C',
  'Belum Terakreditasi',
];

function normalizeAkreditasi(val?: string | null): PeringkatAkreditasi {
  if (!val) return 'Baik';
  const matched = VALID_AKREDITASI.find(
    (item) => item.toLowerCase() === val.trim().toLowerCase()
  );
  return matched ?? 'Baik';
}

function normalizeJenisProdi(val?: string | null): JenisProdi {
  if (val && val.trim().toLowerCase() === 'kependidikan') {
    return 'Kependidikan';
  }
  return 'Non-Kependidikan';
}

function buildFallbackProgramIdentity(row: PpeppProdiRow): StudyProgramIdentity {
  const jenis = normalizeJenisProdi(row.jenis_prodi);
  const akred = normalizeAkreditasi(row.akreditasi);
  const kode = String(row.kode_prodi ?? '').trim();
  const nama = String(row.nama_prodi ?? '').trim();
  const fakultas = String(row.fakultas ?? '').trim();

  return {
    id: kode,
    kode_pt: '001021',
    nama_pt: 'Universitas Pattimura',
    alamat_pusat:
      'Jl. Ir. M. Putuhena, Kampus Poka, Teluk Ambon, Kota Ambon, Maluku',
    kode_pos: '97233',
    jenis_prodi: jenis,
    fakultas,
    pengelola_pembelajaran: fakultas,
    alamat_pengelola:
      'Kampus Universitas Pattimura Poka, Jl. Ir. M. Putuhena, Ambon',
    kode_ps: kode,
    nama_jurusan: nama,
    nama_prodi: nama,
    tanggal_pendirian: '',
    no_sk_pendirian: '',
    no_sk_operasional: '',
    peringkat_akreditasi: akred,
    riwayat_akreditasi: {
      akreditasi_1: akred,
      akreditasi_2: '',
      akreditasi_3: '',
      akreditasi_4: '',
      akreditasi_5: '',
    },
    tanggal_kedaluwarsa_akreditasi: '',
    alamat_prodi:
      'Kampus Poka Universitas Pattimura, Jl. Ir. M. Putuhena, Ambon',
    email_prodi: `${kode.toLowerCase()}@unpatti.ac.id`,
    telepon_prodi: '(0911) 322626',
    website_prodi: 'https://unpatti.ac.id',
    visi_prodi: `Menjadi program studi ${nama} yang unggul, berkarakter kepulauan, dan berdaya saing nasional menuju kawasan Indo-Pasifik.`,
    misi_prodi: `1. Menyelenggarakan pembelajaran bermutu berbasis OBE di bidang ${nama}.\n2. Menghasilkan riset terapan dan publikasi ilmiah yang berkontribusi pada pembangunan masyarakat Maluku.\n3. Memperluas jejaring kemitraan pendidikan, pemerintah daerah, dan DUDI secara berkelanjutan.`,
    kompetensi_lulusan: `PLO-1: Menguasai konsep teoretis dan metodologi mutakhir bidang ${nama}.\nPLO-2: Mampu merumuskan solusi permasalahan profesional secara analitis, etis, dan berbasis data kepulauan.\nPLO-3: Mampu berkolaborasi lintas disiplin, berkomunikasi efektif, dan belajar sepanjang hayat.`,
    cpl_prodi: `CPL-1: Mampu menerapkan pengetahuan bidang keilmuan ${nama} dalam penyelesaian masalah berbasis penalaran ilmiah.\nCPL-2: Mampu menunjukkan akuntabilitas profesional, etika akademik, dan karakter kepulauan dalam praktik keprofesian.`,
    kriteria_lulusan: {
      sks_minimal: 144,
      nilai_d_maksimal: 2,
      ipk_minimal: 2.75,
      toefl_minimal: 450,
      syarat_lainnya: 'Lulus Ujian Skripsi / Tugas Akhir & Sertifikat Kompetensi',
    },
    jumlah_mahasiswa_ts: 0,
    jumlah_lulusan_ts: 0,
    jumlah_dosen_homebase_ts: 0,
    jumlah_dosen_tetap_ts: 0,
    jumlah_dosen_tidak_tetap_ts: 0,
    tenaga_kependidikan: {
      s3: 0,
      s2: 0,
      s1: 0,
      diploma: 0,
      sma: 0,
    },
    kaprodi_nama: String(row.nama_kaprodi ?? ''),
    kaprodi_nip: '',
    kaprodi_hp: '',
    dekan_nama: '',
    dekan_nip: '',
    tahun_siklus_ppepp: '2025/2026',
    tempat_pengesahan: 'Ambon',
    tahun_pengesahan: '2026',
    iku_target: 'IKU-1 Lulusan Mendapat Pekerjaan Layak (Target >= 80%); IKU-2 Mahasiswa Berkegiatan di Luar Kampus (Target >= 30%); IKU-3 Dosen Berkegiatan di Luar Kampus (Target >= 25%).',
    ikt_syarat_unggul: 'Syarat Perlu Unggul LAM / BAN-PT: Persentase kelulusan tepat waktu >= 50%, IPK rata-rata lulusan >= 3.00, publikasi ilmiah mahasiswa.',
    ikk_internasional: 'Status Akreditasi Internasional: Belum / Dalam Persiapan (ACQUIN / ASIIN).',
  };
}

export function mapProdiRowToIdentity(
  row: PpeppProdiRow
): StudyProgramIdentity {
  const kode = String(row.kode_prodi ?? '').trim();
  const baseMatch = UNPATTI_118_PROGRAMS.find(
    (p) => p.kode_ps.trim().toLowerCase() === kode.toLowerCase()
  );

  if (baseMatch) {
    return {
      ...baseMatch,
      kode_ps: kode,
      nama_prodi: String(row.nama_prodi || baseMatch.nama_prodi),
      fakultas: String(row.fakultas || baseMatch.fakultas),
      jenis_prodi: row.jenis_prodi
        ? normalizeJenisProdi(row.jenis_prodi)
        : baseMatch.jenis_prodi,
      peringkat_akreditasi: row.akreditasi
        ? normalizeAkreditasi(row.akreditasi)
        : baseMatch.peringkat_akreditasi,
      kaprodi_nama:
        row.nama_kaprodi !== null && row.nama_kaprodi !== undefined
          ? String(row.nama_kaprodi)
          : baseMatch.kaprodi_nama,
    };
  }

  return buildFallbackProgramIdentity(row);
}

export async function fetchProdiFromSupabase(): Promise<StudyProgramIdentity[]> {
  const allRows: PpeppProdiRow[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ppepp_prodi')
      .select(
        'kode_prodi, nama_prodi, fakultas, jenis_prodi, akreditasi, nama_kaprodi, created_at'
      )
      .order('kode_prodi', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as PpeppProdiRow[];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  if (allRows.length === 0) {
    return UNPATTI_118_PROGRAMS;
  }

  return allRows.map(mapProdiRowToIdentity);
}

export async function insertProdiToSupabase(
  prodi: StudyProgramIdentity
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = {
      kode_prodi: prodi.kode_ps.trim(),
      nama_prodi: prodi.nama_prodi.trim(),
      fakultas: prodi.fakultas.trim(),
      jenis_prodi: prodi.jenis_prodi,
      akreditasi: prodi.peringkat_akreditasi,
      nama_kaprodi: prodi.kaprodi_nama.trim(),
    };
    const { error } = await supabase.from('ppepp_prodi').insert(payload);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

export async function updateProdiInSupabase(
  prodi: StudyProgramIdentity
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ppepp_prodi')
      .update({
        nama_prodi: prodi.nama_prodi,
        fakultas: prodi.fakultas,
        jenis_prodi: prodi.jenis_prodi,
        akreditasi: prodi.peringkat_akreditasi,
        nama_kaprodi: prodi.kaprodi_nama,
      })
      .eq('kode_prodi', prodi.kode_ps);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

// ============================================================================
// MASTER DATA: INDIKATOR (ppepp_indikator)
// ============================================================================

interface PpeppIndikatorRow {
  id: number;
  kode_standar: string;
  nama_standar: string;
  nomor_indikator: string;
  uraian_indikator: string;
  jenis_instrumen: string;
  rubrik_json: Record<string, string> | null;
}

export function resolveStandardIdFromKode(kodeStandar: string): number {
  const norm = String(kodeStandar ?? '')
    .trim()
    .toUpperCase();
  const found = AMI_STANDARDS.find((s) => s.kode.toUpperCase() === norm);
  if (found) return found.id;
  const numMatch = norm.match(/(\d+)/);
  if (numMatch) {
    const parsed = Number(numMatch[1]);
    if (parsed >= 1 && parsed <= 10) return parsed;
  }
  return 1;
}

export function resolveKodeStandarFromId(standardId: number): string {
  const found = AMI_STANDARDS.find((s) => s.id === standardId);
  if (found) return found.kode;
  return `STD-${String(standardId).padStart(2, '0')}`;
}

export function resolveNamaStandarFromId(standardId: number): string {
  const found = AMI_STANDARDS.find((s) => s.id === standardId);
  return found?.nama ?? `Standar ${standardId}`;
}

function normalizeRubricLevels(
  raw: Record<string, string> | null | undefined
): Record<RubricLevelKey, string> {
  const r = raw ?? {};
  return {
    1: String(r['1'] ?? ''),
    2: String(r['2'] ?? ''),
    3: String(r['3'] ?? ''),
    4: String(r['4'] ?? ''),
    5: String(r['5'] ?? ''),
    6: String(r['6'] ?? ''),
    7: String(r['7'] ?? ''),
  };
}

export function mapIndikatorRowToAmiIndicator(
  row: PpeppIndikatorRow
): AmiIndicator {
  return {
    id: String(row.id),
    standard_id: resolveStandardIdFromKode(row.kode_standar),
    code: String(row.nomor_indikator ?? ''),
    uraian: String(row.uraian_indikator ?? ''),
    rubric_levels: normalizeRubricLevels(row.rubrik_json),
  };
}

export async function fetchIndicatorsFromSupabase(): Promise<
  Record<JenisProdi, AmiIndicator[]>
> {
  const allRows: PpeppIndikatorRow[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ppepp_indikator')
      .select(
        'id, kode_standar, nama_standar, nomor_indikator, uraian_indikator, jenis_instrumen, rubrik_json'
      )
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as PpeppIndikatorRow[];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  if (allRows.length === 0) {
    return {
      'Non-Kependidikan': AMI_INDICATORS,
      Kependidikan: AMI_INDICATORS_KEPENDIDIKAN,
    };
  }

  const nonKependidikan: AmiIndicator[] = [];
  const kependidikan: AmiIndicator[] = [];

  allRows.forEach((row) => {
    const mapped = mapIndikatorRowToAmiIndicator(row);
    if (
      String(row.jenis_instrumen ?? '')
        .trim()
        .toLowerCase() === 'kependidikan'
    ) {
      kependidikan.push(mapped);
    } else {
      nonKependidikan.push(mapped);
    }
  });

  return {
    'Non-Kependidikan': nonKependidikan,
    Kependidikan: kependidikan,
  };
}

export async function insertIndicatorToSupabase(
  jenis: JenisProdi,
  indicator: Omit<AmiIndicator, 'id'>
): Promise<{ ok: boolean; data?: AmiIndicator; error?: string }> {
  try {
    const payload = {
      kode_standar: resolveKodeStandarFromId(indicator.standard_id),
      nama_standar: resolveNamaStandarFromId(indicator.standard_id),
      nomor_indikator: indicator.code,
      uraian_indikator: indicator.uraian,
      jenis_instrumen: jenis,
      rubrik_json: indicator.rubric_levels,
    };

    const { data, error } = await supabase
      .from('ppepp_indikator')
      .insert(payload)
      .select(
        'id, kode_standar, nama_standar, nomor_indikator, uraian_indikator, jenis_instrumen, rubrik_json'
      )
      .single();

    if (error) throw error;
    return {
      ok: true,
      data: mapIndikatorRowToAmiIndicator(data as PpeppIndikatorRow),
    };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

export async function updateIndicatorToSupabase(
  jenis: JenisProdi,
  indicator: AmiIndicator
): Promise<{ ok: boolean; error?: string }> {
  try {
    const numId = Number(indicator.id);
    if (!Number.isFinite(numId)) {
      return {
        ok: false,
        error: `ID indikator "${indicator.id}" bukan integer yang valid.`,
      };
    }

    const { error } = await supabase
      .from('ppepp_indikator')
      .update({
        kode_standar: resolveKodeStandarFromId(indicator.standard_id),
        nama_standar: resolveNamaStandarFromId(indicator.standard_id),
        nomor_indikator: indicator.code,
        uraian_indikator: indicator.uraian,
        jenis_instrumen: jenis,
        rubrik_json: indicator.rubric_levels,
      })
      .eq('id', numId);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

export async function deleteIndicatorToSupabase(
  indicatorId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const numId = Number(indicatorId);
    if (!Number.isFinite(numId)) {
      return {
        ok: false,
        error: `ID indikator "${indicatorId}" bukan integer yang valid.`,
      };
    }
    const { error } = await supabase
      .from('ppepp_indikator')
      .delete()
      .eq('id', numId);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}

// ============================================================================
// EVALUATIONS (ppepp_evaluasi)
// ============================================================================

export interface PpeppEvaluasiRow {
  id?: string | number;
  siklus: string;
  kode_prodi: string;
  indikator_id: number;
  nilai_capaian: number | null;
  target_capaian: number | null;
  kategori_temuan: string | null;
  plor_ca: Record<string, unknown> | null;
  ptk_rtl: string | null;
  pic: string | null;
  waktu_selesai_ptk: string | null;
  waktu_monev: string | null;
  bukti_link: string | null;
  updated_at?: string | null;
}

const VALID_KATEGORI: KategoriTemuan[] = [
  'Mayor',
  'Minor',
  'Observasi',
  'Sesuai (Baik)',
  'Best Practice',
];

function normalizeKategoriTemuan(
  val: string | null | undefined
): KategoriTemuan | null {
  if (!val) return null;
  const trimmed = val.trim();
  const matched = VALID_KATEGORI.find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  return matched ?? null;
}

function normalizeScore(val: number | null | undefined): RubricLevelKey | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  if (!Number.isInteger(num) || num < 1 || num > 7) return null;
  return num as RubricLevelKey;
}

function normalizePlorCa(raw: Record<string, unknown> | null | undefined): PlorCaData {
  const r = raw ?? {};
  return {
    problem: String(r.problem ?? ''),
    location: String(r.location ?? ''),
    objectiveEvidence: String(r.objective_evidence ?? r.objectiveEvidence ?? ''),
    reference: String(r.reference ?? ''),
    correction: String(r.correction ?? ''),
    action: String(r.action ?? ''),
  };
}

function normalizeIsoDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

export function mapEvaluasiRowToAmiEvaluation(
  row: PpeppEvaluasiRow
): AmiEvaluation {
  const plorCa = normalizePlorCa(row.plor_ca);
  const rawExtra = (row.plor_ca ?? {}) as Record<string, unknown>;
  const monevRaw = String(rawExtra.monev_status ?? '');
  const monevStatus: MonevStatus =
    monevRaw === 'In Progress' || monevRaw === 'Closed - Verified'
      ? monevRaw
      : 'Open';

  return {
    indicator_id: String(row.indikator_id),
    nilai_capaian: normalizeScore(row.nilai_capaian),
    target_1_yr: normalizeScore(row.target_capaian),
    kategori_override: normalizeKategoriTemuan(row.kategori_temuan),
    akar_masalah: plorCa.problem,
    plor_ca: plorCa,
    ptk_rtl: String(row.ptk_rtl ?? ''),
    pic: String(row.pic ?? ''),
    waktu_ptk: row.waktu_selesai_ptk ? String(row.waktu_selesai_ptk) : '',
    waktu_monev: row.waktu_monev ? String(row.waktu_monev) : '',
    bukti_link: String(row.bukti_link ?? ''),
    bukti_realisasi: String(rawExtra.bukti_realisasi ?? ''),
    tanggal_penyelesaian: String(rawExtra.tanggal_penyelesaian ?? ''),
    monev_status: monevStatus,
    ptk_workflow_status:
      (rawExtra.ptk_workflow_status as AmiEvaluation['ptk_workflow_status']) ??
      'Draft Prodi',
    dekan_catatan: rawExtra.dekan_catatan
      ? String(rawExtra.dekan_catatan)
      : undefined,
    dekan_approved_by: rawExtra.dekan_approved_by
      ? String(rawExtra.dekan_approved_by)
      : undefined,
    dekan_approved_at: rawExtra.dekan_approved_at
      ? String(rawExtra.dekan_approved_at)
      : undefined,
  };
}

export async function fetchEvaluationsForContext(
  cycleYear: string,
  kodeProdi: string
): Promise<Record<string, AmiEvaluation>> {
  const map: Record<string, AmiEvaluation> = {};
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ppepp_evaluasi')
      .select(
        'siklus, kode_prodi, indikator_id, nilai_capaian, target_capaian, kategori_temuan, plor_ca, ptk_rtl, pic, waktu_selesai_ptk, waktu_monev, bukti_link, updated_at'
      )
      .eq('siklus', cycleYear)
      .eq('kode_prodi', kodeProdi)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as PpeppEvaluasiRow[];
    rows.forEach((row) => {
      const mapped = mapEvaluasiRowToAmiEvaluation(row);
      map[mapped.indicator_id] = mapped;
    });
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return map;
}

export async function fetchAllEvaluations(
  cycles: AmiCycle[],
  programs: StudyProgramIdentity[]
): Promise<Record<string, Record<string, AmiEvaluation>>> {
  const byContext: Record<string, Record<string, AmiEvaluation>> = {};
  const cycleByYear = new Map<string, string>();
  cycles.forEach((c) => {
    cycleByYear.set(c.tahun_siklus.trim(), c.id);
    cycleByYear.set(c.id.trim(), c.id);
  });

  const programByKode = new Map<string, string>();
  programs.forEach((p) => {
    programByKode.set(p.kode_ps.trim().toLowerCase(), p.id);
    programByKode.set(p.id.trim().toLowerCase(), p.id);
  });

  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ppepp_evaluasi')
      .select(
        'siklus, kode_prodi, indikator_id, nilai_capaian, target_capaian, kategori_temuan, plor_ca, ptk_rtl, pic, waktu_selesai_ptk, waktu_monev, bukti_link, updated_at'
      )
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as PpeppEvaluasiRow[];
    rows.forEach((row) => {
      const resolvedCycleId =
        cycleByYear.get(String(row.siklus ?? '').trim()) ??
        String(row.siklus ?? '').trim();
      const resolvedProgId =
        programByKode.get(String(row.kode_prodi ?? '').trim().toLowerCase()) ??
        String(row.kode_prodi ?? '').trim();
      const contextKey = `${resolvedCycleId}::${resolvedProgId}`;
      if (!byContext[contextKey]) {
        byContext[contextKey] = {};
      }
      const mapped = mapEvaluasiRowToAmiEvaluation(row);
      byContext[contextKey][mapped.indicator_id] = mapped;
    });
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return byContext;
}

let supportsUpdatedByColumn: boolean | null = null;

export async function upsertEvaluationToSupabase(params: {
  siklus: string;
  kodeProdi: string;
  evaluation: AmiEvaluation;
  updatedByEmail?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { siklus, kodeProdi, evaluation, updatedByEmail } = params;
  try {
    const indikatorIdNum = Number(evaluation.indicator_id);
    if (!Number.isFinite(indikatorIdNum)) {
      return {
        ok: false,
        error: `indikator_id "${evaluation.indicator_id}" bukan integer yang valid.`,
      };
    }

    const problemText =
      evaluation.plor_ca?.problem || evaluation.akar_masalah || '';

    const plorCaPayload: Record<string, unknown> = {
      problem: problemText,
      location: evaluation.plor_ca?.location ?? '',
      objective_evidence: evaluation.plor_ca?.objectiveEvidence ?? '',
      reference: evaluation.plor_ca?.reference ?? '',
      correction: evaluation.plor_ca?.correction ?? '',
      action: evaluation.plor_ca?.action ?? '',
      monev_status: evaluation.monev_status ?? 'Open',
      ptk_workflow_status: evaluation.ptk_workflow_status ?? 'Draft Prodi',
      bukti_realisasi: evaluation.bukti_realisasi ?? '',
      tanggal_penyelesaian: evaluation.tanggal_penyelesaian ?? '',
      dekan_catatan: evaluation.dekan_catatan ?? '',
      dekan_approved_by: evaluation.dekan_approved_by ?? '',
      dekan_approved_at: evaluation.dekan_approved_at ?? '',
    };

    const basePayload: Record<string, unknown> = {
      siklus,
      kode_prodi: kodeProdi,
      indikator_id: indikatorIdNum,
      nilai_capaian: evaluation.nilai_capaian ?? null,
      target_capaian: evaluation.target_1_yr ?? null,
      kategori_temuan: evaluation.kategori_override ?? null,
      plor_ca: plorCaPayload,
      ptk_rtl: evaluation.ptk_rtl ?? '',
      pic: evaluation.pic ?? '',
      waktu_selesai_ptk: normalizeIsoDate(evaluation.waktu_ptk),
      waktu_monev: normalizeIsoDate(evaluation.waktu_monev),
      bukti_link: evaluation.bukti_link ?? '',
      updated_at: new Date().toISOString(),
    };

    if (supportsUpdatedByColumn !== false && updatedByEmail) {
      const payloadWithUser = {
        ...basePayload,
        updated_by: updatedByEmail,
      };
      const { error } = await supabase
        .from('ppepp_evaluasi')
        .upsert(payloadWithUser, {
          onConflict: 'siklus,kode_prodi,indikator_id',
        });

      if (!error) {
        supportsUpdatedByColumn = true;
        return { ok: true };
      }

      const code = (error as { code?: string }).code;
      const msg = (error as { message?: string }).message ?? '';
      if (
        code === '42703' ||
        code === 'PGRST204' ||
        msg.includes('updated_by')
      ) {
        supportsUpdatedByColumn = false;
      } else {
        throw error;
      }
    }

    const { error } = await supabase
      .from('ppepp_evaluasi')
      .upsert(basePayload, {
        onConflict: 'siklus,kode_prodi,indikator_id',
      });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatSupabaseError(err) };
  }
}
