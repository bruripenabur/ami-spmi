import React, { useMemo } from 'react';
import { ArrowRight, AlertCircle, Award, TrendingUp, TrendingDown } from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  AmiTabId,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../../types/ami';
import { getKategoriBadgeClasses, getKategoriTemuan, getSebutan } from '../../utils/amiCalculations';
import { Language, translateStandardName, translateProgramName, translateKategori } from '../../utils/i18n';

interface TabRekapAnalisisProps {
  program: StudyProgramIdentity;
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  canInspectInstrumen?: boolean;
  onInspectStandard: (standardId: number) => void;
  onNavigateTab?: (tab: AmiTabId) => void;
  lang?: Language;
}

export const TabRekapAnalisis: React.FC<TabRekapAnalisisProps> = ({
  program,
  standards,
  indicators,
  evaluations,
  recaps,
  overall,
  canInspectInstrumen = true,
  onInspectStandard,
  onNavigateTab,
  lang = 'ID',
}) => {
  const belowThresholdStandards = recaps.filter(
    (r) => r.evaluatedCount > 0 && r.nilaiCapaian < 60
  );

  // Compute Top 5 Highest & Top 5 Lowest indicators
  const { topHighest, topLowest } = useMemo(() => {
    const evaluatedList = indicators
      .map((ind) => {
        const ev = evaluations[ind.id];
        const val = ev?.nilai_capaian ?? null;
        const std = standards.find((s) => s.id === ind.standard_id);
        const kategori = getKategoriTemuan(val, ev?.target_1_yr ?? null, ev?.kategori_override ?? null);
        return {
          indicator: ind,
          standard: std,
          eval: ev,
          val,
          kategori,
        };
      })
      .filter((item) => item.val !== null) as {
        indicator: AmiIndicator;
        standard: AmiStandard | undefined;
        eval: AmiEvaluation;
        val: number;
        kategori: ReturnType<typeof getKategoriTemuan>;
      }[];

    const sortedByVal = [...evaluatedList].sort((a, b) => b.val - a.val);
    const highest = sortedByVal.slice(0, 5);
    const lowest = [...evaluatedList].sort((a, b) => a.val - b.val).slice(0, 5);

    return { topHighest: highest, topLowest: lowest };
  }, [indicators, evaluations, standards]);

  return (
    <div className="space-y-6">
      {/* Warning Banner if any standard is below threshold */}
      {belowThresholdStandards.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-900">
                {lang === 'EN'
                  ? `Quality Alert: ${belowThresholdStandards.length} SPMI Standards are Below the Minimum Threshold (< 60.00)`
                  : `Peringatan Mutu: ${belowThresholdStandards.length} Standar SPMI Berada di Bawah Ambang Batas Minimal (< 60.00)`}
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                {lang === 'EN'
                  ? `The following standards require immediate corrective action: ${belowThresholdStandards.map((s) => `${s.standardId}. ${translateStandardName(s.nama, lang)} (${s.nilaiCapaian.toFixed(2)})`).join(', ')}.`
                  : `Standar berikut memerlukan tindakan koreksi segera: ${belowThresholdStandards.map((s) => `${s.standardId}. ${s.nama} (${s.nilaiCapaian.toFixed(2)})`).join(', ')}.`}
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('perengkingan')}
                className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900"
              >
                {lang === 'EN' ? 'View Ranking & Clusters' : 'Lihat Perengkingan & Klaster'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">
            {lang === 'EN' ? 'Weighted Achievement' : 'Nilai Terbobot Capaian'}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {overall.rataRataCapaianTerbobot.toFixed(2)}
          </div>
          <div className="mt-0.5 text-xs font-medium text-blue-900">
            {overall.sebutanOverall}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">
            {lang === 'EN' ? 'Weighted Target' : 'Nilai Terbobot Target'}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {overall.rataRataTargetTerbobot.toFixed(2)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {lang === 'EN' ? 'Normalized Scale 0–100' : 'Skala Normalisasi 0–100'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">
            {lang === 'EN' ? 'Findings (Major / Minor)' : 'Temuan KTS (Mayor / Minor)'}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
            {overall.totalCounts.Mayor} / {overall.totalCounts.Minor}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {lang === 'EN' ? 'Corrective Action Required (CAR)' : 'Wajib Tindakan Koreksi (PTK)'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">
            {lang === 'EN' ? 'Observations & Suggestions' : 'Observasi & Saran Perbaikan'}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {overall.totalCounts.Observasi}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {lang === 'EN' ? 'Quality Improvement Potential' : 'Potensi peningkatan mutu'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">
            {lang === 'EN' ? 'Achieved & Best Practice' : 'Sesuai & Best Practice'}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {overall.totalCounts['Sesuai (Baik)'] + overall.totalCounts['Best Practice']}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            {overall.totalCounts['Best Practice']} Best Practice · {overall.totalIndikator} {lang === 'EN' ? 'Total Items' : 'Total Butir'}
          </div>
        </div>
      </div>

      {/* Highlight Indikator (Top 5 Tertinggi & Top 5 Terendah) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top 5 Tertinggi */}
        <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-emerald-950">
                {lang === 'EN'
                  ? 'Top 5 Highest Performing Indicators (Superior Performance)'
                  : 'Top 5 Indikator Capaian Tertinggi (Kinerja Unggul)'}
              </h3>
            </div>
            <span className="rounded bg-emerald-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-900">
              {lang === 'EN' ? 'Scores 6 & 7' : 'Skor 6 & 7'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{lang === 'EN' ? 'Indicator' : 'Indikator'}</th>
                  <th className="px-3 py-2.5 font-semibold">{lang === 'EN' ? 'SPMI Standard' : 'Standar SPMI'}</th>
                  <th className="px-3 py-2.5 font-semibold text-right">{lang === 'EN' ? 'Score' : 'Skor'}</th>
                  <th className="px-3 py-2.5 font-semibold text-right">{lang === 'EN' ? 'Action' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topHighest.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      {lang === 'EN' ? 'No indicators evaluated yet.' : 'Belum ada indikator yang dievaluasi dengan skor capaian.'}
                    </td>
                  </tr>
                ) : (
                  topHighest.map((item) => (
                    <tr key={item.indicator.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="font-mono font-bold text-slate-900">
                          {item.indicator.code}
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">
                          {item.indicator.uraian}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 text-[11px]">
                        {item.standard ? `${item.standard.id}. ${translateStandardName(item.standard.nama, lang)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 font-mono font-bold text-emerald-900">
                          {item.val} ({getSebutan(item.val as any)})
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {canInspectInstrumen && item.standard ? (
                          <button
                            type="button"
                            onClick={() => onInspectStandard(item.standard!.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950"
                          >
                            {lang === 'EN' ? 'Audit' : 'Audit'}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Terendah (Prioritas Intervensi) */}
        <div className="rounded-xl border border-red-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-700" />
              <h3 className="text-sm font-bold text-red-950">
                {lang === 'EN'
                  ? 'Top 5 Lowest Performing Indicators (Priority Action)'
                  : 'Top 5 Indikator Capaian Terendah (Prioritas Intervensi KTS)'}
              </h3>
            </div>
            <span className="rounded bg-red-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-900">
              {lang === 'EN' ? 'Scores 1 & 2' : 'Skor 1 & 2'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{lang === 'EN' ? 'Indicator' : 'Indikator'}</th>
                  <th className="px-3 py-2.5 font-semibold">{lang === 'EN' ? 'SPMI Standard' : 'Standar SPMI'}</th>
                  <th className="px-3 py-2.5 font-semibold text-right">{lang === 'EN' ? 'Score' : 'Skor'}</th>
                  <th className="px-3 py-2.5 font-semibold text-right">{lang === 'EN' ? 'Action' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topLowest.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      {lang === 'EN' ? 'No indicators evaluated yet.' : 'Belum ada indikator yang dievaluasi dengan skor capaian.'}
                    </td>
                  </tr>
                ) : (
                  topLowest.map((item) => (
                    <tr key={item.indicator.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="font-mono font-bold text-slate-900">
                          {item.indicator.code}
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">
                          {item.indicator.uraian}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 text-[11px]">
                        {item.standard ? `${item.standard.id}. ${translateStandardName(item.standard.nama, lang)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-block rounded bg-red-100 px-2 py-0.5 font-mono font-bold text-red-950">
                          {item.val} ({getSebutan(item.val as any)})
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {canInspectInstrumen && item.standard ? (
                          <button
                            type="button"
                            onClick={() => onInspectStandard(item.standard!.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950"
                          >
                            {lang === 'EN' ? 'Inspect' : 'Periksa'}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Rekap Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div>
            <h2 className="text-sm font-semibold">
              {lang === 'EN'
                ? 'Recap & Achievement Analysis per SPMI Standard'
                : 'Rekapitulasi & Analisis Capaian per Standar SPMI'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {translateProgramName(program.nama_prodi, lang)} · {lang === 'EN' ? 'Normalized Score: (Average Achievement / 7) × 100' : 'Normalisasi Skor: (Rata-rata Capaian / 7) × 100'}
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400">
            {lang === 'EN' ? '10 Standards · Auto-Calculated' : '10 Standar · Auto-Calculated'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">{lang === 'EN' ? 'SPMI Standard' : 'Standar SPMI'}</th>
                <th className="px-3 py-3 font-semibold text-right">
                  {lang === 'EN' ? 'Achievement Score (0–100)' : 'Nilai Capaian (0–100)'}
                </th>
                <th className="px-3 py-3 font-semibold">{lang === 'EN' ? 'Achievement Predicate' : 'Sebutan Capaian'}</th>
                <th className="px-3 py-3 font-semibold text-right">
                  {lang === 'EN' ? 'Target Score (0–100)' : 'Nilai Target (0–100)'}
                </th>
                <th className="px-3 py-3 font-semibold">{lang === 'EN' ? 'Target Predicate' : 'Sebutan Target'}</th>
                <th className="px-3 py-3 font-semibold">{lang === 'EN' ? 'Findings Category' : 'Kategori Temuan'}</th>
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
              {recaps.map((r) => {
                const totalInd = r.indicatorCount || 1;
                const evaluated = r.evaluatedCount ?? 0;
                const pct = Math.round((evaluated / totalInd) * 100);
                const barColor =
                  pct < 50 ? 'bg-red-500' : pct < 100 ? 'bg-amber-500' : 'bg-emerald-600';

                return (
                  <tr key={r.standardId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-950">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-500 font-semibold mr-1">
                          {r.standardId}.
                        </span>
                        <span className="flex-1">{translateStandardName(r.nama, lang)}</span>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{lang === 'EN' ? `Progress: ${evaluated} / ${r.indicatorCount} Indicators` : `Progres: ${evaluated} / ${r.indicatorCount} Indikator`}</span>
                          <span className="font-mono font-bold text-slate-800">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
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
                );
              })}
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
                <td className="px-2.5 py-3.5 text-center font-mono tabular-nums text-sky-200">
                  {overall.totalCounts['Best Practice']}
                </td>
                <td className="px-3 py-3.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
