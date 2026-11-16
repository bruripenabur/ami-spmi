import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Printer, FileSpreadsheet } from 'lucide-react';
import {
  AmiCycle,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../../types/ami';

interface TabLaporanVisualisasiProps {
  program: StudyProgramIdentity;
  cycle: AmiCycle;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  onPrintPdf: () => void;
  onExportExcel: () => void;
  canExport?: boolean;
}

export const TabLaporanVisualisasi: React.FC<TabLaporanVisualisasiProps> = ({
  program,
  cycle,
  recaps,
  overall,
  onPrintPdf,
  onExportExcel,
  canExport = false,
}) => {
  // Chart 1 data: Horizontal Grouped Bar Chart (Jumlah Temuan per Standar)
  const findingsChartData = [...recaps]
    .reverse()
    .map((r) => ({
      name: `${r.standardId}. ${r.nama.replace('Standar ', '')}`,
      'Best Practice': r.counts['Best Practice'],
      Observasi: r.counts.Observasi,
      Minor: r.counts.Minor,
      Mayor: r.counts.Mayor,
    }));

  // Chart 2 data: Horizontal Paired Bar Chart (Nilai Capaian vs Target + Rata-rata terboboti at top)
  const scoreChartData = [
    {
      name: 'Rata-rata terboboti',
      'Nilai capaian (0-100)': overall.rataRataCapaianTerbobot,
      'Nilai target (0-100)': overall.rataRataTargetTerbobot,
    },
    ...[...recaps].reverse().map((r) => ({
      name: `${r.standardId}. ${r.nama.replace('Standar ', '')}`,
      'Nilai capaian (0-100)': r.nilaiCapaian,
      'Nilai target (0-100)': r.nilaiTarget,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Laporan Eksekutif AMI & Visualisasi Grafik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Siap dicetak sebagai PDF resmi LPMPP Universitas Pattimura atau diunduh ke Excel.
          </p>
        </div>
        {canExport && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              Export Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onPrintPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              Cetak / Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Printable Official Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 print-break-inside-avoid">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-5">
          <div className="flex items-start gap-4">
            <img
              src="/unpatti-logo.png"
              alt="Logo Universitas Pattimura"
              className="h-14 w-14 shrink-0 object-contain"
            />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)
              </div>
              <h1 className="mt-1 text-xl font-bold text-slate-900">
                REKAPITULASI HASIL AUDIT MUTU INTERNAL (AMI) SPMI
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>{program.nama_pt}</span>
                <span aria-hidden="true">·</span>
                <span>{program.fakultas}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-900">
                  {program.kode_ps} — {program.nama_prodi}
                </span>
                <span aria-hidden="true">·</span>
                <span>Siklus {cycle.tahun_siklus}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-right">
            <div className="text-[11px] font-medium text-slate-500">
              Skor Terbobot AMI Prodi
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {overall.rataRataCapaianTerbobot.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-blue-900">
              {overall.sebutanOverall} (Target: {overall.rataRataTargetTerbobot.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] text-slate-500">Total Indikator</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900">
              {overall.totalIndikator}
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <div className="text-[11px] text-red-700 font-medium">Mayor</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-red-700">
              {overall.totalCounts.Mayor}
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
            <div className="text-[11px] text-orange-700 font-medium">Minor</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-orange-700">
              {overall.totalCounts.Minor}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="text-[11px] text-amber-800 font-medium">Observasi</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-amber-800">
              {overall.totalCounts.Observasi}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="text-[11px] text-emerald-700 font-medium">Sesuai (Baik)</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-emerald-700">
              {overall.totalCounts['Sesuai (Baik)']}
            </div>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3">
            <div className="text-[11px] text-sky-800 font-medium">Best Practice</div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-sky-800">
              {overall.totalCounts['Best Practice']}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Horizontal Grouped Bar Chart — Jumlah Temuan per Standar */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 print-break-inside-avoid">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Grafik 1. Jumlah Temuan per Standar SPMI
            </h3>
            <p className="text-xs text-slate-500">
              Distribusi Best Practice, Observasi, Minor, dan Mayor pada 10 Standar
            </p>
          </div>
          <div className="h-[460px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={findingsChartData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 20, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={185}
                  tick={{ fontSize: 11, fill: '#0f172a' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Best Practice" fill="#0284c7" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Observasi" fill="#f59e0b" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Minor" fill="#ea580c" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Mayor" fill="#dc2626" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Horizontal Paired Bar Chart — Perbandingan Nilai Capaian vs Target */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 print-break-inside-avoid">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Grafik 2. Perbandingan Nilai Capaian vs Nilai Target per Standar
            </h3>
            <p className="text-xs text-slate-500">
              Skala terstandarisasi 0–100 termasuk Rata-rata Terboboti
            </p>
          </div>
          <div className="h-[460px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreChartData}
                layout="vertical"
                margin={{ top: 8, right: 28, left: 20, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={185}
                  tick={{ fontSize: 11, fill: '#0f172a' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Nilai capaian (0-100)" fill="#1e3a8a" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Nilai target (0-100)" fill="#d97706" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Official Sign-Off Footer for Printed Report */}
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm print-break-inside-avoid">
        <div>
          <p className="text-slate-600">Mengetahui,</p>
          <p className="font-semibold text-slate-900">Dekan {program.fakultas}</p>
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
  );
};
