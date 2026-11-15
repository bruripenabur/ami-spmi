import React, { useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Lock } from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  MonevStatus,
  UserRole,
} from '../../types/ami';
import {
  createDefaultEvaluation,
  getEffectivePtkWorkflowStatus,
  getKategoriBadgeClasses,
  getKategoriTemuan,
  getMonevBadgeClasses,
  getPtkWorkflowBadgeClasses,
} from '../../utils/amiCalculations';

interface TabMonevPtkProps {
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  role: UserRole;
  canUploadEvidence?: boolean;
  canVerifyClosed?: boolean;
  allowedStandardIds?: number[] | 'all';
  onUpdateEvaluation: (
    indicatorId: string,
    patch: Partial<AmiEvaluation>
  ) => void;
}

const MONEV_OPTIONS: MonevStatus[] = ['Open', 'In Progress', 'Closed - Verified'];

export const TabMonevPtk: React.FC<TabMonevPtkProps> = ({
  indicators,
  evaluations,
  role,
  canUploadEvidence,
  canVerifyClosed,
  allowedStandardIds = 'all',
  onUpdateEvaluation,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | MonevStatus>('all');
  const isAuditor =
    canVerifyClosed !== undefined ? canVerifyClosed : role === 'auditor';
  const allowUpload =
    canUploadEvidence !== undefined ? canUploadEvidence : role === 'auditee';

  const monevRows = useMemo(() => {
    return indicators
      .filter(
        (ind) =>
          allowedStandardIds === 'all' ||
          allowedStandardIds.includes(ind.standard_id)
      )
      .map((ind) => {
        const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
        const kat = getKategoriTemuan(
          ev.nilai_capaian,
          ev.target_1_yr,
          ev.kategori_override
        );
        const workflowStatus = getEffectivePtkWorkflowStatus(ev);
        return { indicator: ind, evaluation: ev, kategori: kat, workflowStatus };
      })
      .filter(
        (row) =>
          row.kategori === 'Mayor' ||
          row.kategori === 'Minor' ||
          row.kategori === 'Observasi'
      );
  }, [indicators, evaluations, allowedStandardIds]);

  const counts = useMemo(() => {
    return {
      total: monevRows.length,
      open: monevRows.filter((r) => r.evaluation.monev_status === 'Open').length,
      inProgress: monevRows.filter(
        (r) => r.evaluation.monev_status === 'In Progress'
      ).length,
      closed: monevRows.filter(
        (r) => r.evaluation.monev_status === 'Closed - Verified'
      ).length,
    };
  }, [monevRows]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return monevRows;
    return monevRows.filter((r) => r.evaluation.monev_status === statusFilter);
  }, [monevRows, statusFilter]);

  const isUrl = (val: string) =>
    val.startsWith('http://') || val.startsWith('https://');

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Total Tindak Lanjut PTK</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {counts.total}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Status Open</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
            {counts.open}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Status In Progress</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {counts.inProgress}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Closed - Verified</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {counts.closed}
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Monitoring &amp; Evaluasi (Monev) Realisasi PTK / RTL
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAuditor
              ? 'Verifikasi akhir Auditor (Closed - Verified) hanya terbuka setelah formulir PTK disetujui Dekan Fakultas.'
              : allowUpload
              ? 'Unggah tautan bukti realisasi & tanggal penyelesaian (status Closed - Verified hanya ditetapkan Auditor setelah persetujuan Dekan).'
              : 'Mode Hanya Baca: Pemantauan progres penyelesaian PTK/RTL oleh Program Studi dan Auditor.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({counts.total})
          </button>
          {MONEV_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Monev Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Tidak ada item Monev pada filter status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-3 py-3 font-semibold w-12 text-center">No</th>
                  <th className="px-3 py-3 font-semibold w-72">
                    Temuan AMI &amp; Status Persetujuan PTK
                  </th>
                  <th className="px-3 py-3 font-semibold w-28">
                    Kategori Temuan
                  </th>
                  <th className="px-3 py-3 font-semibold w-64">PTK / RTL</th>
                  <th className="px-3 py-3 font-semibold w-36">PIC</th>
                  <th className="px-3 py-3 font-semibold w-64">
                    Bukti Realisasi PTK/RTL (URL / Keterangan)
                  </th>
                  <th className="px-3 py-3 font-semibold w-36">
                    Tanggal Penyelesaian
                  </th>
                  <th className="px-3 py-3 font-semibold w-52">
                    Status Verifikasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(({ indicator, evaluation, kategori, workflowStatus }, idx) => {
                  const isApprovedByDekan =
                    workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
                    workflowStatus === 'Terverifikasi Auditor (Closed-Verified)';
                  const canCloseNow = isAuditor && isApprovedByDekan;

                  return (
                    <tr
                      key={indicator.id}
                      className="align-top hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 space-y-1.5">
                        <div className="font-mono font-semibold text-blue-900">
                          {indicator.code} — {indicator.uraian}
                        </div>
                        <p className="text-slate-600 leading-snug">
                          {evaluation.nilai_capaian !== null
                            ? `Skor ${evaluation.nilai_capaian}: ${indicator.rubric_levels[evaluation.nilai_capaian]}`
                            : 'Belum Dinilai'}
                        </p>
                        <div>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${getPtkWorkflowBadgeClasses(
                              workflowStatus
                            )}`}
                          >
                            {workflowStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getKategoriBadgeClasses(
                            kategori
                          )}`}
                        >
                          {kategori}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-800 leading-relaxed space-y-1">
                        <div>
                          {evaluation.ptk_rtl || (
                            <span className="italic text-slate-400">
                              Belum ada PTK/RTL tertulis
                            </span>
                          )}
                        </div>
                        {evaluation.dekan_catatan && (
                          <div className="rounded bg-blue-50/70 border border-blue-100 px-2 py-1 text-[11px] text-blue-900">
                            <strong>Catatan Dekan:</strong> {evaluation.dekan_catatan}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {evaluation.pic || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1.5">
                          <textarea
                            rows={2}
                            disabled={!allowUpload && !isAuditor}
                            value={evaluation.bukti_realisasi}
                            onChange={(e) =>
                              onUpdateEvaluation(indicator.id, {
                                bukti_realisasi: e.target.value,
                              })
                            }
                            placeholder="Tempel link Google Drive / status realisasi..."
                            className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                          />
                          {isUrl(evaluation.bukti_realisasi.trim()) && (
                            <a
                              href={evaluation.bukti_realisasi.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Buka Bukti Realisasi
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="date"
                          disabled={!allowUpload && !isAuditor}
                          value={evaluation.tanggal_penyelesaian}
                          onChange={(e) =>
                            onUpdateEvaluation(indicator.id, {
                              tanggal_penyelesaian: e.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50"
                        />
                      </td>
                      <td className="px-3 py-3 space-y-1.5">
                        <select
                          disabled={!allowUpload && !isAuditor}
                          title={
                            isAuditor && !isApprovedByDekan
                              ? 'Menunggu persetujuan Dekan sebelum dapat diverifikasi Closed - Verified'
                              : undefined
                          }
                          value={evaluation.monev_status}
                          onChange={(e) => {
                            const next = e.target.value as MonevStatus;
                            if (next === 'Closed - Verified' && !canCloseNow) {
                              return;
                            }
                            onUpdateEvaluation(indicator.id, {
                              monev_status: next,
                              ptk_workflow_status:
                                next === 'Closed - Verified'
                                  ? 'Terverifikasi Auditor (Closed-Verified)'
                                  : isApprovedByDekan
                                  ? 'Disetujui Dekan (Siap Monev)'
                                  : workflowStatus,
                            });
                          }}
                          className={`w-full rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none disabled:opacity-80 ${getMonevBadgeClasses(
                            evaluation.monev_status
                          )}`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option
                            value="Closed - Verified"
                            disabled={!canCloseNow}
                          >
                            Closed - Verified{' '}
                            {!isAuditor
                              ? '(Auditor Only)'
                              : !isApprovedByDekan
                              ? '(Menunggu persetujuan Dekan)'
                              : ''}
                          </option>
                        </select>

                        {!isApprovedByDekan && (
                          <div
                            title="Menunggu persetujuan Dekan"
                            className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-800"
                          >
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>Menunggu persetujuan Dekan</span>
                          </div>
                        )}
                        {isApprovedByDekan &&
                          evaluation.monev_status !== 'Closed - Verified' &&
                          isAuditor && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-800">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>Siap diverifikasi Auditor</span>
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
