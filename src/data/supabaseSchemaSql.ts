export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- PPEPP UNPATTI (Universitas Pattimura)
-- PostgreSQL / Supabase Schema, Idempotent Migration, RLS Policies & Seed Data
-- Compatible with Supabase project: https://eysccwxpgdcoqfvaalye.supabase.co
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Siklus Audit Mutu Internal (PPEPP Cycles 2020/2021 - 2030/2031)
CREATE TABLE IF NOT EXISTS public.ami_cycles (
  id TEXT PRIMARY KEY,
  tahun_siklus TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Persiapan', 'Aktif', 'Selesai')),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Identitas Program Studi (Tab 01)
CREATE TABLE IF NOT EXISTS public.study_programs (
  id TEXT PRIMARY KEY,
  kode_pt TEXT NOT NULL DEFAULT '001021',
  nama_pt TEXT NOT NULL DEFAULT 'UNIVERSITAS PATTIMURA (UNPATTI)',
  alamat_pusat TEXT NOT NULL DEFAULT 'Jl. Ir. M. Putuhena Kampus Poka, Ambon 97233',
  kode_pos TEXT NOT NULL DEFAULT '97233',
  jenis_prodi TEXT NOT NULL DEFAULT 'Non-Kependidikan' CHECK (jenis_prodi IN ('Non-Kependidikan', 'Kependidikan')),
  fakultas TEXT NOT NULL,
  pengelola_pembelajaran TEXT NOT NULL,
  alamat_pengelola TEXT,
  kode_ps TEXT NOT NULL UNIQUE,
  nama_jurusan TEXT NOT NULL,
  nama_prodi TEXT NOT NULL,
  tanggal_pendirian DATE,
  no_sk_pendirian TEXT,
  no_sk_operasional TEXT,
  peringkat_akreditasi TEXT CHECK (
    peringkat_akreditasi IN (
      'Unggul',
      'Baik Sekali',
      'Baik',
      'Terakreditasi Pertama',
      'Terakreditasi',
      'A',
      'B',
      'C',
      'Belum Terakreditasi'
    )
  ),
  riwayat_akreditasi JSONB NOT NULL DEFAULT '{"akreditasi_1":"","akreditasi_2":"","akreditasi_3":"","akreditasi_4":"","akreditasi_5":""}'::jsonb,
  tanggal_kedaluwarsa_akreditasi DATE,
  alamat_prodi TEXT,
  email_prodi TEXT,
  telepon_prodi TEXT,
  website_prodi TEXT,
  visi_prodi TEXT,
  misi_prodi TEXT,
  kompetensi_lulusan TEXT,
  kriteria_lulusan JSONB NOT NULL DEFAULT '{"sks_minimal":144,"nilai_d_maksimal":2,"ipk_minimal":2.75,"toefl_minimal":450,"syarat_lainnya":""}'::jsonb,
  jumlah_mahasiswa_ts INTEGER NOT NULL DEFAULT 0,
  jumlah_lulusan_ts INTEGER NOT NULL DEFAULT 0,
  jumlah_dosen_homebase_ts INTEGER NOT NULL DEFAULT 0,
  jumlah_dosen_tetap_ts INTEGER NOT NULL DEFAULT 0,
  jumlah_dosen_tidak_tetap_ts INTEGER NOT NULL DEFAULT 0,
  tenaga_kependidikan JSONB NOT NULL DEFAULT '{"s3":0,"s2":0,"s1":0,"diploma":0,"sma":0}'::jsonb,
  kaprodi_nama TEXT,
  kaprodi_nip TEXT,
  kaprodi_hp TEXT,
  dekan_nama TEXT,
  dekan_nip TEXT,
  tahun_siklus_ppepp TEXT NOT NULL DEFAULT '2025/2026',
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 10 Standar Nasional / Institusional SPMI
CREATE TABLE IF NOT EXISTS public.ami_standards (
  id INTEGER PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  bobot NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  urutan INTEGER NOT NULL
);

-- 4. Master Indikator & Rubrik 1-7 (Tab 02)
CREATE TABLE IF NOT EXISTS public.ami_indicators (
  id TEXT PRIMARY KEY,
  standard_id INTEGER NOT NULL REFERENCES public.ami_standards(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  uraian TEXT NOT NULL,
  rubric_levels JSONB NOT NULL,
  urutan INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Hasil Evaluasi Diri, Penilaian Auditor, PLOR+CA, PTK/RTL & Monev (Tab 02 - 07)
CREATE TABLE IF NOT EXISTS public.ami_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id TEXT NOT NULL REFERENCES public.ami_cycles(id) ON DELETE CASCADE,
  study_program_id TEXT NOT NULL REFERENCES public.study_programs(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES public.ami_indicators(id) ON DELETE CASCADE,
  nilai_capaian INTEGER CHECK (nilai_capaian BETWEEN 1 AND 7),
  target_1_yr INTEGER CHECK (target_1_yr BETWEEN 1 AND 7),
  kategori_override TEXT CHECK (kategori_override IN ('Mayor', 'Minor', 'Observasi', 'Sesuai (Baik)', 'Best Practice')),
  akar_masalah TEXT DEFAULT '',
  plor_ca_json JSONB NOT NULL DEFAULT '{"problem":"","location":"","objectiveEvidence":"","reference":"","correction":"","action":""}'::jsonb,
  ptk_rtl TEXT DEFAULT '',
  pic TEXT DEFAULT '',
  waktu_ptk TEXT DEFAULT '',
  waktu_monev TEXT DEFAULT '',
  bukti_link TEXT DEFAULT '',
  bukti_realisasi TEXT DEFAULT '',
  tanggal_penyelesaian DATE,
  monev_status TEXT NOT NULL DEFAULT 'Open' CHECK (monev_status IN ('Open', 'In Progress', 'Closed - Verified')),
  auditor_verified_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, study_program_id, indicator_id)
);

-- 6. Profil Pengguna RBAC (Auditee Prodi vs Auditor LPMPP)
CREATE TABLE IF NOT EXISTS public.ami_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nip TEXT,
  role TEXT NOT NULL DEFAULT 'auditee' CHECK (role IN ('auditee', 'auditor', 'admin_lpmpp')),
  study_program_id TEXT REFERENCES public.study_programs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Akun & Penugasan Multi-Role RBAC Aplikasi PPEPP UNPATTI
CREATE TABLE IF NOT EXISTS public.ami_rbac_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  nip TEXT,
  email TEXT,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  gelar_unit TEXT,
  roles_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MIGRASI AMAN JIKA TABEL LAMA MENGGUNAKAN KOLOM UUID
-- ============================================================================
DROP VIEW IF EXISTS public.v_ami_rekap_per_standar;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ami_evaluations' AND column_name = 'indicator_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.ami_evaluations DROP CONSTRAINT IF EXISTS ami_evaluations_cycle_id_fkey;
    ALTER TABLE public.ami_evaluations DROP CONSTRAINT IF EXISTS ami_evaluations_study_program_id_fkey;
    ALTER TABLE public.ami_evaluations DROP CONSTRAINT IF EXISTS ami_evaluations_indicator_id_fkey;
    ALTER TABLE public.ami_user_profiles DROP CONSTRAINT IF EXISTS ami_user_profiles_study_program_id_fkey;

    ALTER TABLE public.ami_cycles ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.study_programs ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.ami_indicators ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.ami_evaluations ALTER COLUMN cycle_id TYPE TEXT USING cycle_id::text;
    ALTER TABLE public.ami_evaluations ALTER COLUMN study_program_id TYPE TEXT USING study_program_id::text;
    ALTER TABLE public.ami_evaluations ALTER COLUMN indicator_id TYPE TEXT USING indicator_id::text;
    ALTER TABLE public.ami_user_profiles ALTER COLUMN study_program_id TYPE TEXT USING study_program_id::text;

    ALTER TABLE public.ami_evaluations ADD CONSTRAINT ami_evaluations_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.ami_cycles(id) ON DELETE CASCADE;
    ALTER TABLE public.ami_evaluations ADD CONSTRAINT ami_evaluations_study_program_id_fkey FOREIGN KEY (study_program_id) REFERENCES public.study_programs(id) ON DELETE CASCADE;
    ALTER TABLE public.ami_evaluations ADD CONSTRAINT ami_evaluations_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES public.ami_indicators(id) ON DELETE CASCADE;
    ALTER TABLE public.ami_user_profiles ADD CONSTRAINT ami_user_profiles_study_program_id_fkey FOREIGN KEY (study_program_id) REFERENCES public.study_programs(id);
  END IF;
END $$;

ALTER TABLE public.study_programs DROP CONSTRAINT IF EXISTS study_programs_peringkat_akreditasi_check;
ALTER TABLE public.study_programs ADD CONSTRAINT study_programs_peringkat_akreditasi_check
  CHECK (peringkat_akreditasi IN (
    'Unggul', 'Baik Sekali', 'Baik', 'Terakreditasi Pertama', 'Terakreditasi',
    'A', 'B', 'C', 'Belum Terakreditasi'
  ));

-- ============================================================================
-- VIEW ANALISIS EFEKTIFITAS SIKLUS PPEPP & REKAP PER STANDAR
-- ============================================================================
CREATE OR REPLACE VIEW public.v_ami_rekap_per_standar AS
SELECT
  e.cycle_id,
  c.tahun_siklus,
  e.study_program_id,
  sp.nama_prodi,
  s.id AS standard_id,
  s.kode AS standard_kode,
  s.nama AS standard_nama,
  ROUND((AVG(e.nilai_capaian) / 7.0) * 100.0, 2) AS nilai_capaian_100,
  ROUND((AVG(e.target_1_yr) / 7.0) * 100.0, 2) AS nilai_target_100,
  COUNT(*) FILTER (WHERE COALESCE(e.kategori_override, CASE WHEN e.nilai_capaian = 1 THEN 'Mayor' WHEN e.nilai_capaian = 2 THEN 'Minor' WHEN e.nilai_capaian BETWEEN 3 AND 5 THEN 'Observasi' WHEN e.nilai_capaian = 6 THEN 'Sesuai (Baik)' ELSE 'Best Practice' END) = 'Mayor') AS count_mayor,
  COUNT(*) FILTER (WHERE COALESCE(e.kategori_override, CASE WHEN e.nilai_capaian = 1 THEN 'Mayor' WHEN e.nilai_capaian = 2 THEN 'Minor' WHEN e.nilai_capaian BETWEEN 3 AND 5 THEN 'Observasi' WHEN e.nilai_capaian = 6 THEN 'Sesuai (Baik)' ELSE 'Best Practice' END) = 'Minor') AS count_minor,
  COUNT(*) FILTER (WHERE COALESCE(e.kategori_override, CASE WHEN e.nilai_capaian = 1 THEN 'Mayor' WHEN e.nilai_capaian = 2 THEN 'Minor' WHEN e.nilai_capaian BETWEEN 3 AND 5 THEN 'Observasi' WHEN e.nilai_capaian = 6 THEN 'Sesuai (Baik)' ELSE 'Best Practice' END) = 'Observasi') AS count_observasi,
  COUNT(*) FILTER (WHERE COALESCE(e.kategori_override, CASE WHEN e.nilai_capaian = 1 THEN 'Mayor' WHEN e.nilai_capaian = 2 THEN 'Minor' WHEN e.nilai_capaian BETWEEN 3 AND 5 THEN 'Observasi' WHEN e.nilai_capaian = 6 THEN 'Sesuai (Baik)' ELSE 'Best Practice' END) = 'Best Practice') AS count_best_practice
FROM public.ami_evaluations e
JOIN public.ami_cycles c ON c.id = e.cycle_id
JOIN public.study_programs sp ON sp.id = e.study_program_id
JOIN public.ami_indicators i ON i.id = e.indicator_id
JOIN public.ami_standards s ON s.id = i.standard_id
GROUP BY e.cycle_id, c.tahun_siklus, e.study_program_id, sp.nama_prodi, s.id, s.kode, s.nama;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Mendukung Sync Anon & Authenticated)
-- ============================================================================
ALTER TABLE public.ami_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ami_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ami_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ami_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ami_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ami_rbac_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to standards" ON public.ami_standards;
DROP POLICY IF EXISTS "Allow full access to standards" ON public.ami_standards;
CREATE POLICY "Allow full access to standards" ON public.ami_standards
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to indicators" ON public.ami_indicators;
DROP POLICY IF EXISTS "Allow full access to indicators" ON public.ami_indicators;
CREATE POLICY "Allow full access to indicators" ON public.ami_indicators
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to cycles" ON public.ami_cycles;
DROP POLICY IF EXISTS "Allow full access to cycles" ON public.ami_cycles;
CREATE POLICY "Allow full access to cycles" ON public.ami_cycles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read study_programs" ON public.study_programs;
DROP POLICY IF EXISTS "Allow auditee/admin update own study_program" ON public.study_programs;
DROP POLICY IF EXISTS "Allow full access to study_programs" ON public.study_programs;
CREATE POLICY "Allow full access to study_programs" ON public.study_programs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read evaluations" ON public.ami_evaluations;
DROP POLICY IF EXISTS "Allow authorized upsert evaluations" ON public.ami_evaluations;
DROP POLICY IF EXISTS "Allow full access to evaluations" ON public.ami_evaluations;
CREATE POLICY "Allow full access to evaluations" ON public.ami_evaluations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to rbac_users" ON public.ami_rbac_users;
CREATE POLICY "Allow full access to rbac_users" ON public.ami_rbac_users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA: 10 STANDAR SPMI & SIKLUS 2020/2021 - 2030/2031
-- ============================================================================
INSERT INTO public.ami_standards (id, kode, nama, bobot, urutan) VALUES
  (1, 'STD-01', 'Standar Isi', 10.00, 1),
  (2, 'STD-02', 'Standar Proses', 10.00, 2),
  (3, 'STD-03', 'Standar Kompetensi Lulusan', 10.00, 3),
  (4, 'STD-04', 'Standar Pendidik dan Tenaga Kependidikan', 10.00, 4),
  (5, 'STD-05', 'Standar Sarana dan Prasarana Pendidikan', 10.00, 5),
  (6, 'STD-06', 'Standar Pengelolaan Program Studi', 10.00, 6),
  (7, 'STD-07', 'Standar Pembiayaan', 10.00, 7),
  (8, 'STD-08', 'Standar Penilaian', 10.00, 8),
  (9, 'STD-09', 'Standar Penelitian', 10.00, 9),
  (10, 'STD-10', 'Standar Pengabdian kepada Masyarakat', 10.00, 10)
ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, bobot = EXCLUDED.bobot;

INSERT INTO public.ami_cycles (id, tahun_siklus, label, status) VALUES
  ('11111111-1111-1111-1111-111111112020', '2020/2021', 'Siklus AMI PPEPP 2020/2021', 'Selesai'),
  ('11111111-1111-1111-1111-111111112021', '2021/2022', 'Siklus AMI PPEPP 2021/2022', 'Selesai'),
  ('11111111-1111-1111-1111-111111112022', '2022/2023', 'Siklus AMI PPEPP 2022/2023', 'Selesai'),
  ('11111111-1111-1111-1111-111111112023', '2023/2024', 'Siklus AMI PPEPP 2023/2024', 'Selesai'),
  ('11111111-1111-1111-1111-111111112024', '2024/2025', 'Siklus AMI PPEPP 2024/2025', 'Selesai'),
  ('11111111-1111-1111-1111-111111112025', '2025/2026', 'Siklus AMI PPEPP 2025/2026', 'Aktif'),
  ('11111111-1111-1111-1111-111111112026', '2026/2027', 'Siklus AMI PPEPP 2026/2027', 'Persiapan'),
  ('11111111-1111-1111-1111-111111112027', '2027/2028', 'Siklus AMI PPEPP 2027/2028', 'Persiapan'),
  ('11111111-1111-1111-1111-111111112028', '2028/2029', 'Siklus AMI PPEPP 2028/2029', 'Persiapan'),
  ('11111111-1111-1111-1111-111111112029', '2029/2030', 'Siklus AMI PPEPP 2029/2030', 'Persiapan'),
  ('11111111-1111-1111-1111-111111112030', '2030/2031', 'Siklus AMI PPEPP 2030/2031', 'Persiapan')
ON CONFLICT (tahun_siklus) DO NOTHING;
`;
