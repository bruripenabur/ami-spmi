import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../../types/ami';
import {
  createDefaultEvaluation,
  getKategoriBadgeClasses,
  getKategoriTemuan,
} from '../../utils/amiCalculations';
import { exportAmiPdf } from '../../utils/exportPdf';
import {
  Language,
  translateStandardName,
  translateFaculty,
  translateProgramName,
  translateSebutan,
  translateKategori,
  translateMonevStatus,
} from '../../utils/i18n';

export type PrintPreviewMode = 'ppepp_summary' | 'laporan_ami' | 'ptk_rtl';

interface PrintPreviewModalProps {
  isOpen: boolean;
  mode: PrintPreviewMode;
  onClose: () => void;
  program: StudyProgramIdentity;
  cycle: AmiCycle;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  ppeppStats?: {
    penetapan: number;
    pelaksanaan: number;
    evaluasi: number;
    pengendalian: number;
    peningkatan: number;
    indeks: number;
    label: string;
  };
  lang?: Language;
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  mode,
  onClose,
  program,
  cycle,
  recaps,
  overall,
  indicators,
  evaluations,
  ppeppStats,
  lang = 'ID',
}) => {
  const [busyPdf, setBusyPdf] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const ptkRows = indicators
    .map((ind) => {
      const ev = evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
      const kat = getKategoriTemuan(
        ev.nilai_capaian,
        ev.target_1_yr,
        ev.kategori_override
      );
      return { indicator: ind, evaluation: ev, kategori: kat };
    })
    .filter(
      (r) =>
        r.kategori === 'Mayor' ||
        r.kategori === 'Minor' ||
        r.kategori === 'Observasi'
    );

  const titleByMode: Record<PrintPreviewMode, string> = {
    ppepp_summary:
      lang === 'EN'
        ? 'EVALUATION & EFFECTIVENESS SUMMARY OF THE PPEPP CYCLE'
        : 'RINGKASAN EVALUASI & EFEKTIFITAS SIKLUS PPEPP',
    laporan_ami:
      lang === 'EN'
        ? 'EXECUTIVE REPORT OF INTERNAL QUALITY AUDIT (AMI) SPMI'
        : 'LAPORAN EKSEKUTIF AUDIT MUTU INTERNAL (AMI) SPMI',
    ptk_rtl:
      lang === 'EN'
        ? 'CORRECTIVE ACTION REQUEST (CAR) & ACTION PLAN (RTL) FORM'
        : 'FORMULIR PERMINTAAN TINDAKAN KOREKSI (PTK) & RTL',
  };

  const buildPrintableHtmlDoc = () => {
    const logoUrl = `${window.location.origin}/unpatti-logo.png`;
    const recapRowsHtml = recaps
      .map(
        (r) => `
      <tr>
        <td style="text-align:center;font-family:monospace;">${r.standardId}</td>
        <td>${escapeHtml(translateStandardName(r.nama, lang))}</td>
        <td style="text-align:right;font-family:monospace;font-weight:bold;">${r.nilaiCapaian.toFixed(2)}</td>
        <td>${escapeHtml(translateSebutan(r.sebutanCapaian, lang))}</td>
        <td style="text-align:right;font-family:monospace;">${r.nilaiTarget.toFixed(2)}</td>
        <td style="text-align:center;">${escapeHtml(r.kategoriTemuan ? translateKategori(r.kategoriTemuan, lang) : '-')}</td>
        <td style="text-align:center;font-family:monospace;">${r.counts.Mayor}/${r.counts.Minor}/${r.counts.Observasi}</td>
      </tr>`
      )
      .join('');

    const ptkRowsHtml = ptkRows
      .map(
        (row, idx) => `
      <tr>
        <td style="text-align:center;font-family:monospace;">${idx + 1}</td>
        <td><strong>${escapeHtml(row.indicator.code)}</strong> (${escapeHtml(row.kategori ? translateKategori(row.kategori, lang) : '-')})<br/>${escapeHtml(row.indicator.uraian)}</td>
        <td>${escapeHtml(row.evaluation.akar_masalah || '-')}</td>
        <td>${escapeHtml(row.evaluation.ptk_rtl || '-')}</td>
        <td>${escapeHtml(row.evaluation.pic || '-')}</td>
        <td style="font-family:monospace;">${escapeHtml(row.evaluation.waktu_ptk || '-')}</td>
        <td style="text-align:center;">${escapeHtml(translateMonevStatus(row.evaluation.monev_status, lang))}</td>
      </tr>`
      )
      .join('');

    const ppeppSectionHtml = ppeppStats
      ? `
      <div class="box" style="margin-bottom:16px;">
        <strong>${lang === 'EN' ? 'Effectiveness Index Summary of PPEPP Cycle' : 'Ringkasan Indeks Efektifitas Siklus PPEPP'}: ${ppeppStats.indeks}% (${escapeHtml(ppeppStats.label)})</strong>
        <table style="margin-top:8px;">
          <thead>
            <tr>
              <th>${lang === 'EN' ? 'P1 Setting' : 'P1 Penetapan'}</th>
              <th>${lang === 'EN' ? 'P2 Implementation' : 'P2 Pelaksanaan'}</th>
              <th>${lang === 'EN' ? 'E Evaluation' : 'E Evaluasi'}</th>
              <th>${lang === 'EN' ? 'P3 Control' : 'P3 Pengendalian'}</th>
              <th>${lang === 'EN' ? 'P4 Improvement' : 'P4 Peningkatan'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="text-align:center;font-family:monospace;font-weight:bold;">
              <td>${ppeppStats.penetapan}%</td>
              <td>${ppeppStats.pelaksanaan}%</td>
              <td>${ppeppStats.evaluasi}%</td>
              <td>${ppeppStats.pengendalian}%</td>
              <td>${ppeppStats.peningkatan}%</td>
            </tr>
          </tbody>
        </table>
      </div>`
      : '';

    return `<!doctype html>
<html lang="${lang === 'EN' ? 'en' : 'id'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titleByMode[mode])} - ${escapeHtml(translateProgramName(program.nama_prodi, lang))}</title>
<style>
  @page { size: A4 ${mode === 'ptk_rtl' ? 'landscape' : 'portrait'}; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45; margin: 24px; }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .header img { width: 64px; height: 64px; object-fit: contain; }
  .title { font-size: 14px; font-weight: 700; margin: 4px 0; }
  .sub { font-size: 11px; color: #334155; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 12px; margin-bottom: 16px; }
  .box { border: 1px solid #cbd5e1; padding: 10px 12px; background: #f8fafc; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th, td { border: 1px solid #94a3b8; padding: 6px 8px; vertical-align: top; }
  th { background: #0f172a; color: #ffffff; font-size: 10px; text-align: left; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; page-break-inside: avoid; }
  .print-btn { background: #0f172a; color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 16px; }
  @media print { .no-print { display: none; } body { margin: 0; } }
</style>
</head>
<body>
  <button class="no-print print-btn" onclick="window.print()">${lang === 'EN' ? 'Print / Save as PDF' : 'Cetak / Simpan sebagai PDF'}</button>
  <div class="header">
    <img src="${logoUrl}" alt="Logo UNPATTI" />
    <div>
      <div class="sub">${lang === 'EN' ? 'MINISTRY OF HIGHER EDUCATION, SCIENCE, AND TECHNOLOGY · PATTIMURA UNIVERSITY' : 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI · UNIVERSITAS PATTIMURA'}</div>
      <div class="title">${escapeHtml(titleByMode[mode])}</div>
      <div class="sub">${lang === 'EN' ? 'Quality Assurance and Learning Development Agency (LPMPP) · Poka Campus, Ambon 97233' : 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP) · Kampus Poka, Ambon 97233'}</div>
    </div>
  </div>
  <div class="meta">
    <div><strong>${lang === 'EN' ? 'Study Program' : 'Program Studi'}:</strong> ${escapeHtml(program.kode_ps)} — ${escapeHtml(translateProgramName(program.nama_prodi, lang))}</div>
    <div><strong>${lang === 'EN' ? 'PPEPP Cycle' : 'Siklus PPEPP'}:</strong> ${escapeHtml(cycle.tahun_siklus)}</div>
    <div><strong>${lang === 'EN' ? 'Faculty' : 'Fakultas'}:</strong> ${escapeHtml(translateFaculty(program.fakultas, lang))}</div>
    <div><strong>${lang === 'EN' ? 'Accreditation' : 'Akreditasi'}:</strong> ${escapeHtml(program.peringkat_akreditasi)}</div>
    <div><strong>${lang === 'EN' ? 'Weighted AMI Score' : 'Skor Terbobot AMI'}:</strong> ${overall.rataRataCapaianTerbobot.toFixed(2)} (${escapeHtml(translateSebutan(overall.sebutanOverall, lang))})</div>
    <div><strong>${lang === 'EN' ? 'Total Findings (CAR/Obs)' : 'Total Temuan KTS/OB'}:</strong> ${translateKategori('Mayor', lang)}: ${overall.totalCounts.Mayor} | ${translateKategori('Minor', lang)}: ${overall.totalCounts.Minor} | ${translateKategori('Observasi', lang)}: ${overall.totalCounts.Observasi}</div>
  </div>
  ${ppeppSectionHtml}
  ${
    mode === 'ptk_rtl'
      ? `<table>
          <thead>
            <tr><th>No</th><th>${lang === 'EN' ? 'Item & Category' : 'Butir & Kategori'}</th><th>${lang === 'EN' ? 'Root Cause / Driver' : 'Akar Masalah/Penunjang'}</th><th>${lang === 'EN' ? 'CAR / RTL' : 'PTK / RTL'}</th><th>PIC</th><th>${lang === 'EN' ? 'Due Date' : 'Batas Waktu'}</th><th>${lang === 'EN' ? 'Status' : 'Status'}</th></tr>
          </thead>
          <tbody>${ptkRowsHtml}</tbody>
        </table>`
      : `<table>
          <thead>
            <tr><th>No</th><th>${lang === 'EN' ? 'SPMI Standard' : 'Standar SPMI'}</th><th>${lang === 'EN' ? 'Score' : 'Nilai Capaian'}</th><th>${lang === 'EN' ? 'Predicate' : 'Sebutan'}</th><th>${lang === 'EN' ? 'Target' : 'Target'}</th><th>${lang === 'EN' ? 'Category' : 'Kategori'}</th><th>${lang === 'EN' ? 'M/Mn/Ob' : 'M/Mn/Ob'}</th></tr>
          </thead>
          <tbody>
            ${recapRowsHtml}
            <tr style="font-weight:bold;background:#f1f5f9;">
              <td colspan="2">${lang === 'EN' ? 'WEIGHTED AVERAGE / TOTAL FINDINGS' : 'RATA-RATA TERBOBOT / TOTAL TEMUAN'}</td>
              <td style="text-align:right;font-family:monospace;">${overall.rataRataCapaianTerbobot.toFixed(2)}</td>
              <td>${escapeHtml(translateSebutan(overall.sebutanOverall, lang))}</td>
              <td style="text-align:right;font-family:monospace;">${overall.rataRataTargetTerbobot.toFixed(2)}</td>
              <td>-</td>
              <td style="text-align:center;font-family:monospace;">${overall.totalCounts.Mayor}/${overall.totalCounts.Minor}/${overall.totalCounts.Observasi}</td>
            </tr>
          </tbody>
        </table>`
  }
  <div class="signs">
    <div>
      <div>${lang === 'EN' ? 'Acknowledged by,' : 'Mengetahui,'}</div>
      <div><strong>${lang === 'EN' ? `Dean of ${escapeHtml(translateFaculty(program.fakultas, lang))}` : `Dekan ${escapeHtml(program.fakultas)}`}</strong></div>
      <div style="height:56px;"></div>
      <div style="text-decoration:underline;font-weight:bold;">${escapeHtml(program.dekan_nama)}</div>
      <div style="font-family:monospace;font-size:10px;">NIP. ${escapeHtml(program.dekan_nip)}</div>
    </div>
    <div style="text-align:right;">
      <div>${escapeHtml(program.tempat_pengesahan || 'Ambon')}, ${escapeHtml(program.tahun_pengesahan || '2025')}</div>
      <div><strong>${lang === 'EN' ? `Head of Study Program ${escapeHtml(translateProgramName(program.nama_prodi, lang))}` : `Ketua Program Studi ${escapeHtml(program.nama_prodi)}`}</strong></div>
      <div style="height:56px;"></div>
      <div style="text-decoration:underline;font-weight:bold;">${escapeHtml(program.kaprodi_nama)}</div>
      <div style="font-family:monospace;font-size:10px;">NIP. ${escapeHtml(program.kaprodi_nip)}</div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleSavePdf = async () => {
    setBusyPdf(true);
    setFeedback(null);
    try {
      const fileName = await exportAmiPdf({
        mode,
        program,
        cycle,
        recaps,
        overall,
        indicators,
        evaluations,
        ppeppStats,
      });
      setFeedback({
        ok: true,
        text:
          lang === 'EN'
            ? `Official PDF document "${fileName}" was successfully generated and downloaded.`
            : `File PDF resmi "${fileName}" berhasil dibuat dan diunduh.`,
      });
    } catch {
      setFeedback({
        ok: false,
        text:
          lang === 'EN'
            ? 'Failed to generate PDF. Please use the Download Document (.html) button.'
            : 'Gagal membuat PDF. Silakan gunakan tombol Unduh Dokumen (.html).',
      });
    } finally {
      setBusyPdf(false);
    }
  };

  const handleBrowserPrint = () => {
    setFeedback(null);
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const docHtml = buildPrintableHtmlDoc();
      const docRef = iframe.contentWindow?.document;
      if (docRef) {
        docRef.open();
        docRef.write(docHtml);
        docRef.close();
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            window.print();
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 300);
        setFeedback({
          ok: true,
          text:
            lang === 'EN'
              ? 'Browser print dialog invoked. If it does not appear in iframe preview, click "Save PDF (.pdf)".'
              : 'Dialog cetak browser telah dipanggil. Jika dialog tidak muncul di pratinjau tersemat (iframe), gunakan tombol "Simpan PDF (.pdf)" di sebelahnya.',
        });
        return;
      }
      window.print();
    } catch {
      window.print();
    }
  };

  const handleDownloadPrintableHtml = () => {
    const htmlDoc = buildPrintableHtmlDoc();
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cetak_${mode}_${program.kode_ps}_${cycle.tahun_siklus.replace(
      '/',
      '-'
    )}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      ok: true,
      text:
        lang === 'EN'
          ? 'Print-ready document (.html) successfully downloaded.'
          : 'Dokumen siap cetak (.html) berhasil diunduh.',
    });
  };

  return (
    <div
      className="print-modal-root fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="print-modal-card flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Toolbar (Hidden when printing) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <img
              src="/unpatti-logo.png"
              alt="Logo UNPATTI"
              className="h-8 w-8 shrink-0 object-contain"
            />
            <div>
              <h3 className="text-sm font-semibold">
                {lang === 'EN'
                  ? 'Official Document Preview PPEPP UNPATTI'
                  : 'Pratinjau Dokumen Resmi PPEPP UNPATTI'}
              </h3>
              <p className="text-xs text-slate-300">
                {program.kode_ps} — {translateProgramName(program.nama_prodi, lang)} · {lang === 'EN' ? 'Cycle' : 'Siklus'}{' '}
                {cycle.tahun_siklus}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPrintableHtml}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              {lang === 'EN' ? 'Download HTML' : 'Unduh HTML'}
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <Printer className="h-3.5 w-3.5 text-slate-200" />
              {lang === 'EN' ? 'Print' : 'Cetak Printer'}
            </button>
            <button
              type="button"
              disabled={busyPdf}
              onClick={handleSavePdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <FileDown className="h-3.5 w-3.5" />
              {busyPdf
                ? (lang === 'EN' ? 'Generating PDF...' : 'Membuat PDF...')
                : (lang === 'EN' ? 'Save PDF (.pdf)' : 'Simpan PDF (.pdf)')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label={lang === 'EN' ? 'Close print preview' : 'Tutup pratinjau cetak'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`no-print flex items-center gap-2 border-b px-6 py-2.5 text-xs ${
              feedback.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Scrollable A4 Printable Sheet Preview */}
        <div className="print-modal-scroll flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-slate-300 bg-white p-8 shadow-sm text-slate-900">
            {/* Official UNPATTI Kop Surat */}
            <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-4 mb-5">
              <img
                src="/unpatti-logo.png"
                alt="Lambang Universitas Pattimura"
                className="h-16 w-16 shrink-0 object-contain"
              />
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
                  {lang === 'EN'
                    ? 'Ministry of Higher Education, Science, and Technology · Pattimura University'
                    : 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi · Universitas Pattimura'}
                </div>
                <h1 className="text-lg font-bold text-slate-950 leading-tight mt-0.5">
                  {titleByMode[mode]}
                </h1>
                <div className="text-xs text-slate-600 mt-0.5">
                  {lang === 'EN'
                    ? 'Quality Assurance and Learning Development Agency (LPMPP) · Jl. Ir. M. Putuhena, Ambon 97233'
                    : 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP) · Jl. Ir. M. Putuhena, Ambon 97233'}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs mb-5">
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'Study Program:' : 'Program Studi:'}</span>{' '}
                <strong className="text-slate-900">
                  {program.kode_ps} — {translateProgramName(program.nama_prodi, lang)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'PPEPP Cycle:' : 'Siklus PPEPP:'}</span>{' '}
                <strong className="font-mono text-slate-900">
                  {cycle.tahun_siklus}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'Faculty:' : 'Fakultas:'}</span>{' '}
                <strong className="text-slate-900">{translateFaculty(program.fakultas, lang)}</strong>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'Accreditation:' : 'Akreditasi:'}</span>{' '}
                <strong className="text-slate-900">
                  {program.peringkat_akreditasi}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'Weighted AMI Score:' : 'Skor Terbobot AMI:'}</span>{' '}
                <strong className="font-mono text-blue-900">
                  {overall.rataRataCapaianTerbobot.toFixed(2)} (
                  {translateSebutan(overall.sebutanOverall, lang)})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">{lang === 'EN' ? 'Findings (CAR/Obs):' : 'Temuan KTS/OB:'}</span>{' '}
                <strong className="font-mono text-slate-900">
                  {translateKategori('Mayor', lang)} {overall.totalCounts.Mayor} · {translateKategori('Minor', lang)}{' '}
                  {overall.totalCounts.Minor} · {translateKategori('Observasi', lang)}{' '}
                  {overall.totalCounts.Observasi}
                </strong>
              </div>
            </div>

            {/* PPEPP Stage Breakdown if mode === ppepp_summary */}
            {mode === 'ppepp_summary' && ppeppStats && (
              <div className="mb-5 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    {lang === 'EN'
                      ? '5-Stage PPEPP Cycle Effectiveness Breakdown'
                      : 'Rekapitulasi Efektifitas 5 Tahap Siklus PPEPP'}
                  </h2>
                  <span className="font-mono text-sm font-bold text-blue-900">
                    {lang === 'EN' ? 'Composite Index' : 'Indeks Komposit'}: {ppeppStats.indeks}% ({ppeppStats.label})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { k: lang === 'EN' ? 'P1 · Setting' : 'P1 · Penetapan', v: ppeppStats.penetapan },
                    { k: lang === 'EN' ? 'P2 · Implementation' : 'P2 · Pelaksanaan', v: ppeppStats.pelaksanaan },
                    { k: lang === 'EN' ? 'E · Evaluation' : 'E · Evaluasi', v: ppeppStats.evaluasi },
                    { k: lang === 'EN' ? 'P3 · Control' : 'P3 · Pengendalian', v: ppeppStats.pengendalian },
                    { k: lang === 'EN' ? 'P4 · Improvement' : 'P4 · Peningkatan', v: ppeppStats.peningkatan },
                  ].map((item) => (
                    <div
                      key={item.k}
                      className="rounded border border-slate-200 bg-slate-50 py-2 px-1"
                    >
                      <div className="text-[11px] text-slate-600">{item.k}</div>
                      <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
                        {item.v}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Table Content */}
            {mode === 'ptk_rtl' ? (
              <table className="w-full border-collapse text-left text-xs mb-6">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-400 px-2.5 py-2 text-center w-10">
                      No
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'Item & Category' : 'Butir & Kategori'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'Root Cause / Driver' : 'Akar Masalah/Penunjang'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'CAR / RTL' : 'PTK / RTL'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'PIC & Due Date' : 'PIC & Batas Waktu'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'Monev Status' : 'Status Monev'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ptkRows.map((row, idx) => (
                    <tr key={row.indicator.id} className="align-top">
                      <td className="border border-slate-300 px-2.5 py-2 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <strong className="font-mono">
                            {row.indicator.code}
                          </strong>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getKategoriBadgeClasses(
                              row.kategori
                            )}`}
                          >
                            {row.kategori ? translateKategori(row.kategori, lang) : '-'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700">
                          {row.indicator.uraian}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-[11px]">
                        {row.evaluation.akar_masalah || '-'}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-[11px]">
                        {row.evaluation.ptk_rtl || '-'}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-[11px]">
                        <div>{row.evaluation.pic || '-'}</div>
                        <div className="font-mono text-slate-500 mt-0.5">
                          {row.evaluation.waktu_ptk || '-'}
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-[11px] font-semibold">
                        {translateMonevStatus(row.evaluation.monev_status, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse text-left text-xs mb-6">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-400 px-2.5 py-2 text-center w-10">
                      No
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'SPMI Standard' : 'Standar SPMI'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2 text-right">
                      {lang === 'EN' ? 'Score' : 'Capaian'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'Predicate' : 'Sebutan Capaian'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2 text-right">
                      {lang === 'EN' ? 'Target' : 'Target'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2">
                      {lang === 'EN' ? 'Category' : 'Kategori'}
                    </th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center">
                      M / Mn / Ob
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recaps.map((r) => (
                    <tr key={r.standardId}>
                      <td className="border border-slate-300 px-2.5 py-2 text-center font-mono">
                        {r.standardId}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 font-medium">
                        {translateStandardName(r.nama, lang)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-right font-mono font-bold">
                        {r.nilaiCapaian.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-[11px]">
                        {translateSebutan(r.sebutanCapaian, lang)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">
                        {r.nilaiTarget.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${getKategoriBadgeClasses(
                            r.kategoriTemuan
                          )}`}
                        >
                          {r.kategoriTemuan ? translateKategori(r.kategoriTemuan, lang) : '-'}
                        </span>
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 text-center font-mono">
                        {r.counts.Mayor} / {r.counts.Minor} /{' '}
                        {r.counts.Observasi}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td
                      colSpan={2}
                      className="border border-slate-300 px-2.5 py-2"
                    >
                      {lang === 'EN' ? 'WEIGHTED AVERAGE / TOTAL FINDINGS' : 'RATA-RATA TERBOBOT / TOTAL TEMUAN'}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">
                      {overall.rataRataCapaianTerbobot.toFixed(2)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2">
                      {translateSebutan(overall.sebutanOverall, lang)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">
                      {overall.rataRataTargetTerbobot.toFixed(2)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2">-</td>
                    <td className="border border-slate-300 px-2.5 py-2 text-center font-mono">
                      {overall.totalCounts.Mayor} / {overall.totalCounts.Minor}{' '}
                      / {overall.totalCounts.Observasi}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Official Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 text-xs">
              <div>
                <p>{lang === 'EN' ? 'Acknowledged by,' : 'Mengetahui,'}</p>
                <p className="font-semibold">
                  {lang === 'EN' ? `Dean of ${translateFaculty(program.fakultas, lang)}` : `Dekan ${program.fakultas}`}
                </p>
                <div className="h-14" />
                <p className="font-semibold underline underline-offset-4">
                  {program.dekan_nama ||
                    '........................................'}
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-600">
                  NIP. {program.dekan_nip || '........................'}
                </p>
              </div>
              <div className="text-right">
                <p>
                  {program.tempat_pengesahan || 'Ambon'},{' '}
                  {program.tahun_pengesahan || '2025'}
                </p>
                <p className="font-semibold">
                  {lang === 'EN'
                    ? `Head of Study Program ${translateProgramName(program.nama_prodi, lang)}`
                    : `Ketua Program Studi ${program.nama_prodi}`}
                </p>
                <div className="h-14" />
                <p className="font-semibold underline underline-offset-4">
                  {program.kaprodi_nama ||
                    '........................................'}
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-600">
                  NIP. {program.kaprodi_nip || '........................'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
