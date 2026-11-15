import React, { useMemo, useState } from 'react';
import { ExternalLink, ClipboardEdit, Search } from 'lucide-react';
import {
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  KategoriTemuan,
} from '../../types/ami';
import {
  buildPlorCaNarrative,
  createDefaultEvaluation,
  getKategoriBadgeClasses,
  getKategoriTemuan,
} from '../../utils/amiCalculations';

interface TabDaftarTemuanProps {
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  canEditPlorCa?: boolean;
  allowedStandardIds?: number[] | 'all';
  onOpenPlorCa: (indicator: AmiIndicator) => void;
}

type FindingFilter = 'Semua Temuan' | 'Mayor' | 'Minor' | 'Observasi' | 'Best Practice';

const FILTERS: FindingFilter[] = [
  'Semua Temuan',
  'Mayor',
  'Minor',
  'Observasi',
  'Best Practice',
];

export const TabDaftarTemuan: React.FC<TabDaftarTemuanProps> = ({
  standards,
  indicators,
  evaluations,
  canEditPlorCa = true,
  allowedStandardIds = 'all',
  onOpenPlorCa,
}) => {
  const [filter, setFilter] = useState<FindingFilter>('Semua Temuan');
  const [search, setSearch] = useState('');

  const allFindings = useMemo(() => {
    return indicators
      .filter(
        (ind) =>
          allowedStandardIds === 'all' ||
          allowedStandardIds.includes(ind.standard_id)
      )
      .map((ind) => {
        const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
        const std = standards.find((s) => s.id === ind.standard_id);
        const kategori = getKategoriTemuan(
          ev.nilai_capaian,
          ev.target_1_yr,
          ev.kategori_override
        );
        return { indicator: ind, evaluation: ev, standard: std, kategori };
      })
      .filter(
        (item): item is typeof item & { kategori: KategoriTemuan } =>
          item.kategori !== null && item.kategori !== 'Sesuai (Baik)'
      );
  }, [indicators, evaluations, standards, allowedStandardIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFindings.filter((item) => {
      if (filter !== 'Semua Temuan' && item.kategori !== filter) return false;
      if (!q) return true;
      return (
        item.indicator.code.toLowerCase().includes(q) ||
        item.indicator.uraian.toLowerCase().includes(q) ||
        (item.standard?.nama.toLowerCase().includes(q) ?? false) ||
        item.evaluation.akar_masalah.toLowerCase().includes(q)
      );
    });
  }, [allFindings, filter, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Temuan AMI (Ketidaksesuaian / KTS, Observasi & Best Practice)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dihimpun otomatis dari Instrumen Evaluasi (menampilkan seluruh indikator selain kategori Sesuai / Baik).
            </p>
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari temuan atau akar masalah..."
              className="w-64 rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Segmented Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const count =
              f === 'Semua Temuan'
                ? allFindings.length
                : allFindings.filter((x) => x.kategori === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Tidak ada temuan pada kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 font-semibold w-12 text-center">No</th>
                  <th className="px-3 py-3 font-semibold w-44">Standar</th>
                  <th className="px-3 py-3 font-semibold w-64">Uraian Standar</th>
                  <th className="px-3 py-3 font-semibold w-80">
                    Temuan Audit (Kondisi Saat Ini & Bukti)
                  </th>
                  <th className="px-3 py-3 font-semibold w-32">Kategori Temuan</th>
                  <th className="px-3 py-3 font-semibold">
                    Akar Masalah / Penunjang (PLOR+CA)
                  </th>
                  <th className="px-3 py-3 font-semibold w-24 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item, idx) => {
                  const plorNarrative = buildPlorCaNarrative(
                    item.evaluation.plor_ca
                  );
                  return (
                    <tr
                      key={item.indicator.id}
                      className="align-top hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.standard
                          ? `${item.standard.id}. ${item.standard.nama}`
                          : item.indicator.standard_id}
                      </td>
                      <td className="px-3 py-3 text-slate-800">
                        <span className="font-mono font-semibold text-blue-900 mr-1.5">
                          {item.indicator.code}
                        </span>
                        {item.indicator.uraian}
                      </td>
                      <td className="px-3 py-3 text-slate-700 leading-relaxed">
                        <div>
                          <span className="font-mono font-semibold text-slate-900">
                            {item.evaluation.nilai_capaian !== null
                              ? `Skor ${item.evaluation.nilai_capaian}:`
                              : 'Belum Dinilai:'}
                          </span>{' '}
                          {item.evaluation.nilai_capaian !== null
                            ? item.indicator.rubric_levels[
                                item.evaluation.nilai_capaian
                              ]
                            : '-'}
                        </div>
                        {item.evaluation.bukti_link && (
                          <a
                            href={item.evaluation.bukti_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Lihat Bukti Dokumen
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getKategoriBadgeClasses(
                            item.kategori
                          )}`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 leading-relaxed space-y-1">
                        {item.evaluation.akar_masalah && (
                          <p>{item.evaluation.akar_masalah}</p>
                        )}
                        {plorNarrative && (
                          <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-1">
                            {plorNarrative}
                          </p>
                        )}
                        {!item.evaluation.akar_masalah && !plorNarrative && (
                          <span className="italic text-slate-400">
                            Belum ada catatan akar masalah / PLOR+CA.
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenPlorCa(item.indicator)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <ClipboardEdit className="h-3 w-3" />
                          {canEditPlorCa ? 'PLOR+CA' : 'Lihat PLOR+CA'}
                        </button>
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
