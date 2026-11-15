import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';
import {
  AmiCycle,
  SsoUserProfile,
  StudyProgramIdentity,
} from '../../types/ami';
import { RBAC_ROLE_META, normalizeSsoRoleToRbacRole } from '../../utils/rbacEngine';

interface TabManajemenSistemProps {
  ssoProfiles: SsoUserProfile[];
  programs: StudyProgramIdentity[];
  faculties: string[];
  cycles: AmiCycle[];
  canManageUsers: boolean;
  canManageCycles: boolean;
  canCreateProdi: boolean;
  onUpdateSsoProfile: (
    userId: string,
    patch: Partial<
      Pick<SsoUserProfile, 'full_name' | 'nip' | 'jabatan' | 'role' | 'unit_kode'>
    >
  ) => Promise<{ ok: boolean; error?: string }>;
  onRefreshSsoProfiles?: () => Promise<void>;
  onUpdateCycleStatus: (cycleId: string, status: AmiCycle['status']) => void;
  onOpenNewProdiModal: () => void;
}

const SSO_ROLE_OPTIONS = [
  'SUPER_ADMIN',
  'ADMIN_LPMPP',
  'KAPRODI',
  'AUDITOR_AMI',
  'DEKANAT',
  'REKTORAT',
  'LEMBAGA',
  'PUSAT',
  'ASESOR_LAM',
  'ASESOR_BANPT',
];

export const TabManajemenSistem: React.FC<TabManajemenSistemProps> = ({
  ssoProfiles,
  programs,
  faculties,
  cycles,
  canManageUsers,
  canManageCycles,
  canCreateProdi,
  onUpdateSsoProfile,
  onRefreshSsoProfiles,
  onUpdateCycleStatus,
  onOpenNewProdiModal,
}) => {
  const [section, setSection] = useState<'users' | 'cycles'>(
    canManageUsers ? 'users' : 'cycles'
  );
  const [searchUser, setSearchUser] = useState('');
  const [editingProfile, setEditingProfile] = useState<SsoUserProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredProfiles = useMemo(() => {
    const q = searchUser.trim().toLowerCase();
    if (!q) return ssoProfiles;
    return ssoProfiles.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jabatan.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.unit_kode.toLowerCase().includes(q)
    );
  }, [ssoProfiles, searchUser]);

  const handleRefresh = async () => {
    if (!onRefreshSsoProfiles) return;
    setRefreshing(true);
    try {
      await onRefreshSsoProfiles();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await onUpdateSsoProfile(editingProfile.id, {
        full_name: editingProfile.full_name.trim(),
        nip: editingProfile.nip.trim(),
        jabatan: editingProfile.jabatan.trim(),
        role: editingProfile.role.trim(),
        unit_kode: editingProfile.unit_kode.trim(),
      });
      if (!res.ok) {
        setProfileError(res.error || 'Gagal memperbarui profil pengguna.');
        return;
      }
      setEditingProfile(null);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Section Switcher */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Manajemen Pengguna, Hak Akses RBAC &amp; Master Siklus
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Kelola profil pengguna terhubung Supabase (sso_user_profiles), penetapan peran RBAC &amp; unit kerja, serta status siklus PPEPP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setSection('users')}
              className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                section === 'users'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Pengguna &amp; RBAC ({ssoProfiles.length})
            </button>
          )}
          {canManageCycles && (
            <button
              type="button"
              onClick={() => setSection('cycles')}
              className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                section === 'cycles'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Master Siklus ({cycles.length})
            </button>
          )}
          {canCreateProdi && (
            <button
              type="button"
              onClick={onOpenNewProdiModal}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Prodi Baru
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Supabase sso_user_profiles Table */}
      {section === 'users' && canManageUsers && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Cari nama, NIP, email, jabatan, role, atau unit kode..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            {onRefreshSsoProfiles && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                Muat Ulang Profil
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Lengkap &amp; Jabatan</th>
                  <th className="px-4 py-3 font-semibold">NIP / Email</th>
                  <th className="px-4 py-3 font-semibold">Peran RBAC</th>
                  <th className="px-4 py-3 font-semibold">Unit Kode / Prodi</th>
                  <th className="px-4 py-3 font-semibold w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada data profil pada tabel sso_user_profiles yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((u) => {
                    const rbacRole = normalizeSsoRoleToRbacRole(u.role);
                    const meta = RBAC_ROLE_META[rbacRole];
                    const matchedProdi = programs.find(
                      (p) =>
                        p.kode_ps.trim().toLowerCase() ===
                          u.unit_kode.trim().toLowerCase() ||
                        p.id.trim().toLowerCase() ===
                          u.unit_kode.trim().toLowerCase()
                    );

                    return (
                      <tr key={u.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {u.full_name || '-'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {u.jabatan || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 space-y-0.5">
                          <div className="font-mono text-[11px] font-semibold text-slate-700">
                            NIP: {u.nip || '-'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {u.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border ${meta.badgeClass}`}
                            >
                              {u.role || meta.shortLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-blue-900">
                            {u.unit_kode || '-'}
                          </div>
                          {matchedProdi && (
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {matchedProdi.nama_prodi} · {matchedProdi.fakultas}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setProfileError(null);
                              setEditingProfile({ ...u });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-blue-800 hover:text-blue-900"
                          >
                            <Edit3 className="h-3 w-3" />
                            Atur RBAC
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: Master Cycles Control */}
      {section === 'cycles' && canManageCycles && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                Pengaturan Status Siklus PPEPP &amp; AMI (2020/2021 – 2030/2031)
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Lembaga (LPMPP/LPPM) dan Super Admin dapat menetapkan status Persiapan, Aktif, atau Selesai per tahun akademik.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {cycles.map((c) => (
              <div
                key={c.id}
                className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {c.tahun_siklus}
                    </span>
                    <span className="text-xs text-slate-600">{c.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(['Persiapan', 'Aktif', 'Selesai'] as const).map((st) => {
                    const active = c.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateCycleStatus(c.id, st)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                          active
                            ? st === 'Aktif'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : st === 'Selesai'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Edit Supabase User Profile */}
      {editingProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
          onClick={() => setEditingProfile(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Atur Profil &amp; Peran RBAC Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Pembaruan tersimpan langsung ke tabel sso_user_profiles Supabase.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {profileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {profileError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Auth ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingProfile.email}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProfile.full_name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / NIDN
                  </label>
                  <input
                    type="text"
                    value={editingProfile.nip}
                    onChange={(e) =>
                      setEditingProfile({ ...editingProfile, nip: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={editingProfile.jabatan}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      jabatan: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Sistem
                  </label>
                  <select
                    value={editingProfile.role}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        role: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {SSO_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Kode (Kode Prodi / Fakultas)
                  </label>
                  <input
                    type="text"
                    list="unit-kode-options"
                    value={editingProfile.unit_kode}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        unit_kode: e.target.value,
                      })
                    }
                    placeholder="Contoh: kode_prodi atau ALL"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                  <datalist id="unit-kode-options">
                    <option value="ALL">ALL (Semua Unit)</option>
                    <option value="LPMPP">LPMPP</option>
                    {faculties.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                    {programs.map((p) => (
                      <option key={p.id} value={p.kode_ps}>
                        {p.kode_ps} — {p.nama_prodi}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF] disabled:opacity-70"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {savingProfile ? 'Menyimpan...' : 'Simpan ke Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
