import React from 'react';
import { ArrowRight } from 'lucide-react';
import { OverallAmiRecap, StandardRecap, StudyProgramIdentity } from '../../types/ami';
import { getKategoriBadgeClasses } from '../../utils/amiCalculations';

interface TabRekapAnalisisProps {
  program: StudyProgramIdentity;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  canInspectInstrumen?: boolean;
  onInspectStandard: (standardId: number) => void;
}

export const TabRekapAnalisis: React.FC<TabRekapAnalisisProps> = ({
  program,
  recaps,
  overall,
  canInspectInstrumen = true,
  onInspectStandard,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Nilai Terbobot Capaian</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {overall.rataRataCapaianTerbobot.toFixed(2)}
          </div>
          <div className="mt-0.5 text-xs font-medium text-blue-900">
            {overall.sebutanOverall}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Nilai Terbobot Target</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {overall.rataRataTargetTerbobot.toFixed(2)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Skala Normalisasi 0–100</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Temuan KTS (Mayor / Minor)</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
            {overall.totalCounts.Mayor} / {overall.totalCounts.Minor}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Wajib Tindakan Koreksi (PTK)
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Observasi & Saran Perbaikan</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {overall.totalCounts.Observasi}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Potensi peningkatan mutu
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Sesuai & Best Practice</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {overall.totalCounts['Sesuai (Baik)'] + overall.totalCounts['Best Practice']}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            {overall.totalCounts['Best Practice']} Best Practice · {overall.totalIndikator} Total Butir
          </div>
        </div>
      </div>

      {/* Main Rekap Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-sm font-semibold">
              Rekapitulasi & Analisis Capaian per Standar SPMI
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {program.nama_prodi} · Normalisasi Skor: (Rata-rata Capaian / 7) × 100
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">
            10 Standar · Auto-Calculated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Standar SPMI</th>
                <th className="px-3 py-3 font-semibold text-right">
                  Nilai Capaian (0–100)
                </th>
                <th className="px-3 py-3 font-semibold">Sebutan Capaian</th>
                <th className="px-3 py-3 font-semibold text-right">
                  Nilai Target (0–100)
                </th>
                <th className="px-3 py-3 font-semibold">Sebutan Target</th>
                <th className="px-3 py-3 font-semibold">Kategori Temuan</th>
                <th className="px-2.5 py-3 font-semibold text-center text-red-700">
                  Mayor
                </th>
                <th className="px-2.5 py-3 font-semibold text-center text-orange-700">
                  Minor
                </th>
                <th className="px-2.5 py-3 font-semibold text-center text-amber-700">
                  Observasi
                </th>
                <th className="px-2.5 py-3 font-semibold text-center text-emerald-700">
                  Sesuai
                </th>
                <th className="px-2.5 py-3 font-semibold text-center text-sky-800">
                  Best Practice
                </th>
                <th className="px-3 py-3 font-semibold text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recaps.map((r) => (
                <tr key={r.standardId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="font-mono text-slate-500 mr-2">
                      {r.standardId}.
                    </span>
                    {r.nama}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    {r.nilaiCapaian.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{r.sebutanCapaian}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums text-slate-700">
                    {r.nilaiTarget.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{r.sebutanTarget}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getKategoriBadgeClasses(
                        r.kategoriTemuan
                      )}`}
                    >
                      {r.kategoriTemuan ?? '-'}
                    </span>
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono font-semibold tabular-nums text-red-700">
                    {r.counts.Mayor}
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono font-semibold tabular-nums text-orange-700">
                    {r.counts.Minor}
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono font-semibold tabular-nums text-amber-700">
                    {r.counts.Observasi}
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono font-semibold tabular-nums text-emerald-700">
                    {r.counts['Sesuai (Baik)']}
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono font-semibold tabular-nums text-sky-800">
                    {r.counts['Best Practice']}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canInspectInstrumen ? (
                      <button
                        type="button"
                        onClick={() => onInspectStandard(r.standardId)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:text-blue-950"
                      >
                        Buka
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Read-Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-900 text-white font-semibold">
                <td className="px-4 py-3.5">Rata-rata Nilai Terbobot / Total</td>
                <td className="px-3 py-3.5 text-right font-mono text-sm text-amber-400 tabular-nums">
                  {overall.rataRataCapaianTerbobot.toFixed(2)}
                </td>
                <td className="px-3 py-3.5 text-slate-200">
                  {overall.sebutanOverall}
                </td>
                <td className="px-3 py-3.5 text-right font-mono text-sm text-slate-200 tabular-nums">
                  {overall.rataRataTargetTerbobot.toFixed(2)}
                </td>
                <td className="px-3 py-3.5 text-slate-300" colSpan={2}>
                  Total Seluruh Indikator: {overall.totalIndikator}
                </td>
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-red-300">
                  {overall.totalCounts.Mayor}
                </td>
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-orange-300">
                  {overall.totalCounts.Minor}
                </td>
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-amber-300">
                  {overall.totalCounts.Observasi}
                </td>
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-emerald-300">
                  {overall.totalCounts['Sesuai (Baik)']}
                </td>
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-sky-300">
                  {overall.totalCounts['Best Practice']}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
