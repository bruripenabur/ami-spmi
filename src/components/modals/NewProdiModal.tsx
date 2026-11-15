import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { JenisProdi, PeringkatAkreditasi, StudyProgramIdentity } from '../../types/ami';

interface NewProdiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (prodi: StudyProgramIdentity) => void;
}

export const NewProdiModal: React.FC<NewProdiModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [kodePs, setKodePs] = useState('');
  const [namaProdi, setNamaProdi] = useState('');
  const [fakultas, setFakultas] = useState('Fakultas Keguruan dan Ilmu Pendidikan');
  const [jurusan, setJurusan] = useState('');
  const [jenisProdi, setJenisProdi] = useState<JenisProdi>('Non-Kependidikan');
  const [akreditasi, setAkreditasi] = useState<PeringkatAkreditasi>('Baik Sekali');
  const [kaprodiNama, setKaprodiNama] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodePs.trim() || !namaProdi.trim()) return;

    const newProdi: StudyProgramIdentity = {
      id: `prodi-${Date.now()}`,
      kode_pt: '001021',
      nama_pt: 'UNIVERSITAS PATTIMURA (UNPATTI)',
      alamat_pusat: 'Jl. Ir. M. Putuhena Kampus Poka, Ambon 97233',
      kode_pos: '97233',
      jenis_prodi: jenisProdi,
      fakultas: fakultas.trim(),
      pengelola_pembelajaran: jurusan.trim() || namaProdi.trim(),
      alamat_pengelola: 'Kampus Poka, Kota Ambon 97233',
      kode_ps: kodePs.trim(),
      nama_jurusan: jurusan.trim() || namaProdi.trim(),
      nama_prodi: namaProdi.trim(),
      tanggal_pendirian: '',
      no_sk_pendirian: '',
      no_sk_operasional: '',
      peringkat_akreditasi: akreditasi,
      riwayat_akreditasi: {
        akreditasi_1: '',
        akreditasi_2: '',
        akreditasi_3: '',
        akreditasi_4: '',
        akreditasi_5: '',
      },
      tanggal_kedaluwarsa_akreditasi: '',
      alamat_prodi: 'Jl. Ir. M. Putuhena Kampus Poka, Ambon 97233',
      email_prodi: '',
      telepon_prodi: '(0911) 322626',
      website_prodi: 'https://unpatti.ac.id',
      visi_prodi: '',
      misi_prodi: '',
      kompetensi_lulusan: '',
      kriteria_lulusan: {
        sks_minimal: 144,
        nilai_d_maksimal: 2,
        ipk_minimal: 2.75,
        toefl_minimal: 450,
        syarat_lainnya: '',
      },
      jumlah_mahasiswa_ts: 0,
      jumlah_lulusan_ts: 0,
      jumlah_dosen_homebase_ts: 0,
      jumlah_dosen_tetap_ts: 0,
      jumlah_dosen_tidak_tetap_ts: 0,
      tenaga_kependidikan: { s3: 0, s2: 0, s1: 0, diploma: 0, sma: 0 },
      kaprodi_nama: kaprodiNama.trim(),
      kaprodi_nip: '',
      kaprodi_hp: '',
      dekan_nama: '',
      dekan_nip: '',
      tahun_siklus_ppepp: '2025/2026',
      tempat_pengesahan: 'Ambon',
      tahun_pengesahan: '2025',
    };

    onCreate(newProdi);
    setKodePs('');
    setNamaProdi('');
    setJurusan('');
    setKaprodiNama('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <h3 className="text-sm font-semibold">
            Tambah Program Studi Baru (UNPATTI)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode PS (PDDIKTI) *
              </label>
              <input
                type="text"
                required
                value={kodePs}
                onChange={(e) => setKodePs(e.target.value)}
                placeholder="Contoh: 84202"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Instrumen Prodi
              </label>
              <select
                value={jenisProdi}
                onChange={(e) => setJenisProdi(e.target.value as JenisProdi)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              >
                <option value="Non-Kependidikan">Non-Kependidikan</option>
                <option value="Kependidikan">Kependidikan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Program Studi *
            </label>
            <input
              type="text"
              required
              value={namaProdi}
              onChange={(e) => setNamaProdi(e.target.value)}
              placeholder="Contoh: S1 Pendidikan Matematika"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fakultas
              </label>
              <input
                type="text"
                value={fakultas}
                onChange={(e) => setFakultas(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurusan
              </label>
              <input
                type="text"
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                placeholder="Nama Jurusan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peringkat Akreditasi
              </label>
              <select
                value={akreditasi}
                onChange={(e) =>
                  setAkreditasi(e.target.value as PeringkatAkreditasi)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ketua Program Studi
              </label>
              <input
                type="text"
                value={kaprodiNama}
                onChange={(e) => setKaprodiNama(e.target.value)}
                placeholder="Nama & gelar lengkap"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Program Studi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
