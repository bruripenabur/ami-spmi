import React from 'react';
import { Lock, Building2, GraduationCap, Users, FileCheck2 } from 'lucide-react';
import {
  JenisProdi,
  PeringkatAkreditasi,
  StudyProgramIdentity,
  UserRole,
} from '../../types/ami';

interface TabIdentitasProdiProps {
  program: StudyProgramIdentity;
  role: UserRole;
  canEdit?: boolean;
  readOnlyLabel?: string;
  onChange: (updated: StudyProgramIdentity) => void;
}

export const TabIdentitasProdi: React.FC<TabIdentitasProdiProps> = ({
  program,
  role,
  canEdit,
  readOnlyLabel,
  onChange,
}) => {
  const isReadOnly = canEdit !== undefined ? !canEdit : role === 'auditor';

  const updateField = <K extends keyof StudyProgramIdentity>(
    key: K,
    value: StudyProgramIdentity[K]
  ) => {
    if (isReadOnly) return;
    onChange({ ...program, [key]: value });
  };

  const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600';
  const monoInputClass = `${inputClass} font-mono tabular-nums`;

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex items-center gap-4">
          <img
            src="/unpatti-logo.png"
            alt="Logo UNPATTI"
            className="h-12 w-12 shrink-0 object-contain hidden sm:block"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Kode PT {program.kode_pt}</span>
              <span aria-hidden="true">·</span>
              <span>Kode PS {program.kode_ps}</span>
              <span aria-hidden="true">·</span>
              <span>Siklus PPEPP {program.tahun_siklus_ppepp}</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Identitas Program Studi ({program.jenis_prodi})
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {program.nama_pt} — {program.fakultas}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-600">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              {readOnlyLabel || 'Hanya Baca (Dikunci untuk Peran Ini)'}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <span className="text-slate-600 font-medium">Jenis Instrumen:</span>
              <select
                value={program.jenis_prodi}
                onChange={(e) =>
                  updateField('jenis_prodi', e.target.value as JenisProdi)
                }
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
              >
                <option value="Non-Kependidikan">Non-Kependidikan</option>
                <option value="Kependidikan">Kependidikan</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section A: Data Perguruan Tinggi & Pengelola */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <Building2 className="h-4 w-4 text-blue-900" />
          <h3 className="text-sm font-semibold text-slate-900">
            01. Identitas Perguruan Tinggi & Pengelola Pembelajaran
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              1. Kode PT
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.kode_pt}
              onChange={(e) => updateField('kode_pt', e.target.value)}
              className={monoInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              2. Nama Perguruan Tinggi
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.nama_pt}
              onChange={(e) => updateField('nama_pt', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              3. Fakultas / Pascasarjana / PSDKU
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.fakultas}
              onChange={(e) => updateField('fakultas', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              4. Alamat Pusat & Kode Pos
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={isReadOnly}
                value={program.alamat_pusat}
                onChange={(e) => updateField('alamat_pusat', e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                disabled={isReadOnly}
                value={program.kode_pos}
                onChange={(e) => updateField('kode_pos', e.target.value)}
                className={`${monoInputClass} w-28`}
                aria-label="Kode Pos"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              5. Pengelola Proses Pembelajaran
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.pengelola_pembelajaran}
              onChange={(e) =>
                updateField('pengelola_pembelajaran', e.target.value)
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              6. Alamat Pengelola
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.alamat_pengelola}
              onChange={(e) => updateField('alamat_pengelola', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Section B: Identitas & Legalitas Program Studi */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <FileCheck2 className="h-4 w-4 text-blue-900" />
          <h3 className="text-sm font-semibold text-slate-900">
            02. Identitas, Legalitas SK & Riwayat Akreditasi Program Studi
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              7. Kode Program Studi (PS)
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.kode_ps}
              onChange={(e) => updateField('kode_ps', e.target.value)}
              className={monoInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              8. Nama Jurusan
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.nama_jurusan}
              onChange={(e) => updateField('nama_jurusan', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              9. Nama Program Studi
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.nama_prodi}
              onChange={(e) => updateField('nama_prodi', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              10. Tanggal Pendirian Program Studi
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={program.tanggal_pendirian}
              onChange={(e) => updateField('tanggal_pendirian', e.target.value)}
              className={monoInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              11. No. SK Pendirian Program Studi
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.no_sk_pendirian}
              onChange={(e) => updateField('no_sk_pendirian', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              12. No. SK Operasional Terakhir
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={program.no_sk_operasional}
              onChange={(e) => updateField('no_sk_operasional', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              13. Peringkat Akreditasi Terakhir
            </label>
            <select
              disabled={isReadOnly}
              value={program.peringkat_akreditasi}
              onChange={(e) =>
                updateField(
                  'peringkat_akreditasi',
                  e.target.value as PeringkatAkreditasi
                )
              }
              className={inputClass}
            >
              <option value="Unggul">Unggul</option>
              <option value="Baik Sekali">Baik Sekali</option>
              <option value="Baik">Baik</option>
              <option value="Terakreditasi Pertama">Terakreditasi Pertama</option>
              <option value="Terakreditasi">Terakreditasi</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="Belum Terakreditasi">Belum Terakreditasi</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              14. Tanggal Kedaluwarsa Akreditasi
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={program.tanggal_kedaluwarsa_akreditasi}
              onChange={(e) =>
                updateField('tanggal_kedaluwarsa_akreditasi', e.target.value)
              }
              className={monoInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tahun Siklus PPEPP
            </label>
            <select
              disabled={isReadOnly}
              value={program.tahun_siklus_ppepp}
              onChange={(e) =>
                updateField('tahun_siklus_ppepp', e.target.value)
              }
              className={monoInputClass}
            >
              {[
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
              ].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Riwayat Akreditasi I-V */}
          <div className="md:col-span-3 pt-2">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Riwayat Peringkat Akreditasi (Akreditasi I – V)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {(['akreditasi_1', 'akreditasi_2', 'akreditasi_3', 'akreditasi_4', 'akreditasi_5'] as const).map(
                (key, idx) => (
                  <div key={key}>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Akreditasi {idx + 1}
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={program.riwayat_akreditasi[key]}
                      onChange={(e) =>
                        updateField('riwayat_akreditasi', {
                          ...program.riwayat_akreditasi,
                          [key]: e.target.value,
                        })
                      }
                      className={`${inputClass} text-xs`}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Kontak Prodi */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                15. Alamat Program Studi
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.alamat_prodi}
                onChange={(e) => updateField('alamat_prodi', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                16. Email Program Studi
              </label>
              <input
                type="email"
                disabled={isReadOnly}
                value={program.email_prodi}
                onChange={(e) => updateField('email_prodi', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                17. Telepon & Website
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={program.telepon_prodi}
                  onChange={(e) => updateField('telepon_prodi', e.target.value)}
                  className={monoInputClass}
                  placeholder="Telepon"
                />
                <input
                  type="url"
                  disabled={isReadOnly}
                  value={program.website_prodi}
                  onChange={(e) => updateField('website_prodi', e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Visi, Misi, PLO & Kriteria Lulusan */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <GraduationCap className="h-4 w-4 text-blue-900" />
          <h3 className="text-sm font-semibold text-slate-900">
            03. Visi, Misi, Kompetensi Lulusan (PLO) & Kriteria Lulusan
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              18. Visi Program Studi
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={program.visi_prodi}
              onChange={(e) => updateField('visi_prodi', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                19. Misi Program Studi
              </label>
              <textarea
                rows={4}
                disabled={isReadOnly}
                value={program.misi_prodi}
                onChange={(e) => updateField('misi_prodi', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                20. Kompetensi Lulusan (Program Learning Outcomes / PLO)
              </label>
              <textarea
                rows={4}
                disabled={isReadOnly}
                value={program.kompetensi_lulusan}
                onChange={(e) =>
                  updateField('kompetensi_lulusan', e.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              21. Kriteria Lulusan Program Studi
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  a. Jumlah SKS Minimal
                </label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={program.kriteria_lulusan.sks_minimal}
                  onChange={(e) =>
                    updateField('kriteria_lulusan', {
                      ...program.kriteria_lulusan,
                      sks_minimal: Number(e.target.value) || 0,
                    })
                  }
                  className={monoInputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  b. Jumlah Nilai D Maksimal
                </label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={program.kriteria_lulusan.nilai_d_maksimal}
                  onChange={(e) =>
                    updateField('kriteria_lulusan', {
                      ...program.kriteria_lulusan,
                      nilai_d_maksimal: Number(e.target.value) || 0,
                    })
                  }
                  className={monoInputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  c. IPK Minimal
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isReadOnly}
                  value={program.kriteria_lulusan.ipk_minimal}
                  onChange={(e) =>
                    updateField('kriteria_lulusan', {
                      ...program.kriteria_lulusan,
                      ipk_minimal: Number(e.target.value) || 0,
                    })
                  }
                  className={monoInputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  d. TOEFL Minimal
                </label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={program.kriteria_lulusan.toefl_minimal}
                  onChange={(e) =>
                    updateField('kriteria_lulusan', {
                      ...program.kriteria_lulusan,
                      toefl_minimal: Number(e.target.value) || 0,
                    })
                  }
                  className={monoInputClass}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[11px] text-slate-500 mb-1">
                  e. Syarat Lainnya
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={program.kriteria_lulusan.syarat_lainnya}
                  onChange={(e) =>
                    updateField('kriteria_lulusan', {
                      ...program.kriteria_lulusan,
                      syarat_lainnya: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Data SDM & Mahasiswa Berbasis PDDIKTI */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <Users className="h-4 w-4 text-blue-900" />
          <h3 className="text-sm font-semibold text-slate-900">
            04. Data Mahasiswa, Dosen (Berbasis PDDIKTI) & Tenaga Kependidikan
          </h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                22. Mahasiswa pada TS
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={program.jumlah_mahasiswa_ts}
                onChange={(e) =>
                  updateField('jumlah_mahasiswa_ts', Number(e.target.value) || 0)
                }
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                23. Jumlah Lulusan TS
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={program.jumlah_lulusan_ts}
                onChange={(e) =>
                  updateField('jumlah_lulusan_ts', Number(e.target.value) || 0)
                }
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                24. Dosen Homebase TS
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={program.jumlah_dosen_homebase_ts}
                onChange={(e) =>
                  updateField(
                    'jumlah_dosen_homebase_ts',
                    Number(e.target.value) || 0
                  )
                }
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                25. Dosen Tetap PS TS
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={program.jumlah_dosen_tetap_ts}
                onChange={(e) =>
                  updateField(
                    'jumlah_dosen_tetap_ts',
                    Number(e.target.value) || 0
                  )
                }
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                26. Dosen Tidak Tetap TS
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={program.jumlah_dosen_tidak_tetap_ts}
                onChange={(e) =>
                  updateField(
                    'jumlah_dosen_tidak_tetap_ts',
                    Number(e.target.value) || 0
                  )
                }
                className={monoInputClass}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              27. Jumlah Tenaga Kependidikan Berdasarkan Kualifikasi Pendidikan
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['s3', 's2', 's1', 'diploma', 'sma'] as const).map((lvl) => (
                <div key={lvl}>
                  <label className="block text-[11px] uppercase text-slate-500 mb-1">
                    {lvl === 'diploma' ? 'Diploma (D1–D4)' : lvl === 'sma' ? 'SMA / SMK' : lvl}
                  </label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={program.tenaga_kependidikan[lvl]}
                    onChange={(e) =>
                      updateField('tenaga_kependidikan', {
                        ...program.tenaga_kependidikan,
                        [lvl]: Number(e.target.value) || 0,
                      })
                    }
                    className={monoInputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section E: Identitas Kaprodi & Official Sign-off Block */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            05. Identitas Ketua Program Studi & Blok Pengesahan Dekan
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                28a. Nama Lengkap Kaprodi dengan Gelar
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.kaprodi_nama}
                onChange={(e) => updateField('kaprodi_nama', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                28b. NIP Ketua Program Studi
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.kaprodi_nip}
                onChange={(e) => updateField('kaprodi_nip', e.target.value)}
                className={monoInputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                28c. No. Telp / HP Kaprodi
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.kaprodi_hp}
                onChange={(e) => updateField('kaprodi_hp', e.target.value)}
                className={monoInputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Dekan Fakultas
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.dekan_nama}
                onChange={(e) => updateField('dekan_nama', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                NIP Dekan
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={program.dekan_nip}
                onChange={(e) => updateField('dekan_nip', e.target.value)}
                className={monoInputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={program.tempat_pengesahan}
                  onChange={(e) =>
                    updateField('tempat_pengesahan', e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tahun
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={program.tahun_pengesahan}
                  onChange={(e) =>
                    updateField('tahun_pengesahan', e.target.value)
                  }
                  className={monoInputClass}
                />
              </div>
            </div>
          </div>

          {/* Official Sign-Off Preview Block */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-slate-800">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-900">
                Dekan {program.fakultas}
              </p>
              <div className="h-14" />
              <p className="font-semibold underline decoration-slate-400 underline-offset-4">
                {program.dekan_nama || '................................................'}
              </p>
              <p className="mt-1 text-xs font-mono text-slate-500">
                NIP. {program.dekan_nip || '..........................'}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-slate-600">
                {program.tempat_pengesahan || 'Ambon'}, {program.tahun_pengesahan || '2025'}
              </p>
              <p className="font-semibold text-slate-900">
                Ketua Program Studi {program.nama_prodi}
              </p>
              <div className="h-14" />
              <p className="font-semibold underline decoration-slate-400 underline-offset-4">
                {program.kaprodi_nama || '................................................'}
              </p>
              <p className="mt-1 text-xs font-mono text-slate-500">
                NIP. {program.kaprodi_nip || '..........................'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
