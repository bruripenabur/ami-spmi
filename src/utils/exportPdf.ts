import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  OverallAmiRecap,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';
import { createDefaultEvaluation, getKategoriTemuan } from './amiCalculations';

export type PdfExportMode = 'ppepp_summary' | 'laporan_ami' | 'ptk_rtl';

export interface ExportPdfParams {
  mode: PdfExportMode;
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
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/unpatti-logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportAmiPdf({
  mode,
  program,
  cycle,
  recaps,
  overall,
  indicators,
  evaluations,
  ppeppStats,
}: ExportPdfParams): Promise<string> {
  const isLandscape = mode === 'ptk_rtl';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const titleByMode: Record<PdfExportMode, string> = {
    ppepp_summary: 'RINGKASAN EVALUASI & EFEKTIFITAS SIKLUS PPEPP',
    laporan_ami: 'LAPORAN EKSEKUTIF AUDIT MUTU INTERNAL (AMI) SPMI',
    ptk_rtl: 'FORMULIR PERMINTAAN TINDAKAN KOREKSI (PTK) & RTL',
  };

  // Header / Kop Surat
  const logoData = await loadLogoDataUrl();
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 11, 18, 18);
  }

  const textStartX = logoData ? margin + 22 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI · UNIVERSITAS PATTIMURA',
    textStartX,
    14.5
  );

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(titleByMode[mode], textStartX, 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP) · Kampus Poka, Ambon 97233',
    textStartX,
    25.5
  );

  // Double border Kop line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(margin, 31, pageWidth - margin, 31);
  doc.setLineWidth(0.25);
  doc.line(margin, 32.2, pageWidth - margin, 32.2);

  // Metadata Box
  let cursorY = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 21, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const col2X = margin + contentWidth * 0.52;

  doc.setFont('helvetica', 'bold');
  doc.text('Program Studi:', margin + 3, cursorY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${program.kode_ps} — ${program.nama_prodi}`,
    margin + 28,
    cursorY + 5.5,
    { maxWidth: contentWidth * 0.48 - 26 }
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Fakultas:', margin + 3, cursorY + 11.2);
  doc.setFont('helvetica', 'normal');
  doc.text(program.fakultas, margin + 28, cursorY + 11.2, {
    maxWidth: contentWidth * 0.48 - 26,
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Skor Terbobot:', margin + 3, cursorY + 16.9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall})`,
    margin + 28,
    cursorY + 16.9
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Siklus PPEPP:', col2X, cursorY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(cycle.tahun_siklus, col2X + 26, cursorY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Akreditasi:', col2X, cursorY + 11.2);
  doc.setFont('helvetica', 'normal');
  doc.text(program.peringkat_akreditasi, col2X + 26, cursorY + 11.2);

  doc.setFont('helvetica', 'bold');
  doc.text('Temuan KTS/OB:', col2X, cursorY + 16.9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Mayor ${overall.totalCounts.Mayor} | Minor ${overall.totalCounts.Minor} | Obs ${overall.totalCounts.Observasi}`,
    col2X + 26,
    cursorY + 16.9
  );

  cursorY += 25;

  // PPEPP Summary table if ppepp_summary mode
  if (mode === 'ppepp_summary' && ppeppStats) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Rekapitulasi Efektifitas Siklus PPEPP — Indeks Komposit: ${ppeppStats.indeks}% (${ppeppStats.label})`,
      margin,
      cursorY + 3
    );
    cursorY += 5.5;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          'P1 · Penetapan',
          'P2 · Pelaksanaan',
          'E · Evaluasi',
          'P3 · Pengendalian',
          'P4 · Peningkatan',
        ],
      ],
      body: [
        [
          `${ppeppStats.penetapan}%`,
          `${ppeppStats.pelaksanaan}%`,
          `${ppeppStats.evaluasi}%`,
          `${ppeppStats.pengendalian}%`,
          `${ppeppStats.peningkatan}%`,
        ],
      ],
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        textColor: [15, 23, 42],
      },
    });

    const lastAuto = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable;
    cursorY = (lastAuto?.finalY ?? cursorY + 18) + 6;
  }

  // Main Table
  if (mode === 'ptk_rtl') {
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

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          'No',
          'Butir & Kategori',
          'Akar Masalah/Penunjang',
          'PTK / RTL',
          'PIC',
          'Waktu PTK',
          'Status Monev',
        ],
      ],
      body: ptkRows.map((row, idx) => [
        String(idx + 1),
        `${row.indicator.code} (${row.kategori})\n${row.indicator.uraian}`,
        row.evaluation.akar_masalah || '-',
        row.evaluation.ptk_rtl || '-',
        row.evaluation.pic || '-',
        row.evaluation.waktu_ptk || '-',
        row.evaluation.monev_status,
      ]),
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 58 },
        2: { cellWidth: 62 },
        3: { cellWidth: 62 },
        4: { cellWidth: 32 },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 23, halign: 'center' },
      },
    });
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [
        [
          'No',
          'Standar SPMI',
          'Capaian',
          'Sebutan Capaian',
          'Target',
          'Kategori',
          'M / Mn / Ob',
        ],
      ],
      body: [
        ...recaps.map((r) => [
          String(r.standardId),
          r.nama,
          r.nilaiCapaian.toFixed(2),
          r.sebutanCapaian,
          r.nilaiTarget.toFixed(2),
          r.kategoriTemuan ?? '-',
          `${r.counts.Mayor} / ${r.counts.Minor} / ${r.counts.Observasi}`,
        ]),
        [
          '-',
          'RATA-RATA TERBOBOT / TOTAL TEMUAN',
          overall.rataRataCapaianTerbobot.toFixed(2),
          overall.sebutanOverall,
          overall.rataRataTargetTerbobot.toFixed(2),
          '-',
          `${overall.totalCounts.Mayor} / ${overall.totalCounts.Minor} / ${overall.totalCounts.Observasi}`,
        ],
      ],
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 34 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 26 },
        6: { cellWidth: 21, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === recaps.length && data.section === 'body') {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  // Official Sign-off block
  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  let signY = (lastTable?.finalY ?? cursorY + 40) + 10;
  if (signY + 34 > pageHeight - 12) {
    doc.addPage();
    signY = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', margin, signY);
  doc.text(
    `${program.tempat_pengesahan || 'Ambon'}, ${program.tahun_pengesahan || '2025'}`,
    pageWidth - margin,
    signY,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.text(`Dekan ${program.fakultas}`, margin, signY + 5);
  doc.text(
    `Ketua Program Studi ${program.nama_prodi}`,
    pageWidth - margin,
    signY + 5,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.text(
    program.dekan_nama || '........................................',
    margin,
    signY + 24
  );
  doc.text(
    program.kaprodi_nama || '........................................',
    pageWidth - margin,
    signY + 24,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NIP. ${program.dekan_nip || '........................'}`,
    margin,
    signY + 28.5
  );
  doc.text(
    `NIP. ${program.kaprodi_nip || '........................'}`,
    pageWidth - margin,
    signY + 28.5,
    { align: 'right' }
  );

  // Page footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `PPEPP UNPATTI · Siklus ${cycle.tahun_siklus} · Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  const prefix =
    mode === 'ppepp_summary'
      ? 'Ringkasan_PPEPP'
      : mode === 'laporan_ami'
      ? 'Laporan_AMI'
      : 'Formulir_PTK_RTL';
  const safeFile = `${prefix}_${program.kode_ps}_${cycle.tahun_siklus.replace(
    '/',
    '-'
  )}.pdf`;

  doc.save(safeFile);
  return safeFile;
}
