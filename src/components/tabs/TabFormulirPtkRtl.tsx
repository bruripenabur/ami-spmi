import React, { useMemo } from 'react';
import { CheckCircle2, Printer, Send, ShieldCheck } from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  PtkWorkflowStatus,
  StudyProgramIdentity,
  UserRole,
} from '../../types/ami';
import {
  createDefaultEvaluation,
  getEffectivePtkWorkflowStatus,
  getKategoriBadgeClasses,
  getKategoriTemuan,
  getPtkWorkflowBadgeClasses,
} from '../../utils/amiCalculations';

interface TabFormulirPtkRtlProps {
  program: StudyProgramIdentity;
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  role: UserRole;
  canEditPtkDraft?: boolean;
  canEditDates?: boolean;
  canSubmitPtkToDekan?: boolean;
  canApprovePtkDekan?: boolean;
  currentUserName?: string;
  onUpdateEvaluation: (
    indicatorId: string,
    patch: Partial<AmiEvaluation>
  ) => void;
  onPrint: () => void;
}

export const TabFormulirPtkRtl: React.FC<TabFormulirPtkRtlProps> = ({
  program,
  indicators,
  evaluations,
  role,
  canEditPtkDraft = true,
  canEditDates,
  canSubmitPtkToDekan = false,
  canApprovePtkDekan = false,
  currentUserName = 'Dekan Fakultas',
  onUpdateEvaluation,
  onPrint,
}) => {
  const isAuditor = canEditDates !== undefined ? canEditDates : role === 'auditor';

  const ptkRows = useMemo(() => {
    return indicators
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
  }, [indicators, evaluations]);

  const workflowCounts = useMemo(() => {
    const countOf = (st: PtkWorkflowStatus) =>
      ptkRows.filter((r) => r.workflowStatus === st).length;
    return {
      draft: countOf('Draft Prodi'),
      pendingDekan: countOf('Menunggu Persetujuan Dekan'),
      approvedDekan: countOf('Disetujui Dekan (Siap Monev)'),
      verified: countOf('Terverifikasi Auditor (Closed-Verified)'),
    };
  }, [ptkRows]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSubmitToDekan = (indicatorId: string) => {
    onUpdateEvaluation(indicatorId, {
      ptk_workflow_status: 'Menunggu Persetujuan Dekan',
    });
  };

  const handleApproveDekan = (indicatorId: string, ev: AmiEvaluation) => {
    onUpdateEvaluation(indicatorId, {
      ptk_workflow_status: 'Disetujui Dekan (Siap Monev)',
      dekan_approved_by: currentUserName,
      dekan_approved_at: todayStr,
      monev_status: ev.monev_status === 'Open' ? 'In Progress' : ev.monev_status,
    });
  };

  const handleApproveAllPending = () => {
    ptkRows.forEach((row) => {
      if (
        row.workflowStatus === 'Draft Prodi' ||
        row.workflowStatus === 'Menunggu Persetujuan Dekan'
      ) {
        handleApproveDekan(row.indicator.id, row.evaluation);
      }
    });
  };

  const pendingApproveCount =
    workflowCounts.draft + workflowCounts.pendingDekan;

  return (
    <div className="space-y-4">
      {/* Workflow Progress KPI Cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">1. Draft Prodi</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-800">
            {workflowCounts.draft}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="text-xs text-amber-800 font-medium">
            2. Menunggu Persetujuan Dekan
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-800">
            {workflowCounts.pendingDekan}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="text-xs text-blue-900 font-medium">
            3. Disetujui Dekan (Siap Monev)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-900">
            {workflowCounts.approvedDekan}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="text-xs text-emerald-800 font-medium">
            4. Terverifikasi Auditor (Closed)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-800">
            {workflowCounts.verified}
          </div>
        </div>
      </div>

      {/* Header Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Formulir Permintaan Tindakan Koreksi (PTK) &amp; Rencana Tindak Lanjut (RTL)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur berjenjang: Draft Prodi &rarr; Menunggu Persetujuan Dekan &rarr; Disetujui Dekan (Siap Monev) &rarr; Terverifikasi Auditor ({ptkRows.length} butir).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canApprovePtkDekan && pendingApproveCount > 0 && (
            <button
              type="button"
              onClick={handleApproveAllPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Disetujui Dekan (Semua {pendingApproveCount} Butir)
            </button>
          )}
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            Cetak Formulir PTK/RTL
          </button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print-only border-b border-slate-300 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src="/unpatti-logo.png"
            alt="Logo UNPATTI"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div>
            <div className="text-xs font-semibold text-slate-600">
              {program.nama_pt} — LPMPP
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              FORMULIR PTK / RTL AUDIT MUTU INTERNAL — {program.nama_prodi}
            </h2>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {ptkRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Seluruh indikator telah berstatus Sesuai (Baik) atau Best Practice. Tidak ada PTK/RTL terbuka.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-3 py-3 font-semibold w-10 text-center">No</th>
                  <th className="px-3 py-3 font-semibold w-60">
                    Referensi Standar &amp; Status Alur
                  </th>
                  <th className="px-3 py-3 font-semibold w-56">
                    Akar Masalah / Penunjang
                  </th>
                  <th className="px-3 py-3 font-semibold w-56">PTK / RTL</th>
                  <th className="px-3 py-3 font-semibold w-36">PIC</th>
                  <th className="px-3 py-3 font-semibold w-32">
                    Selesai PTK &amp; Monev
                  </th>
                  <th className="px-3 py-3 font-semibold w-56">
                    Catatan / Rekomendasi Fakultas
                  </th>
                  {(canSubmitPtkToDekan || canApprovePtkDekan) && (
                    <th className="no-print px-3 py-3 font-semibold w-44 text-center">
                      Aksi Persetujuan
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ptkRows.map(({ indicator, evaluation, kategori, workflowStatus }, idx) => {
                  const isAlreadyApprovedOrVerified =
                    workflowStatus === 'Disetujui Dekan (Siap Monev)' ||
                    workflowStatus === 'Terverifikasi Auditor (Closed-Verified)';

                  return (
                    <tr key={indicator.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-900">
                            {indicator.code}
                          </span>
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${getKategoriBadgeClasses(
                              kategori
                            )}`}
                          >
                            {kategori}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-snug">
                          {indicator.uraian}
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
                        <textarea
                          rows={3}
                          disabled={!isAuditor}
                          value={evaluation.akar_masalah}
                          onChange={(e) =>
                            onUpdateEvaluation(indicator.id, {
                              akar_masalah: e.target.value,
                            })
                          }
                          placeholder="Catatan akar masalah..."
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          rows={3}
                          disabled={!canEditPtkDraft}
                          value={evaluation.ptk_rtl}
                          onChange={(e) =>
                            onUpdateEvaluation(indicator.id, {
                              ptk_rtl: e.target.value,
                            })
                          }
                          placeholder="Uraikan tindakan koreksi / RTL..."
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          disabled={!canEditPtkDraft}
                          value={evaluation.pic}
                          onChange={(e) =>
                            onUpdateEvaluation(indicator.id, {
                              pic: e.target.value,
                            })
                          }
                          placeholder="Penanggung jawab"
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-3 py-3 space-y-1.5">
                        <div>
                          <span className="block text-[10px] text-slate-500">
                            Target PTK
                          </span>
                          <input
                            type="date"
                            disabled={!isAuditor}
                            value={evaluation.waktu_ptk}
                            onChange={(e) =>
                              onUpdateEvaluation(indicator.id, {
                                waktu_ptk: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 disabled:bg-slate-50"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500">
                            Jadwal Monev
                          </span>
                          <input
                            type="date"
                            disabled={!isAuditor}
                            value={evaluation.waktu_monev}
                            onChange={(e) =>
                              onUpdateEvaluation(indicator.id, {
                                waktu_monev: e.target.value,
                              })
                            }
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 disabled:bg-slate-50"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        <textarea
                          rows={3}
                          disabled={!canApprovePtkDekan}
                          value={evaluation.dekan_catatan ?? ''}
                          onChange={(e) =>
                            onUpdateEvaluation(indicator.id, {
                              dekan_catatan: e.target.value,
                            })
                          }
                          placeholder={
                            canApprovePtkDekan
                              ? 'Tuliskan catatan / rekomendasi Dekanat...'
                              : 'Belum ada catatan Dekanat'
                          }
                          className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        />
                        {evaluation.dekan_approved_by && (
                          <div className="text-[10px] text-blue-900 font-medium">
                            Disetujui: {evaluation.dekan_approved_by} ({evaluation.dekan_approved_at})
                          </div>
                        )}
                      </td>
                      {(canSubmitPtkToDekan || canApprovePtkDekan) && (
                        <td className="no-print px-3 py-3 text-center">
                          <div className="flex flex-col gap-1.5 items-center">
                            {canSubmitPtkToDekan && workflowStatus === 'Draft Prodi' && (
                              <button
                                type="button"
                                onClick={() => handleSubmitToDekan(indicator.id)}
                                className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                              >
                                <Send className="h-3 w-3" />
                                Ajukan ke Dekan
                              </button>
                            )}
                            {canApprovePtkDekan && !isAlreadyApprovedOrVerified && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveDekan(indicator.id, evaluation)
                                }
                                className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-[#1D4ED8] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1E40AF] transition-colors"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                                Disetujui Dekan
                              </button>
                            )}
                            {isAlreadyApprovedOrVerified && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Disetujui Dekan
                              </span>
                            )}
                          </div>
                        </td>
                      )}
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
