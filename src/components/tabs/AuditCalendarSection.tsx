import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Edit3, Trash2, Clock, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';
import { AuditCalendarEvent } from '../../types/ami';
import { INITIAL_AUDIT_CALENDAR } from '../../data/auditCalendarData';

interface AuditCalendarSectionProps {
  isAdmin?: boolean;
  showToast: (msg: string) => void;
}

export const AuditCalendarSection: React.FC<AuditCalendarSectionProps> = ({
  isAdmin = false,
  showToast,
}) => {
  const [events, setEvents] = useState<AuditCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ppepp_audit_calendar_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_CALENDAR;
  });

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    event: AuditCalendarEvent | null;
  }>({ open: false, mode: 'add', event: null });

  const [formData, setFormData] = useState<Omit<AuditCalendarEvent, 'id'>>({
    nama_kegiatan: '',
    tahapan_siklus: 'Pengisian Instrumen',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_tenggat: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    unit_prodi: 'Semua 118 Program Studi',
    status: 'Akan Datang',
    keterangan: '',
  });

  const saveEvents = (updated: AuditCalendarEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem('ppepp_audit_calendar_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);

  // Compute summary stats
  const stats = useMemo(() => {
    let next30DaysCount = 0;
    let thisWeekCount = 0;
    let overdueCount = 0;

    events.forEach((ev) => {
      const tenggatDate = new Date(ev.tanggal_tenggat);
      const diffTime = tenggatDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (ev.status !== 'Selesai' && diffDays < 0) {
        overdueCount += 1;
      }
      if (diffDays >= 0 && diffDays <= 7) {
        thisWeekCount += 1;
      }
      if (diffDays >= 0 && diffDays <= 30) {
        next30DaysCount += 1;
      }
    });

    return { next30DaysCount, thisWeekCount, overdueCount };
  }, [events, todayDate]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Nama Kegiatan', 'Tahapan Siklus', 'Tanggal Mulai', 'Tanggal Tenggat', 'Unit / Prodi', 'Status', 'Keterangan'];
    const rows = events.map((ev) => [
      ev.id,
      `"${ev.nama_kegiatan.replace(/"/g, '""')}"`,
      `"${ev.tahapan_siklus.replace(/"/g, '""')}"`,
      ev.tanggal_mulai,
      ev.tanggal_tenggat,
      `"${ev.unit_prodi.replace(/"/g, '""')}"`,
      ev.status,
      `"${(ev.keterangan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kalender_Audit_AMI_UNPATTI_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Kalender Audit berhasil diekspor ke CSV.');
  };

  const handleOpenAdd = () => {
    setFormData({
      nama_kegiatan: '',
      tahapan_siklus: 'Pengisian Instrumen',
      tanggal_mulai: todayStr,
      tanggal_tenggat: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      unit_prodi: 'Semua 118 Program Studi',
      status: 'Akan Datang',
      keterangan: '',
    });
    setModalState({ open: true, mode: 'add', event: null });
  };

  const handleOpenEdit = (ev: AuditCalendarEvent) => {
    setFormData({
      nama_kegiatan: ev.nama_kegiatan,
      tahapan_siklus: ev.tahapan_siklus,
      tanggal_mulai: ev.tanggal_mulai,
      tanggal_tenggat: ev.tanggal_tenggat,
      unit_prodi: ev.unit_prodi,
      status: ev.status,
      keterangan: ev.keterangan,
    });
    setModalState({ open: true, mode: 'edit', event: ev });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda kegiatan audit ini?')) {
      const updated = events.filter((e) => e.id !== id);
      saveEvents(updated);
      showToast('Agenda kegiatan audit berhasil dihapus.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kegiatan.trim()) {
      showToast('Nama kegiatan wajib diisi.');
      return;
    }

    if (modalState.mode === 'add') {
      const newEv: AuditCalendarEvent = {
        id: `cal-${Date.now()}`,
        ...formData,
      };
      saveEvents([...events, newEv]);
      showToast('Agenda kegiatan audit baru berhasil ditambahkan.');
    } else if (modalState.event) {
      const updated = events.map((ev) =>
        ev.id === modalState.event?.id ? { ...ev, ...formData } : ev
      );
      saveEvents(updated);
      showToast('Agenda kegiatan audit berhasil diperbarui.');
    }
    setModalState({ open: false, mode: 'add', event: null });
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-900 p-3 text-amber-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Kalender Audit &amp; Jadwal Siklus AMI PPEPP UNPATTI
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jadwal komprehensif tenggat waktu dokumen, audit kecukupan, visitasi lapangan, PTK/RTL, hingga RTM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            Ekspor ke CSV
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Agenda Audit
            </button>
          )}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>Kegiatan 30 Hari Ke Depan</span>
            <Clock className="h-4 w-4 text-blue-700" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-blue-950">
            {stats.next30DaysCount}
          </div>
          <p className="mt-1 text-[11px] text-blue-800">
            Agenda audit dalam rentang 30 hari mendatang.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>Agenda Minggu Ini</span>
            <Calendar className="h-4 w-4 text-amber-700" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-amber-950">
            {stats.thisWeekCount}
          </div>
          <p className="mt-1 text-[11px] text-amber-800">
            Kegiatan prioritas minggu berjalan (7 hari ke depan).
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-red-900">
            <span>Kegiatan Terlambat / Lewat Tenggat</span>
            <AlertTriangle className="h-4 w-4 text-red-700" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-red-950">
            {stats.overdueCount}
          </div>
          <p className="mt-1 text-[11px] text-red-800">
            Agenda lewat tenggat namun belum berstatus selesai.
          </p>
        </div>
      </div>

      {/* Calendar List / Timeline Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Daftar Agenda &amp; Timeline Siklus AMI</h4>
            <p className="text-xs text-slate-300 mt-0.5">Siklus PPEPP Universitas Pattimura</p>
          </div>
          <span className="text-xs font-mono text-amber-400">{events.length} Agenda Terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Tahap &amp; Nama Kegiatan</th>
                <th className="px-3 py-3 font-semibold">Tanggal Mulai</th>
                <th className="px-3 py-3 font-semibold">Tanggal Tenggat</th>
                <th className="px-3 py-3 font-semibold">Unit / Sasaran Prodi</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Keterangan</th>
                {isAdmin && <th className="px-3 py-3 font-semibold text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.map((ev) => {
                const isOverdue = ev.status !== 'Selesai' && new Date(ev.tanggal_tenggat) < todayDate;
                const statusBadgeClass =
                  ev.status === 'Selesai'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : ev.status === 'Minggu Ini'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : isOverdue || ev.status === 'Terlambat'
                    ? 'bg-red-50 text-red-900 border-red-300'
                    : 'bg-blue-50 text-blue-900 border-blue-200';

                return (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ev.nama_kegiatan}</div>
                      <div className="mt-0.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 font-mono">
                        {ev.tahapan_siklus}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-700">{ev.tanggal_mulai}</td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-900">{ev.tanggal_tenggat}</td>
                    <td className="px-3 py-3 text-slate-700">{ev.unit_prodi}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold ${statusBadgeClass}`}>
                        {ev.status === 'Selesai' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {isOverdue ? 'Terlambat' : ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={ev.keterangan}>
                      {ev.keterangan || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ev)}
                            className="rounded p-1 text-blue-800 hover:bg-blue-50 transition-colors"
                            title="Edit Agenda"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ev.id)}
                            className="rounded p-1 text-red-700 hover:bg-red-50 transition-colors"
                            title="Hapus Agenda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal for Admin */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold">
                {modalState.mode === 'add' ? 'Tambah Agenda Kalender Audit Baru' : 'Edit Agenda Kalender Audit'}
              </h3>
              <button
                type="button"
                onClick={() => setModalState({ open: false, mode: 'add', event: null })}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan Audit</label>
                <input
                  type="text"
                  required
                  value={formData.nama_kegiatan}
                  onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                  placeholder="Contoh: Audit Lapangan S1 Informatika"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahapan Siklus AMI</label>
                  <select
                    value={formData.tahapan_siklus}
                    onChange={(e) => setFormData({ ...formData, tahapan_siklus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                  >
                    <option value="Persiapan">Persiapan</option>
                    <option value="Pengisian Instrumen">Pengisian Instrumen</option>
                    <option value="Audit Kecukupan">Audit Kecukupan</option>
                    <option value="Audit Lapangan">Audit Lapangan</option>
                    <option value="Penyusunan PTK/RTL">Penyusunan PTK/RTL</option>
                    <option value="Monev Berjenjang">Monev Berjenjang</option>
                    <option value="RTM & Pelaporan">RTM &amp; Pelaporan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Minggu Ini">Minggu Ini</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Terlambat">Terlambat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Tenggat (Deadline)</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_tenggat}
                    onChange={(e) => setFormData({ ...formData, tanggal_tenggat: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit / Sasaran Prodi</label>
                <input
                  type="text"
                  required
                  value={formData.unit_prodi}
                  onChange={(e) => setFormData({ ...formData, unit_prodi: e.target.value })}
                  placeholder="Contoh: Fakultas MIPA atau Semua 118 Program Studi"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Deskripsi</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Catatan pelaksanaan kegiatan..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalState({ open: false, mode: 'add', event: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-950 transition-colors"
                >
                  {modalState.mode === 'add' ? 'Simpan Agenda' : 'Perbarui Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
