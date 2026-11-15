import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AmiCycle,
  AmiEvaluation,
  AmiIndicator,
  AmiStandard,
  OverallAmiRecap,
  SpmiReportMeta,
  SpmiReportType,
  StandardRecap,
  StudyProgramIdentity,
} from '../types/ami';
import {
  buildPlorCaNarrative,
  createDefaultEvaluation,
  getKategoriTemuan,
} from './amiCalculations';
import { PpeppStatsData } from './spmiReportDefaults';
import {
  computeSpmiStatistics,
  SpmiStatisticalSummary,
} from './spmiStatistics';
import {
  RenderedChartImage,
  renderChartsForReport,
  renderUnitComparisonChart,
} from './spmiChartRenderer';
import { AggregatedSpmiBundle, shortenFacultyName } from './spmiAggregateReport';

export interface SpmiReportPayload {
  reportType: SpmiReportType;
  program: StudyProgramIdentity;
  cycle: AmiCycle;
  cycles?: AmiCycle[];
  standards: AmiStandard[];
  indicators: AmiIndicator[];
  evaluations: Record<string, AmiEvaluation>;
  evaluationsByContext?: Record<string, Record<string, AmiEvaluation>>;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  ppeppStats: PpeppStatsData;
  meta: SpmiReportMeta;
  scopeBundle?: AggregatedSpmiBundle;
}

const REPORT_TITLES: Record<SpmiReportType, string> = {
  ami: 'LAPORAN AUDIT MUTU INTERNAL (AMI)',
  rtm: 'LAPORAN RAPAT TINJAUAN MANAJEMEN (RTM) SPMI',
  efektivitas_ppepp:
    'LAPORAN EVALUASI DAN ANALISIS EFEKTIVITAS IMPLEMENTASI SIKLUS PPEPP',
  perbaikan_peningkatan:
    'LAPORAN PERBAIKAN DAN PENINGKATAN STANDAR SPMI (PENGENDALIAN & PENINGKATAN)',
};

const REPORT_FILE_PREFIX: Record<SpmiReportType, string> = {
  ami: 'Laporan_AMI',
  rtm: 'Laporan_RTM',
  efektivitas_ppepp: 'Laporan_Efektivitas_PPEPP',
  perbaikan_peningkatan: 'Laporan_Perbaikan_Peningkatan_Standar',
};

async function fetchLogoBytes(): Promise<Uint8Array | null> {
  try {
    const res = await fetch('/unpatti-logo.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fetchLogoDataUrl(): Promise<string | null> {
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractFindings(payload: SpmiReportPayload) {
  return payload.indicators.map((ind) => {
    const ev = payload.evaluations[ind.id] ?? createDefaultEvaluation(ind.id);
    const std = payload.standards.find((s) => s.id === ind.standard_id);
    const kategori = getKategoriTemuan(
      ev.nilai_capaian,
      ev.target_1_yr,
      ev.kategori_override
    );
    const plor = buildPlorCaNarrative(ev.plor_ca);
    return { indicator: ind, evaluation: ev, standard: std, kategori, plor };
  });
}

function buildStatisticalRowsForReport(
  reportType: SpmiReportType,
  stats: SpmiStatisticalSummary,
  overall: OverallAmiRecap
): string[][] {
  const baseDescriptive: string[][] = [
    [
      'Mean (Rata-rata Capaian 10 Standar)',
      `${stats.meanCapaian.toFixed(2)} / 100 (Terbobot: ${overall.rataRataCapaianTerbobot.toFixed(2)})`,
      `Rata-rata capaian berada pada kategori "${overall.sebutanOverall}".`,
    ],
    [
      'Median (Me) & Rentang Interkuartil (IQR)',
      `Me = ${stats.medianCapaian.toFixed(2)} | Q1 = ${stats.q1Capaian.toFixed(2)}, Q3 = ${stats.q3Capaian.toFixed(2)} (IQR = ${stats.iqrCapaian.toFixed(2)})`,
      'Menggambarkan sebaran tengah 50% kinerja standar tanpa bias nilai ekstrem.',
    ],
    [
      'Simpangan Baku (SD) & Koefisien Variasi (CV)',
      `SD = ${stats.sdCapaian.toFixed(2)} | CV = ${stats.cvCapaianPct.toFixed(2)}%`,
      stats.cvCapaianPct <= 10
        ? 'Variabilitas rendah (CV <= 10%): pemenuhan mutu merata antar standar.'
        : 'Variabilitas moderat/tinggi (CV > 10%): terdapat kesenjangan antar standar.',
    ],
    [
      'Nilai Ekstrem (Minimum & Maksimum)',
      `Min: ${stats.minCapaian.toFixed(2)} (${stats.minStandardName}) | Max: ${stats.maxCapaian.toFixed(2)} (${stats.maxStandardName})`,
      `Rentang (Range) antar standar sebesar ${stats.rangeCapaian.toFixed(2)} poin.`,
    ],
    [
      'Uji Beda Berpasangan (Paired t-Test Capaian vs Target)',
      `Mean Gap = -${stats.meanGap.toFixed(2)} | t(${stats.pairedDf}) = ${stats.pairedTStat.toFixed(3)} · ${stats.pairedPLabel}`,
      stats.pairedSignificant
        ? 'Terdapat perbedaan signifikan secara statistik antara capaian saat ini dan target 1 tahun yad.'
        : 'Selisih capaian terhadap target tergolong dekat dan belum signifikan secara statistik.',
    ],
    [
      'Korelasi Pearson (Jumlah KTS vs Skor Standar)',
      stats.pearsonInterpretation,
      stats.pearsonR_KtsVsCapaian < -0.3
        ? 'Korelasi negatif mengonfirmasi tingginya jumlah KTS menurunkan indeks standar secara langsung.'
        : 'Menunjukkan pola keterkaitan antara kepadatan temuan KTS dan capaian standar.',
    ],
  ];

  if (reportType === 'rtm') {
    return [
      ...baseDescriptive.slice(0, 3),
      [
        'Gap Terbesar & Standar Prioritas RTM',
        `Max Gap = ${stats.maxGap.toFixed(2)} poin (${stats.maxGapStandardName})`,
        'Menjadi fokus utama keputusan alokasi anggaran & intervensi pimpinan pada RTM.',
      ],
      [
        'Rasio Kepatuhan vs Non-Conformity Rate',
        `Kepatuhan: ${stats.complianceRatePct}% (${stats.compliantCount}/${stats.nIndicators}) | KTS: ${stats.nonConformityRatePct}%`,
        `Kelengkapan rencana PTK/RTL & PIC mencapai ${stats.ptkPlanCompletenessPct}%.`,
      ],
      baseDescriptive[4],
    ];
  }

  if (reportType === 'efektivitas_ppepp') {
    return [
      [
        'Mean & Variabilitas 5 Tahap Siklus PPEPP',
        `Mean = ${stats.ppeppMean}% | SD = ${stats.ppeppSd} | CV = ${stats.ppeppCvPct}%`,
        stats.ppeppCvPct <= 12
          ? 'Keseimbangan implementasi P-P-E-P-P terjaga secara konsisten.'
          : 'Terdapat ketimpangan performa antar tahap dalam siklus PPEPP.',
      ],
      [
        'Tahap Terkuat vs Titik Kendala (Bottleneck)',
        `Terkuat: ${stats.strongestStage.label} (${stats.strongestStage.score}%) | Terendah: ${stats.bottleneckStage.label} (${stats.bottleneckStage.score}%)`,
        `Tahap ${stats.bottleneckStage.label} memerlukan penguatan tata kelola segera.`,
      ],
      ...baseDescriptive.slice(0, 2),
      baseDescriptive[4],
      baseDescriptive[5],
    ];
  }

  if (reportType === 'perbaikan_peningkatan') {
    return [
      [
        'PTK Closure Rate (Verifikasi Closed)',
        `${stats.ptkClosureRatePct}% (${stats.ptkClosedCount} dari ${stats.nonCompliantCount} KTS/OB berstatus Closed)`,
        `Sebanyak ${stats.ptkInProgressCount} butir In Progress dan ${stats.ptkOpenCount} butir masih Open.`,
      ],
      [
        'Indeks Reduksi Risiko Ketidaksesuaian',
        `${stats.riskReductionIndexPct}%`,
        'Mengukur efektivitas pengendalian risiko pasca-AMI menuju penutupan total PTK.',
      ],
      [
        'Rasio Pelampauan Standar (Best Practice)',
        `${stats.bestPracticeRatioPct}% (${overall.totalCounts['Best Practice']} dari ${stats.nIndicators} indikator)`,
        'Menjadi dasar empiris pengusulan peningkatan standar berkelanjutan (CQI).',
      ],
      ...baseDescriptive.slice(0, 3),
    ];
  }

  return baseDescriptive;
}

/* ============================================================================
 * WORD (.DOCX) EXPORT ENGINE (Logo 2 cm x 2 cm in Kop Surat = 76px @ 96 DPI)
 * ============================================================================ */

function docxKopSurat(logoBytes: Uint8Array | null): Table {
  const logoParagraph = logoBytes
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: logoBytes,
            transformation: { width: 76, height: 76 },
          }),
        ],
      })
    : new Paragraph({ text: '' });

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
  const doubleBottom = {
    bottom: { style: BorderStyle.DOUBLE, size: 12, color: '0F172A' },
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            borders: { ...noBorder, ...doubleBottom },
            margins: { top: 40, bottom: 100, left: 40, right: 80 },
            children: [logoParagraph],
          }),
          new TableCell({
            width: { size: 84, type: WidthType.PERCENTAGE },
            borders: { ...noBorder, ...doubleBottom },
            margins: { top: 40, bottom: 100, left: 60, right: 40 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
                    size: 19,
                    bold: true,
                    color: '1E293B',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'UNIVERSITAS PATTIMURA',
                    size: 26,
                    bold: true,
                    color: '0F172A',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'LEMBAGA PENJAMINAN MUTU DAN PENGEMBANGAN PEMBELAJARAN (LPMPP)',
                    size: 20,
                    bold: true,
                    color: '1E3A8A',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Jl. Ir. M. Putuhena, Kampus Poka, Ambon 97233 · Laman: https://unpatti.ac.id',
                    size: 17,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function docxSectionTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E3A8A' },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24,
        color: '0F172A',
      }),
    ],
  });
}

function docxSubTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21,
        color: '1E3A8A',
      }),
    ],
  });
}

function docxBody(text: string, after = 100): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after },
    children: [
      new TextRun({
        text,
        size: 20,
        color: '1E293B',
      }),
    ],
  });
}

function docxBullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 50 },
    children: [
      new TextRun({
        text,
        size: 20,
        color: '1E293B',
      }),
    ],
  });
}

function docxChartBlock(chart: RenderedChartImage): Paragraph[] {
  const targetWidth = 590;
  const targetHeight = Math.round((chart.heightPx / chart.widthPx) * targetWidth);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data: chart.bytes,
          transformation: { width: targetWidth, height: targetHeight },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `${chart.title}. `,
          bold: true,
          size: 18,
          color: '0F172A',
        }),
        new TextRun({
          text: chart.caption,
          italics: true,
          size: 18,
          color: '475569',
        }),
      ],
    }),
  ];
}

function docxTable(headers: string[], rows: string[][]): Table {
  const borderSpec = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          borders: borderSpec,
          shading: { type: ShadingType.CLEAR, fill: '0F172A' },
          margins: { top: 80, bottom: 80, left: 90, right: 90 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 18,
                  color: 'FFFFFF',
                }),
              ],
            }),
          ],
        })
    ),
  });

  const bodyRows = rows.map(
    (cols, idx) =>
      new TableRow({
        children: cols.map(
          (val) =>
            new TableCell({
              borders: borderSpec,
              shading:
                idx % 2 === 1
                  ? { type: ShadingType.CLEAR, fill: 'F8FAFC' }
                  : undefined,
              margins: { top: 65, bottom: 65, left: 90, right: 90 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: val || '-',
                      size: 18,
                      color: '0F172A',
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

function docxSignBlock(
  leftRole: string,
  leftName: string,
  leftNip: string,
  rightLocationDate: string,
  rightRole: string,
  rightName: string,
  rightNip: string
): Table {
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            margins: { top: 120, bottom: 40, left: 40, right: 100 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Mengetahui,', size: 20 })] }),
              new Paragraph({
                spacing: { after: 700 },
                children: [new TextRun({ text: leftRole, bold: true, size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: leftName || '........................................',
                    bold: true,
                    underline: {},
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP. ${leftNip || '........................'}`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorder,
            margins: { top: 120, bottom: 40, left: 100, right: 40 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: rightLocationDate, size: 20 })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 700 },
                children: [new TextRun({ text: rightRole, bold: true, size: 20 })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: rightName || '........................................',
                    bold: true,
                    underline: {},
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `NIP. ${rightNip || '........................'}`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function exportSpmiReportToDocx(
  payload: SpmiReportPayload
): Promise<string> {
  const logoBytes = await fetchLogoBytes();
  const { reportType, program, cycle, meta, scopeBundle } = payload;
  const scopeLevel = scopeBundle?.scopeLevel ?? 'prodi';
  const recaps = scopeBundle?.recaps ?? payload.recaps;
  const overall = scopeBundle?.overall ?? payload.overall;
  const ppeppStats = scopeBundle?.ppeppStats ?? payload.ppeppStats;
  const stats =
    scopeBundle?.stats ??
    computeSpmiStatistics({
      program,
      standards: payload.standards,
      indicators: payload.indicators,
      evaluations: payload.evaluations,
      recaps,
      overall,
      ppeppStats,
      cycles: payload.cycles,
      evaluationsByContext: payload.evaluationsByContext,
    });
  const [chart1, chart2] = renderChartsForReport({
    reportType,
    recaps,
    overall,
    ppeppStats,
    stats,
  });
  const unitChart = scopeBundle ? renderUnitComparisonChart(scopeBundle) : null;
  const statRows = buildStatisticalRowsForReport(reportType, stats, overall);

  const allItems = extractFindings(payload);
  const nonCompliant = allItems.filter(
    (x) =>
      x.kategori === 'Mayor' ||
      x.kategori === 'Minor' ||
      x.kategori === 'Observasi'
  );
  const bestPractices = allItems.filter((x) => x.kategori === 'Best Practice');
  const allFindings = allItems.filter(
    (x) => x.kategori !== null && x.kategori !== 'Sesuai (Baik)'
  );

  const scopeHeading =
    scopeBundle?.scopeHeading ??
    `PROGRAM STUDI ${program.nama_prodi.toUpperCase()} (${program.kode_ps})`;
  const scopeSubheading =
    scopeBundle?.scopeSubheading ??
    `${program.fakultas} · Siklus PPEPP ${cycle.tahun_siklus}`;
  const scopeUnitText =
    scopeLevel === 'universitas'
      ? `Universitas Pattimura (${scopeBundle?.facultyCount ?? 12} Fakultas/Pascasarjana/PSDKU, ${scopeBundle?.programCount ?? 118} Prodi)`
      : scopeLevel === 'fakultas'
      ? `${scopeBundle?.targetFakultas ?? program.fakultas} (${scopeBundle?.programCount ?? 1} Prodi)`
      : `Program Studi ${program.nama_prodi}`;
  const scopeFileSlug =
    scopeLevel === 'universitas'
      ? 'UNIVERSITAS_UNPATTI'
      : scopeLevel === 'fakultas'
      ? shortenFacultyName(scopeBundle?.targetFakultas ?? program.fakultas).replace(/\s+/g, '_')
      : program.kode_ps;

  const children: (Paragraph | Table)[] = [];

  // Official Kop Surat (Logo 2 cm x 2 cm)
  children.push(docxKopSurat(logoBytes));
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }));

  // Cover / Header Block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${REPORT_TITLES[reportType]} — ${
            scopeBundle?.scopeBadgeLabel ?? 'TINGKAT PROGRAM STUDI'
          }`,
          bold: true,
          size: 26,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: scopeHeading,
          bold: true,
          size: 21,
          color: '1E3A8A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: `${scopeSubheading} · No. Dokumen: ${meta.nomorDokumen}`,
          size: 19,
          color: '475569',
        }),
      ],
    })
  );

  // Administrative Metadata Table
  const adminRows: string[][] =
    scopeLevel === 'prodi'
      ? [
          ['Perguruan Tinggi', `${program.kode_pt} — ${program.nama_pt}`],
          ['Fakultas / Pengelola', program.fakultas],
          ['Program Studi & Kode PS', `${program.kode_ps} — ${program.nama_prodi} (${program.jenis_prodi})`],
          ['Peringkat Akreditasi', `${program.peringkat_akreditasi} (Kedaluwarsa: ${program.tanggal_kedaluwarsa_akreditasi || '-'})`],
          ['Siklus PPEPP / Tahun', `${cycle.tahun_siklus} (${cycle.status})`],
          ['Ketua Program Studi', `${program.kaprodi_nama} (NIP. ${program.kaprodi_nip || '-'})`],
          ['Tim Auditor AMI', `Ketua: ${meta.ketuaAuditor}; Anggota: ${meta.anggotaAuditor1}, ${meta.anggotaAuditor2}`],
          ['Dasar Penugasan', meta.noSkAuditor],
        ]
      : scopeLevel === 'fakultas'
      ? [
          ['Perguruan Tinggi', `${program.kode_pt} — ${program.nama_pt}`],
          ['Cakupan Laporan', `Tingkat Fakultas / Pascasarjana / PSDKU — ${scopeBundle?.targetFakultas ?? program.fakultas}`],
          ['Jumlah Program Studi', `${scopeBundle?.programCount ?? 0} Program Studi dalam cakupan unit`],
          ['Siklus PPEPP / Tahun', `${cycle.tahun_siklus} (${cycle.status})`],
          ['Capaian & Indeks PPEPP', `Rata-rata Terbobot ${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall}) · Indeks PPEPP ${ppeppStats.indeks}%`],
          ['Sebaran Klaster Prodi', `Unggul: ${scopeBundle?.crossUnitStats.clusterCounts.Unggul ?? 0} | Stabil: ${scopeBundle?.crossUnitStats.clusterCounts.Stabil ?? 0} | Menurun: ${scopeBundle?.crossUnitStats.clusterCounts.Menurun ?? 0} | Pembinaan: ${scopeBundle?.crossUnitStats.clusterCounts.Pembinaan ?? 0}`],
          ['Tim Auditor / GJM', `Ketua: ${meta.ketuaAuditor}; Kepala LPMPP: ${meta.kepalaLpmppNama}`],
          ['Dasar Penugasan', meta.noSkAuditor],
        ]
      : [
          ['Perguruan Tinggi', `${program.kode_pt} — ${program.nama_pt}`],
          ['Cakupan Laporan', 'Tingkat Universitas (Agregasi Seluruh Fakultas / Pascasarjana / PSDKU)'],
          ['Total Unit & Prodi', `${scopeBundle?.facultyCount ?? 12} Fakultas/Pascasarjana/PSDKU · ${scopeBundle?.programCount ?? 118} Program Studi`],
          ['Siklus PPEPP / Tahun', `${cycle.tahun_siklus} (${cycle.status})`],
          ['Capaian & Indeks PPEPP', `Rata-rata Terbobot ${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall}) · Indeks PPEPP ${ppeppStats.indeks}%`],
          ['Sebaran Klaster UNPATTI', `Unggul: ${scopeBundle?.crossUnitStats.clusterCounts.Unggul ?? 0} | Stabil: ${scopeBundle?.crossUnitStats.clusterCounts.Stabil ?? 0} | Menurun: ${scopeBundle?.crossUnitStats.clusterCounts.Menurun ?? 0} | Pembinaan: ${scopeBundle?.crossUnitStats.clusterCounts.Pembinaan ?? 0}`],
          ['Pimpinan & Penjaminan Mutu', `Rektorat / Kepala LPMPP: ${meta.kepalaLpmppNama}`],
          ['Dasar Penugasan', meta.noSkAuditor],
        ];

  children.push(docxTable(['Atribut Administratif', 'Keterangan Resmi'], adminRows));

  // Helper to inject cross-unit tables in DOCX
  const appendScopeAggregateSectionDocx = () => {
    if (!scopeBundle || scopeLevel === 'prodi') return;
    if (unitChart) {
      children.push(...docxChartBlock(unitChart));
    }
    if (scopeLevel === 'fakultas') {
      children.push(
        docxSubTitle(
          `Rekapitulasi Kinerja Mutu Seluruh Program Studi di ${scopeBundle.targetFakultas} (${scopeBundle.prodiRows.length} Prodi)`
        ),
        docxTable(
          ['No', 'Kode PS', 'Nama Program Studi', 'Skor AMI', 'Indeks PPEPP', 'Indeks Kualitas', 'M/Mn/Ob/BP', 'PTK Closed', 'Klaster'],
          scopeBundle.prodiRows.map((p, i) => [
            String(i + 1),
            p.program.kode_ps,
            p.program.nama_prodi,
            p.skorAmiTerbobot.toFixed(2),
            `${p.indeksPpepp.toFixed(1)}%`,
            p.skorIndeksKualitas.toFixed(2),
            `${p.ktsMayor}/${p.ktsMinor}/${p.observasi}/${p.bestPractice}`,
            `${p.ptkClosedPct}%`,
            p.cluster,
          ])
        )
      );
    } else {
      children.push(
        docxSubTitle(
          `Rekapitulasi Gabungan per Fakultas / Pascasarjana / PSDKU (${scopeBundle.facultyRows.length} Unit · ${scopeBundle.programCount} Prodi)`
        ),
        docxTable(
          ['No', 'Fakultas / Pascasarjana / PSDKU', 'Jml Prodi', 'Mean AMI', 'Indeks PPEPP', 'Indeks Kualitas', 'M/Mn/Ob/BP', 'PTK Closed', 'Klaster (U/S/M/P)'],
          scopeBundle.facultyRows.map((f, i) => [
            String(i + 1),
            f.fakultas,
            String(f.prodiCount),
            f.meanSkorAmi.toFixed(2),
            `${f.meanIndeksPpepp.toFixed(1)}%`,
            f.meanIndeksKualitas.toFixed(2),
            `${f.totalMayor}/${f.totalMinor}/${f.totalObservasi}/${f.totalBestPractice}`,
            `${f.ptkClosedPct}%`,
            `${f.clusterCounts.Unggul}/${f.clusterCounts.Stabil}/${f.clusterCounts.Menurun}/${f.clusterCounts.Pembinaan}`,
          ])
        )
      );
    }
  };

  // =========================================================================
  // 1. LAPORAN AUDIT MUTU INTERNAL (AMI)
  // =========================================================================
  if (reportType === 'ami') {
    children.push(docxSectionTitle('A. BAGIAN ADMINISTRATIF & RINGKASAN EKSEKUTIF'));
    children.push(
      docxSubTitle('1. Halaman Pengesahan & Kata Pengantar'),
      docxBody(
        `Laporan Audit Mutu Internal (AMI) ${scopeUnitText} siklus ${cycle.tahun_siklus} disusun sebagai bentuk akuntabilitas pelaksanaan Sistem Penjaminan Mutu Internal (SPMI) di lingkungan Universitas Pattimura (UNPATTI).`
      ),
      docxSubTitle('2. Ringkasan Eksekutif'),
      docxBody(
        `Evaluasi terhadap ${stats.nIndicators} butir indikator pada 10 Standar SPMI menghasilkan nilai terbobot ${overall.rataRataCapaianTerbobot.toFixed(
          2
        )} (${overall.sebutanOverall}), tingkat kepatuhan ${stats.complianceRatePct}%, serta sebaran temuan: ${overall.totalCounts.Mayor} Mayor, ${overall.totalCounts.Minor} Minor, ${overall.totalCounts.Observasi} Observasi, ${overall.totalCounts['Sesuai (Baik)']} Sesuai (Baik), dan ${overall.totalCounts['Best Practice']} Best Practice.`
      )
    );

    children.push(docxSectionTitle('BAB I. PENDAHULUAN'));
    children.push(
      docxSubTitle('1.1 Latar Belakang, Tujuan, Ruang Lingkup & Dasar Hukum'),
      docxBody(
        `AMI merupakan tahap Evaluasi (E) dalam siklus PPEPP untuk memverifikasi kesesuaian penyelenggaraan tridharma pada ${scopeUnitText} terhadap SN-DIKTI (Permendikbudristek No. 53/2023) dan Standar Mutu Universitas Pattimura pada 10 Standar SPMI.`
      )
    );

    children.push(docxSectionTitle('BAB II. PELAKSANAAN AUDIT MUTU INTERNAL'));
    children.push(
      docxBody(
        `Tim Auditor (${meta.ketuaAuditor}, ${meta.anggotaAuditor1}, ${meta.anggotaAuditor2}) berdasarkan ${meta.noSkAuditor} melaksanakan audit pada ${meta.tanggalAudit} di ${meta.lokasiAudit} meliputi audit dokumen, opening meeting, visitasi lapangan, closing meeting, dan pelaporan dengan instrumen rubrik skala 1–7.`
      )
    );

    children.push(docxSectionTitle('BAB III. HASIL AUDIT, VISUALISASI GRAFIK & ANALISIS STATISTIK'));
    children.push(
      docxSubTitle('3.1 Rekapitulasi Tingkat Ketercapaian 10 Standar SPMI'),
      docxTable(
        ['No', 'Standar SPMI', 'Capaian', 'Sebutan', 'Target', 'Kategori', 'M / Mn / Ob / BP'],
        [
          ...recaps.map((r) => [
            String(r.standardId),
            r.nama,
            r.nilaiCapaian.toFixed(2),
            r.sebutanCapaian,
            r.nilaiTarget.toFixed(2),
            r.kategoriTemuan ?? '-',
            `${r.counts.Mayor} / ${r.counts.Minor} / ${r.counts.Observasi} / ${r.counts['Best Practice']}`,
          ]),
          [
            '-',
            'RATA-RATA TERBOBOT / TOTAL',
            overall.rataRataCapaianTerbobot.toFixed(2),
            overall.sebutanOverall,
            overall.rataRataTargetTerbobot.toFixed(2),
            '-',
            `${overall.totalCounts.Mayor} / ${overall.totalCounts.Minor} / ${overall.totalCounts.Observasi} / ${overall.totalCounts['Best Practice']}`,
          ],
        ]
      ),
      docxSubTitle('3.2 Visualisasi Grafik Capaian & Distribusi Temuan'),
      ...docxChartBlock(chart1),
      ...docxChartBlock(chart2)
    );
    appendScopeAggregateSectionDocx();
    children.push(
      docxSubTitle('3.3 Analisis Statistik Deskriptif & Inferensial Hasil AMI'),
      docxBody(
        `Secara statistik, rata-rata capaian 10 standar adalah ${stats.meanCapaian.toFixed(
          2
        )} (SD = ${stats.sdCapaian.toFixed(2)}, CV = ${stats.cvCapaianPct.toFixed(
          2
        )}%) dengan median ${stats.medianCapaian.toFixed(
          2
        )} dan IQR ${stats.iqrCapaian.toFixed(
          2
        )}. Uji beda berpasangan (Paired Sample t-test) terhadap target mutu menunjukkan nilai t(${stats.pairedDf}) = ${stats.pairedTStat.toFixed(
          3
        )} (${stats.pairedPLabel}), sedangkan korelasi kepadatan temuan KTS terhadap skor standar menunjukkan ${stats.pearsonInterpretation}.`
      ),
      docxTable(
        ['Parameter Statistik', 'Nilai Empiris', 'Interpretasi Ilmiah Mutu'],
        statRows
      ),
      docxSubTitle('3.4 Matriks Temuan Audit (PLOR+CA) & Rencana Tindak Lanjut (RTL)'),
      scopeLevel === 'prodi'
        ? docxTable(
            [
              'Kode',
              'Standar & Butir Mutu',
              'Kategori',
              'Uraian Temuan (PLOR)',
              'Akar Masalah/Penunjang',
              'Rencana Tindak Lanjut (RTL)',
              'PIC & Batas Waktu',
            ],
            allFindings.length > 0
              ? allFindings.map((item) => [
                  item.indicator.code,
                  `${item.standard?.nama ?? ''}\n${item.indicator.uraian}`,
                  item.kategori ?? '-',
                  item.evaluation.nilai_capaian !== null
                    ? `Skor ${item.evaluation.nilai_capaian}: ${item.indicator.rubric_levels[item.evaluation.nilai_capaian]}${item.plor ? `\n${item.plor}` : ''}`
                    : item.plor || '-',
                  item.evaluation.akar_masalah || item.evaluation.plor_ca.problem || '-',
                  item.evaluation.ptk_rtl || '-',
                  `${item.evaluation.pic || '-'}\n(${item.evaluation.waktu_ptk || '-'})`,
                ])
              : [['-', 'Seluruh indikator telah Sesuai (Baik)', '-', '-', '-', '-', '-']]
          )
        : docxTable(
            [
              'Prodi / Unit',
              'Kode & Standar',
              'Kategori',
              'Uraian Temuan',
              'Akar Masalah/Penunjang',
              'Rencana Tindak Lanjut (RTL)',
              'PIC & Batas Waktu',
            ],
            (scopeBundle?.allUnitFindings ?? []).slice(0, 30).length > 0
              ? (scopeBundle?.allUnitFindings ?? []).slice(0, 30).map((f) => [
                  `${f.namaProdi}\n(${shortenFacultyName(f.fakultas)})`,
                  `${f.indicatorCode} · ${f.standardName}`,
                  f.kategori,
                  `Skor ${f.skor}: ${f.rubricDesc}`,
                  f.akarMasalah,
                  f.ptkRtl,
                  `${f.pic}\n(${f.waktuPtk})`,
                ])
              : [['-', 'Seluruh indikator telah Sesuai (Baik)', '-', '-', '-', '-', '-']]
          ),
      docxSubTitle('3.5 Praktik Baik (Good / Best Practices)'),
      docxBody(
        overall.totalCounts['Best Practice'] > 0
          ? `Tercatat ${overall.totalCounts['Best Practice']} indikator (${stats.bestPracticeRatioPct}%) meraih predikat Best Practice (Skor 7).${
              scopeLevel === 'prodi' && bestPractices.length > 0
                ? ` Antara lain: ${bestPractices
                    .slice(0, 5)
                    .map((b) => `${b.indicator.code} (${b.indicator.uraian})`)
                    .join('; ')}.`
                : ''
            }`
          : 'Program studi terus mendorong inovasi pembelajaran OBE dan digitalisasi mutu untuk mencapai predikat Best Practice.'
      )
    );

    children.push(docxSectionTitle('BAB IV & V. REKOMENDASI, KESIMPULAN & LAMPIRAN WAJIB'));
    children.push(
      docxBody(`Kesimpulan: ${meta.kesimpulan}`),
      docxBody(`Saran & Tindak Lanjut: ${meta.saran}`),
      docxSubTitle('Daftar 6 Lampiran Wajib Laporan AMI'),
      docxBullet('Lampiran 1: SK Penugasan Tim Auditor (' + meta.noSkAuditor + ').'),
      docxBullet('Lampiran 2: Daftar Hadir Opening Meeting & Closing Meeting.'),
      docxBullet('Lampiran 3: Instrumen / Checklist Audit Mutu Internal Terisi (10 Standar SPMI).'),
      docxBullet('Lampiran 4: Berita Acara Pelaksanaan Audit Mutu Internal.'),
      docxBullet('Lampiran 5: Lembar Permintaan Tindakan Koreksi (PTK) / RTL.'),
      docxBullet('Lampiran 6: Dokumentasi Kegiatan Visitasi / Foto Audit.')
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      docxSectionTitle('LEMBAR PENGESAHAN LAPORAN AMI'),
      docxSignBlock(
        scopeLevel === 'universitas'
          ? 'Rektor Universitas Pattimura'
          : 'Kepala LPMPP Universitas Pattimura',
        scopeLevel === 'universitas'
          ? meta.pimpinanRtmNama
          : meta.kepalaLpmppNama,
        scopeLevel === 'universitas' ? '-' : meta.kepalaLpmppNip,
        `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalAudit}`,
        scopeLevel === 'universitas'
          ? 'Kepala LPMPP Universitas Pattimura'
          : 'Ketua Tim Auditor AMI',
        scopeLevel === 'universitas' ? meta.kepalaLpmppNama : meta.ketuaAuditor,
        scopeLevel === 'universitas' ? meta.kepalaLpmppNip : meta.ketuaAuditorNip
      ),
      ...(scopeLevel === 'prodi'
        ? [
            new Paragraph({ text: '', spacing: { after: 160 } }),
            docxSignBlock(
              `Mengetahui, Dekan ${program.fakultas}`,
              program.dekan_nama,
              program.dekan_nip,
              `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalAudit}`,
              `Ketua Program Studi ${program.nama_prodi}`,
              program.kaprodi_nama,
              program.kaprodi_nip
            ),
          ]
        : scopeLevel === 'fakultas'
        ? [
            new Paragraph({ text: '', spacing: { after: 160 } }),
            docxSignBlock(
              `Mengetahui, ${meta.pimpinanRtmJabatan}`,
              meta.pimpinanRtmNama,
              program.dekan_nip,
              `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalAudit}`,
              `Ketua Gugus Jaminan Mutu (GJM) ${shortenFacultyName(
                scopeBundle?.targetFakultas ?? program.fakultas
              )}`,
              meta.anggotaAuditor1,
              '-'
            ),
          ]
        : [])
    );
  }

  // =========================================================================
  // 2. LAPORAN RAPAT TINJAUAN MANAJEMEN (RTM)
  // =========================================================================
  if (reportType === 'rtm') {
    children.push(docxSectionTitle('BAB I & II. PENDAHULUAN DAN PELAKSANAAN RTM'));
    children.push(
      docxBody(
        `Rapat Tinjauan Manajemen (RTM) dilaksanakan pada ${meta.tanggalRtm} di ${meta.tempatRtm}, dipimpin oleh ${meta.pimpinanRtmNama} (${meta.pimpinanRtmJabatan}) membahas 7 agenda pokok SPMI mengacu Permendikbudristek No. 53/2023 dan hasil AMI Siklus ${cycle.tahun_siklus}.`
      )
    );

    children.push(docxSectionTitle('BAB III. EVALUASI KINERJA MUTU, VISUALISASI & ANALISIS STATISTIK RTM'));
    children.push(
      docxSubTitle('3.1 Tinjauan Hasil RTM Sebelumnya & Umpan Balik Stakeholder'),
      docxBody(meta.rtmSebelumnyaRingkasan),
      docxBody(meta.umpanBalikStakeholder),
      docxSubTitle('3.2 Visualisasi Prioritas Gap & Kesiapan Penyelesaian PTK'),
      ...docxChartBlock(chart1),
      ...docxChartBlock(chart2)
    );
    appendScopeAggregateSectionDocx();
    children.push(
      docxSubTitle('3.3 Analisis Statistik Kinerja Mutu & Kesiapan Pengendalian'),
      docxBody(
        `Rata-rata kesenjangan (Gap) 10 standar adalah ${stats.meanGap.toFixed(
          2
        )} poin (SD = ${stats.sdGap.toFixed(2)}), dengan gap tertinggi pada ${stats.maxGapStandardName} (Δ = ${stats.maxGap.toFixed(
          2
        )}). Uji beda berpasangan t(${stats.pairedDf}) = ${stats.pairedTStat.toFixed(
          3
        )} (${stats.pairedPLabel}). Tingkat kepatuhan saat ini mencapai ${stats.complianceRatePct}% dan kelengkapan rencana PTK/RTL mencapai ${stats.ptkPlanCompletenessPct}%.`
      ),
      docxTable(
        ['Parameter Statistik', 'Nilai Empiris', 'Implikasi Keputusan RTM'],
        statRows
      )
    );

    children.push(docxSectionTitle('BAB IV. KEPUTUSAN STRATEGIS & MATRIKS TINDAK LANJUT RTM'));
    children.push(
      docxBody(`Arahan Pimpinan: ${meta.arahanPimpinanRtm}`),
      docxBody(`Alokasi Sumber Daya: ${meta.alokasiSumberDayaRtm}`),
      docxTable(
        [
          'No',
          'Agenda / Isu Strategis',
          'Keputusan / Kebijakan Pimpinan',
          'Implikasi Sumber Daya',
          'PIC',
          'Tenggat Waktu',
        ],
        meta.rtmDecisions.map((d, idx) => [
          String(idx + 1),
          d.agenda,
          d.keputusan,
          d.sumberDaya,
          d.pic,
          d.tenggat,
        ])
      )
    );

    children.push(docxSectionTitle('BAB V. PENUTUP & LAMPIRAN WAJIB RTM'));
    children.push(
      docxBody(meta.kesimpulan),
      docxBody(`Jadwal RTM Berikutnya: ${meta.jadwalRtmBerikutnya}.`),
      docxBullet('Lampiran Wajib: Undangan & SK Panitia RTM, Daftar Hadir, Materi Paparan, Notulensi Rapat, dan Berita Acara Keputusan RTM.')
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      docxSectionTitle('LEMBAR PENGESAHAN LAPORAN RTM'),
      docxSignBlock(
        meta.pimpinanRtmJabatan,
        meta.pimpinanRtmNama,
        program.dekan_nip,
        `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalRtm}`,
        'Kepala LPMPP Universitas Pattimura',
        meta.kepalaLpmppNama,
        meta.kepalaLpmppNip
      )
    );
  }

  // =========================================================================
  // 3. LAPORAN EVALUASI & ANALISIS EFEKTIVITAS PPEPP
  // =========================================================================
  if (reportType === 'efektivitas_ppepp') {
    children.push(docxSectionTitle('1 & 2. PENDAHULUAN DAN METODOLOGI EVALUASI'));
    children.push(
      docxBody(
        `Evaluasi efektivitas siklus PPEPP pada ${scopeUnitText} (Siklus ${cycle.tahun_siklus}) mengukur konsistensi lima tahapan Penetapan, Pelaksanaan, Evaluasi, Pengendalian, dan Peningkatan mutu melalui instrumen 10 Standar (${stats.nIndicators} indikator), Root Cause Analysis (PLOR+CA), analisis tren longitudinal, dan statistik variabilitas.`
      )
    );

    children.push(docxSectionTitle('3. HASIL EVALUASI, VISUALISASI & ANALISIS STATISTIK PPEPP'));
    children.push(
      docxBody(
        `Indeks Komposit Efektivitas Implementasi PPEPP mencapai ${ppeppStats.indeks}% (${ppeppStats.label}), dengan rerata skor antar tahap ${stats.ppeppMean}% (SD = ${stats.ppeppSd}, CV = ${stats.ppeppCvPct}%). Tahap terkuat adalah ${stats.strongestStage.label} (${stats.strongestStage.score}%), sedangkan titik kendala (bottleneck) berada pada ${stats.bottleneckStage.label} (${stats.bottleneckStage.score}%).`
      ),
      ...docxChartBlock(chart1),
      ...docxChartBlock(chart2)
    );
    appendScopeAggregateSectionDocx();
    children.push(
      docxSubTitle('3.1 Tabel Statistik Variabilitas & Efektivitas Sistemik PPEPP'),
      docxTable(
        ['Parameter Statistik', 'Nilai Empiris', 'Interpretasi Analisis PPEPP'],
        statRows
      ),
      docxSubTitle('3.2 Matriks Analisis Efektivitas 5 Tahap Siklus PPEPP'),
      docxTable(
        [
          'Tahapan Siklus',
          'Fokus Evaluasi',
          'Indikator Efektivitas',
          'Capaian & Analisis Kesenjangan (Gap)',
        ],
        [
          [
            `1. Penetapan (${ppeppStats.penetapan}%)`,
            'Dokumen kebijakan, VMTS, CPL & target mutu >= 5.',
            'Kelengkapan Identitas Prodi & Target Mutu 10 Standar.',
            'Dokumen profil & target standar terdefinisi; perlu sinkronisasi berkala SN-DIKTI.',
          ],
          [
            `2. Pelaksanaan (${ppeppStats.pelaksanaan}%)`,
            'Implementasi tridharma & kelengkapan bukti dokumen.',
            'Skor terbobot AMI & rasio indikator berbukti dokumen.',
            `Skor terbobot AMI ${overall.rataRataCapaianTerbobot.toFixed(2)}. Perlu pemerataan arsip digital.`,
          ],
          [
            `3. Evaluasi (${ppeppStats.evaluasi}%)`,
            'Pelaksanaan AMI & analisis akar masalah (PLOR+CA).',
            'Persentase temuan KTS/OB dengan analisis PLOR+CA.',
            `${nonCompliant.length} temuan KTS/OB; perlu ketajaman objective evidence.`,
          ],
          [
            `4. Pengendalian (${ppeppStats.pengendalian}%)`,
            'Penyusunan PTK/RTL, PIC & batas waktu koreksi.',
            'Persentase temuan dengan rencana PTK/RTL & PIC lengkap.',
            'Sebagian tindakan koreksi membutuhkan monitoring tenggat yang lebih ketat.',
          ],
          [
            `5. Peningkatan (${ppeppStats.peningkatan}%)`,
            'Penutupan Monev (Closed) & pelampauan standar (Best Practice).',
            'Rasio Closed - Verified & capaian Best Practice.',
            `${overall.totalCounts['Best Practice']} Best Practice tercatat; percepat verifikasi penutupan PTK.`,
          ],
        ]
      )
    );

    children.push(docxSectionTitle('4 & 5. FAKTOR PENDUKUNG/PENGHAMBAT, SINTESIS & REKOMENDASI'));
    children.push(
      docxBody(`Faktor Pendukung: ${meta.faktorPendukung}`),
      docxBody(`Faktor Penghambat: ${meta.faktorPenghambat}`),
      docxBody(`Sintesis Efektivitas Sistemik & Substantif: ${meta.kesimpulan}`),
      docxBody(`Rekomendasi Tindak Lanjut: ${meta.saran}`)
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      docxSectionTitle('LEMBAR PENGESAHAN EVALUASI EFEKTIVITAS PPEPP'),
      docxSignBlock(
        `Dekan ${program.fakultas}`,
        program.dekan_nama,
        program.dekan_nip,
        `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalAudit}`,
        `Ketua Program Studi ${program.nama_prodi}`,
        program.kaprodi_nama,
        program.kaprodi_nip
      )
    );
  }

  // =========================================================================
  // 4. LAPORAN PERBAIKAN DAN PENINGKATAN STANDAR SPMI
  // =========================================================================
  if (reportType === 'perbaikan_peningkatan') {
    children.push(docxSectionTitle('BAB I & II. PENDAHULUAN, EVALUASI & HASIL RTM'));
    children.push(
      docxBody(
        `Laporan ini mendokumentasikan keterlacakan penuh (traceability) dari ${nonCompliant.length} temuan AMI, keputusan RTM (${meta.arahanPimpinanRtm}), pengendalian tindakan koreksi, hingga penetapan target peningkatan standar baru pada Siklus ${cycle.tahun_siklus}.`
      )
    );

    children.push(docxSectionTitle('BAB III. PENGENDALIAN STANDAR, GRAFIK MONEV & ANALISIS STATISTIK'));
    children.push(
      docxBody(
        `Tingkat penutupan (Closure Rate) PTK saat ini mencapai ${stats.ptkClosureRatePct}% (${stats.ptkClosedCount}/${stats.nonCompliantCount} Closed - Verified) dengan Indeks Reduksi Risiko KTS sebesar ${stats.riskReductionIndexPct}% dan rasio Best Practice ${stats.bestPracticeRatioPct}%.`
      ),
      ...docxChartBlock(chart1)
    );
    appendScopeAggregateSectionDocx();
    children.push(
      docxTable(
        ['Parameter Statistik Pengendalian & Peningkatan', 'Nilai Empiris', 'Interpretasi'],
        statRows
      ),
      docxSubTitle('3.2 Matriks Pengendalian Standar (Tindakan Koreksi & Monev)'),
      scopeLevel === 'prodi'
        ? docxTable(
            [
              'No',
              'Standar & Kode',
              'Temuan / Ketidaksesuaian (AMI)',
              'Akar Masalah/Penunjang',
              'Tindakan Koreksi / Perbaikan',
              'Bukti Dukung',
              'Status Verifikasi',
            ],
            nonCompliant.length > 0
              ? nonCompliant.map((item, idx) => [
                  String(idx + 1),
                  `${item.indicator.code} (${item.kategori})\n${item.standard?.nama ?? ''}`,
                  item.indicator.uraian,
                  item.evaluation.akar_masalah || item.evaluation.plor_ca.problem || '-',
                  item.evaluation.ptk_rtl || '-',
                  item.evaluation.bukti_realisasi || item.evaluation.bukti_link || 'Dalam proses unggah',
                  item.evaluation.monev_status,
                ])
              : [['-', '-', 'Tidak ada ketidaksesuaian terbuka', '-', '-', '-', 'Closed - Verified']]
          )
        : docxTable(
            [
              'No',
              'Prodi & Kode',
              'Temuan / Ketidaksesuaian (AMI)',
              'Akar Masalah/Penunjang',
              'Tindakan Koreksi / Perbaikan',
              'Bukti Dukung',
              'Status Verifikasi',
            ],
            (scopeBundle?.allUnitFindings ?? [])
              .filter((f) => f.kategori !== 'Best Practice')
              .slice(0, 30).length > 0
              ? (scopeBundle?.allUnitFindings ?? [])
                  .filter((f) => f.kategori !== 'Best Practice')
                  .slice(0, 30)
                  .map((f, idx) => [
                    String(idx + 1),
                    `${f.namaProdi}\n${f.indicatorCode} (${f.kategori})`,
                    f.indicatorUraian,
                    f.akarMasalah,
                    f.ptkRtl,
                    f.buktiDukung,
                    f.monevStatus,
                  ])
              : [['-', '-', 'Tidak ada ketidaksesuaian terbuka', '-', '-', '-', 'Closed - Verified']]
          )
    );

    children.push(docxSectionTitle('BAB IV. PENINGKATAN STANDAR (CONTINUOUS IMPROVEMENT)'));
    children.push(
      ...docxChartBlock(chart2),
      docxTable(
        [
          'No',
          'Nama Standar',
          'Indikator / Target Lama',
          'Indikator / Target Baru (Peningkatan)',
          'Alasan Peningkatan',
          'Dokumen Penetapan Revisi',
        ],
        meta.standardUpgrades.map((u, idx) => [
          String(idx + 1),
          u.namaStandar,
          u.targetLama,
          u.targetBaru,
          u.alasanPeningkatan,
          u.dokumenRevisi,
        ])
      )
    );

    children.push(docxSectionTitle('BAB V & VI. KENDALA, REKOMENDASI, KESIMPULAN & LAMPIRAN'));
    children.push(
      docxBody(`Kendala Pelaksanaan: ${meta.faktorPenghambat}`),
      docxBody(`Kesimpulan: ${meta.kesimpulan}`),
      docxBody(`Rekomendasi Kebijakan: ${meta.saran}`),
      docxBullet('Lampiran Evidence-Based: Bukti realisasi perbaikan PTK, Berita Acara RTM, dan Dokumen Revisi Standar.')
    );

    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      docxSectionTitle('LEMBAR PENGESAHAN PERBAIKAN & PENINGKATAN STANDAR'),
      docxSignBlock(
        `Dekan ${program.fakultas}`,
        program.dekan_nama,
        program.dekan_nip,
        `${program.tempat_pengesahan || 'Ambon'}, ${meta.tanggalRtm}`,
        `Ketua Program Studi ${program.nama_prodi}`,
        program.kaprodi_nama,
        program.kaprodi_nip
      )
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1418,
              right: 1134,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${REPORT_TITLES[reportType]} · ${program.nama_prodi} · Siklus ${cycle.tahun_siklus}`,
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'PPEPP UNPATTI · LPMPP Universitas Pattimura · Halaman ',
                    size: 16,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '64748B',
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 16,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${REPORT_FILE_PREFIX[reportType]}_${scopeFileSlug}_${cycle.tahun_siklus.replace(
    '/',
    '-'
  )}.docx`;
  downloadBlob(blob, fileName);
  return fileName;
}

/* ============================================================================
 * PDF (.PDF) EXPORT ENGINE (Logo 2.0 cm x 2.0 cm = 20 mm x 20 mm in Kop Surat)
 * ============================================================================ */

export async function exportSpmiReportToPdf(
  payload: SpmiReportPayload
): Promise<string> {
  const logoData = await fetchLogoDataUrl();
  const { reportType, program, cycle, meta, scopeBundle } = payload;
  const scopeLevel = scopeBundle?.scopeLevel ?? 'prodi';
  const recaps = scopeBundle?.recaps ?? payload.recaps;
  const overall = scopeBundle?.overall ?? payload.overall;
  const ppeppStats = scopeBundle?.ppeppStats ?? payload.ppeppStats;
  const stats =
    scopeBundle?.stats ??
    computeSpmiStatistics({
      program,
      standards: payload.standards,
      indicators: payload.indicators,
      evaluations: payload.evaluations,
      recaps,
      overall,
      ppeppStats,
      cycles: payload.cycles,
      evaluationsByContext: payload.evaluationsByContext,
    });
  const [chart1, chart2] = renderChartsForReport({
    reportType,
    recaps,
    overall,
    ppeppStats,
    stats,
  });
  const unitChart = scopeBundle ? renderUnitComparisonChart(scopeBundle) : null;
  const statRows = buildStatisticalRowsForReport(reportType, stats, overall);

  const allItems = extractFindings(payload);
  const nonCompliant = allItems.filter(
    (x) =>
      x.kategori === 'Mayor' ||
      x.kategori === 'Minor' ||
      x.kategori === 'Observasi'
  );
  const allFindings = allItems.filter(
    (x) => x.kategori !== null && x.kategori !== 'Sesuai (Baik)'
  );

  const scopeHeading =
    scopeBundle?.scopeHeading ??
    `PROGRAM STUDI ${program.nama_prodi.toUpperCase()} (${program.kode_ps})`;
  const scopeSubheading =
    scopeBundle?.scopeSubheading ??
    `${program.fakultas} · Siklus PPEPP ${cycle.tahun_siklus}`;
  const scopeUnitText =
    scopeLevel === 'universitas'
      ? `Universitas Pattimura (${scopeBundle?.facultyCount ?? 12} Fakultas/Pascasarjana/PSDKU, ${scopeBundle?.programCount ?? 118} Prodi)`
      : scopeLevel === 'fakultas'
      ? `${scopeBundle?.targetFakultas ?? program.fakultas} (${scopeBundle?.programCount ?? 1} Prodi)`
      : `Program Studi ${program.nama_prodi}`;
  const scopeFileSlug =
    scopeLevel === 'universitas'
      ? 'UNIVERSITAS_UNPATTI'
      : scopeLevel === 'fakultas'
      ? shortenFacultyName(scopeBundle?.targetFakultas ?? program.fakultas).replace(/\s+/g, '_')
      : program.kode_ps;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 12;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  const addSectionHeader = (title: string) => {
    ensureSpace(14);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 1.8;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const addSubHeader = (title: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138);
    doc.text(title, margin, y);
    y += 4.5;
  };

  const addParagraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const blockHeight = lines.length * 4.2 + 2;
    ensureSpace(blockHeight);
    doc.text(lines, margin, y);
    y += blockHeight;
  };

  const addChartFigure = (chart: RenderedChartImage) => {
    const imgW = contentWidth;
    const imgH = (chart.heightPx / chart.widthPx) * imgW;
    ensureSpace(imgH + 14);
    doc.addImage(chart.dataUrl, 'PNG', margin, y, imgW, imgH);
    y += imgH + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const capLines = doc.splitTextToSize(
      `${chart.title}. ${chart.caption}`,
      contentWidth
    ) as string[];
    doc.text(capLines, pageWidth / 2, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    y += capLines.length * 3.8 + 4;
  };

  const addTable = (head: string[][], body: string[][], fontSize = 7.5) => {
    ensureSpace(18);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head,
      body,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: fontSize - 0.3,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
    const last = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable;
    y = (last?.finalY ?? y + 20) + 5;
  };

  // --- KOP SURAT UNPATTI (Exact 2 cm x 2 cm = 20 mm x 20 mm logo) ---
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 10, 20, 20);
  }
  const kopCenterX = margin + 22 + (contentWidth - 22) / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
    kopCenterX,
    13.5,
    { align: 'center' }
  );
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('UNIVERSITAS PATTIMURA', kopCenterX, 18.8, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text(
    'LEMBAGA PENJAMINAN MUTU DAN PENGEMBANGAN PEMBELAJARAN (LPMPP)',
    kopCenterX,
    23.6,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Jl. Ir. M. Putuhena, Kampus Poka, Ambon 97233 · Laman: https://unpatti.ac.id',
    kopCenterX,
    28.2,
    { align: 'center' }
  );

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageWidth - margin, 32);
  doc.setLineWidth(0.25);
  doc.line(margin, 33.2, pageWidth - margin, 33.2);

  y = 39;

  // Report Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(
    `${REPORT_TITLES[reportType]} (${scopeBundle?.scopeBadgeLabel ?? 'TINGKAT PROGRAM STUDI'})`,
    contentWidth
  ) as string[];
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 5 + 1;

  doc.setFontSize(9.2);
  doc.setTextColor(30, 58, 138);
  const headLines = doc.splitTextToSize(scopeHeading, contentWidth) as string[];
  doc.text(headLines, pageWidth / 2, y, { align: 'center' });
  y += headLines.length * 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(scopeSubheading, pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  // Identitas & Administratif
  const pdfAdminRows: string[][] =
    scopeLevel === 'prodi'
      ? [
          ['Perguruan Tinggi / Fakultas', `${program.nama_pt} · ${program.fakultas}`],
          ['Program Studi / Akreditasi', `${program.kode_ps} — ${program.nama_prodi} (${program.peringkat_akreditasi})`],
          ['Nomor Dokumen & SK', `${meta.nomorDokumen} | ${meta.noSkAuditor}`],
          ['Tim Auditor / Kaprodi', `Ketua: ${meta.ketuaAuditor} | Kaprodi: ${program.kaprodi_nama}`],
          ['Capaian Terbobot AMI', `${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall}) | Indeks PPEPP: ${ppeppStats.indeks}%`],
        ]
      : scopeLevel === 'fakultas'
      ? [
          ['Perguruan Tinggi / Unit', `${program.nama_pt} · ${scopeBundle?.targetFakultas ?? program.fakultas}`],
          ['Cakupan Program Studi', `${scopeBundle?.programCount ?? 0} Program Studi dalam Fakultas/Pascasarjana/PSDKU`],
          ['Nomor Dokumen & SK', `${meta.nomorDokumen} | ${meta.noSkAuditor}`],
          ['Sebaran Klaster Mutu', `Unggul: ${scopeBundle?.crossUnitStats.clusterCounts.Unggul ?? 0} | Stabil: ${scopeBundle?.crossUnitStats.clusterCounts.Stabil ?? 0} | Menurun: ${scopeBundle?.crossUnitStats.clusterCounts.Menurun ?? 0} | Pembinaan: ${scopeBundle?.crossUnitStats.clusterCounts.Pembinaan ?? 0}`],
          ['Capaian & Indeks PPEPP', `Mean Terbobot ${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall}) | Indeks PPEPP: ${ppeppStats.indeks}%`],
        ]
      : [
          ['Perguruan Tinggi', `${program.nama_pt} — Agregasi Tingkat Universitas`],
          ['Cakupan Unit & Prodi', `${scopeBundle?.facultyCount ?? 12} Fakultas/Pascasarjana/PSDKU · ${scopeBundle?.programCount ?? 118} Program Studi`],
          ['Nomor Dokumen & SK', `${meta.nomorDokumen} | ${meta.noSkAuditor}`],
          ['Sebaran Klaster UNPATTI', `Unggul: ${scopeBundle?.crossUnitStats.clusterCounts.Unggul ?? 0} | Stabil: ${scopeBundle?.crossUnitStats.clusterCounts.Stabil ?? 0} | Menurun: ${scopeBundle?.crossUnitStats.clusterCounts.Menurun ?? 0} | Pembinaan: ${scopeBundle?.crossUnitStats.clusterCounts.Pembinaan ?? 0}`],
          ['Capaian & Indeks PPEPP', `Mean Terbobot ${overall.rataRataCapaianTerbobot.toFixed(2)} (${overall.sebutanOverall}) | Indeks PPEPP: ${ppeppStats.indeks}%`],
        ];

  addTable([['Atribut Administratif', 'Keterangan Resmi']], pdfAdminRows, 8);

  const appendScopeAggregateSectionPdf = () => {
    if (!scopeBundle || scopeLevel === 'prodi') return;
    if (unitChart) {
      addChartFigure(unitChart);
    }
    if (scopeLevel === 'fakultas') {
      addSubHeader(
        `Rekapitulasi Seluruh Program Studi di ${scopeBundle.targetFakultas} (${scopeBundle.prodiRows.length} Prodi)`
      );
      addTable(
        [['No', 'Kode', 'Program Studi', 'Skor AMI', 'PPEPP %', 'Kualitas', 'M/Mn/Ob/BP', 'PTK Closed', 'Klaster']],
        scopeBundle.prodiRows.map((p, i) => [
          String(i + 1),
          p.program.kode_ps,
          p.program.nama_prodi,
          p.skorAmiTerbobot.toFixed(2),
          `${p.indeksPpepp.toFixed(1)}%`,
          p.skorIndeksKualitas.toFixed(2),
          `${p.ktsMayor}/${p.ktsMinor}/${p.observasi}/${p.bestPractice}`,
          `${p.ptkClosedPct}%`,
          p.cluster,
        ]),
        6.8
      );
    } else {
      addSubHeader(
        `Rekapitulasi Gabungan per Fakultas / Pascasarjana / PSDKU (${scopeBundle.facultyRows.length} Unit · ${scopeBundle.programCount} Prodi)`
      );
      addTable(
        [['No', 'Fakultas / Pascasarjana / PSDKU', 'Prodi', 'Mean AMI', 'PPEPP %', 'Kualitas', 'M/Mn/Ob/BP', 'Closed', 'U/S/M/P']],
        scopeBundle.facultyRows.map((f, i) => [
          String(i + 1),
          f.fakultas,
          String(f.prodiCount),
          f.meanSkorAmi.toFixed(2),
          `${f.meanIndeksPpepp.toFixed(1)}%`,
          f.meanIndeksKualitas.toFixed(2),
          `${f.totalMayor}/${f.totalMinor}/${f.totalObservasi}/${f.totalBestPractice}`,
          `${f.ptkClosedPct}%`,
          `${f.clusterCounts.Unggul}/${f.clusterCounts.Stabil}/${f.clusterCounts.Menurun}/${f.clusterCounts.Pembinaan}`,
        ]),
        6.6
      );
    }
  };

  if (reportType === 'ami') {
    addSectionHeader('A. RINGKASAN EKSEKUTIF, BAB I & II PELAKSANAAN AMI');
    addParagraph(
      `Audit Mutu Internal (AMI) ${scopeUnitText} siklus ${cycle.tahun_siklus} mengevaluasi ${stats.nIndicators} butir indikator pada 10 Standar SPMI dengan rata-rata terbobot ${overall.rataRataCapaianTerbobot.toFixed(
        2
      )} (${overall.sebutanOverall}) serta tingkat kepatuhan ${stats.complianceRatePct}%. Distribusi temuan: ${overall.totalCounts.Mayor} Mayor, ${overall.totalCounts.Minor} Minor, ${overall.totalCounts.Observasi} Observasi, ${overall.totalCounts['Sesuai (Baik)']} Sesuai (Baik), dan ${overall.totalCounts['Best Practice']} Best Practice.`
    );

    addSectionHeader('BAB III. HASIL AUDIT, GRAFIK & ANALISIS STATISTIK');
    addSubHeader('3.1 Rekapitulasi Tingkat Ketercapaian 10 Standar SPMI');
    addTable(
      [['No', 'Standar SPMI', 'Capaian', 'Sebutan', 'Target', 'Kategori', 'M/Mn/Ob/BP']],
      [
        ...recaps.map((r) => [
          String(r.standardId),
          r.nama,
          r.nilaiCapaian.toFixed(2),
          r.sebutanCapaian,
          r.nilaiTarget.toFixed(2),
          r.kategoriTemuan ?? '-',
          `${r.counts.Mayor}/${r.counts.Minor}/${r.counts.Observasi}/${r.counts['Best Practice']}`,
        ]),
        [
          '-',
          'RATA-RATA TERBOBOT / TOTAL',
          overall.rataRataCapaianTerbobot.toFixed(2),
          overall.sebutanOverall,
          overall.rataRataTargetTerbobot.toFixed(2),
          '-',
          `${overall.totalCounts.Mayor}/${overall.totalCounts.Minor}/${overall.totalCounts.Observasi}/${overall.totalCounts['Best Practice']}`,
        ],
      ]
    );

    addSubHeader('3.2 Visualisasi Grafik Capaian & Sebaran Temuan');
    addChartFigure(chart1);
    addChartFigure(chart2);
    appendScopeAggregateSectionPdf();

    addSubHeader('3.3 Analisis Statistik Deskriptif & Inferensial');
    addTable(
      [['Parameter Statistik', 'Nilai Empiris', 'Interpretasi Ilmiah Mutu']],
      statRows,
      7.5
    );

    addSubHeader('3.4 Matriks Temuan Audit (PLOR+CA) & Rencana Tindak Lanjut');
    if (scopeLevel === 'prodi') {
      addTable(
        [['Kode', 'Standar & Butir', 'Kategori', 'Uraian Temuan & PLOR', 'Akar Masalah/Penunjang', 'PTK / RTL & PIC']],
        allFindings.length > 0
          ? allFindings.map((item) => [
              item.indicator.code,
              `${item.standard?.nama ?? ''}\n${item.indicator.uraian}`,
              item.kategori ?? '-',
              item.evaluation.nilai_capaian !== null
                ? `Skor ${item.evaluation.nilai_capaian}: ${item.indicator.rubric_levels[item.evaluation.nilai_capaian]}`
                : '-',
              item.evaluation.akar_masalah || item.evaluation.plor_ca.problem || '-',
              `${item.evaluation.ptk_rtl || '-'}\nPIC: ${item.evaluation.pic || '-'} (${item.evaluation.waktu_ptk || '-'})`,
            ])
          : [['-', 'Seluruh indikator telah Sesuai (Baik)', '-', '-', '-', '-']],
        7
      );
    } else {
      const unitFindings = (scopeBundle?.allUnitFindings ?? []).slice(0, 25);
      addTable(
        [['Prodi', 'Kode & Standar', 'Kategori', 'Uraian Temuan', 'Akar Masalah/Penunjang', 'PTK / RTL & PIC']],
        unitFindings.length > 0
          ? unitFindings.map((f) => [
              `${f.namaProdi}\n(${shortenFacultyName(f.fakultas)})`,
              `${f.indicatorCode} · ${f.standardName}`,
              f.kategori,
              `Skor ${f.skor}: ${f.rubricDesc}`,
              f.akarMasalah,
              `${f.ptkRtl}\nPIC: ${f.pic} (${f.waktuPtk})`,
            ])
          : [['-', 'Seluruh indikator telah Sesuai (Baik)', '-', '-', '-', '-']],
        6.6
      );
    }

    addSectionHeader('BAB IV & V. REKOMENDASI, KESIMPULAN & LAMPIRAN WAJIB');
    addParagraph(`Kesimpulan: ${meta.kesimpulan}`);
    addParagraph(`Saran & Isu Strategis RTM: ${meta.saran}`);
    addParagraph(
      'Lampiran Wajib (6 Berkas): (1) SK Penugasan Tim Auditor, (2) Daftar Hadir Opening/Closing, (3) Checklist Terisi, (4) Berita Acara AMI, (5) Lembar PTK/RTL, (6) Dokumentasi Audit.'
    );
  } else if (reportType === 'rtm') {
    addSectionHeader('BAB I & II. PENDAHULUAN & PELAKSANAAN RTM');
    addParagraph(
      `RTM ${program.nama_prodi} dilaksanakan pada ${meta.tanggalRtm} di ${meta.tempatRtm}, dipimpin oleh ${meta.pimpinanRtmNama} (${meta.pimpinanRtmJabatan}) dengan 7 agenda pokok tinjauan SPMI.`
    );

    addSectionHeader('BAB III. EVALUASI KINERJA MUTU, GRAFIK & STATISTIK RTM');
    addParagraph(`Tindak Lanjut RTM Sebelumnya: ${meta.rtmSebelumnyaRingkasan}`);
    addParagraph(`Umpan Balik Stakeholder: ${meta.umpanBalikStakeholder}`);
    addChartFigure(chart1);
    addChartFigure(chart2);
    appendScopeAggregateSectionPdf();
    addSubHeader('3.3 Analisis Statistik Kinerja & Prioritas Pengendalian');
    addTable(
      [['Parameter Statistik', 'Nilai Empiris', 'Implikasi Keputusan RTM']],
      statRows,
      7.5
    );

    addSectionHeader('BAB IV. KEPUTUSAN & MATRIKS TINDAK LANJUT RTM');
    addParagraph(`Arahan Pimpinan: ${meta.arahanPimpinanRtm}`);
    addParagraph(`Alokasi Sumber Daya: ${meta.alokasiSumberDayaRtm}`);
    addTable(
      [['No', 'Agenda / Isu Strategis', 'Keputusan Pimpinan', 'Kebutuhan Sumber Daya', 'PIC', 'Tenggat']],
      meta.rtmDecisions.map((d, i) => [
        String(i + 1),
        d.agenda,
        d.keputusan,
        d.sumberDaya,
        d.pic,
        d.tenggat,
      ])
    );

    addSectionHeader('BAB V. PENUTUP & LAMPIRAN WAJIB RTM');
    addParagraph(`${meta.kesimpulan} Jadwal RTM Berikutnya: ${meta.jadwalRtmBerikutnya}.`);
  } else if (reportType === 'efektivitas_ppepp') {
    addSectionHeader('1 & 2. PENDAHULUAN DAN METODOLOGI EVALUASI PPEPP');
    addParagraph(
      `Evaluasi efektivitas siklus PPEPP pada ${scopeUnitText} (Siklus ${cycle.tahun_siklus}) mengukur konsistensi Penetapan, Pelaksanaan, Evaluasi, Pengendalian, dan Peningkatan mutu melalui instrumen AMI 10 Standar (${stats.nIndicators} indikator), analisis gap, PLOR+CA, dan uji variabilitas.`
    );

    addSectionHeader('3. HASIL EVALUASI, GRAFIK & ANALISIS STATISTIK PPEPP');
    addParagraph(
      `Indeks Komposit Efektivitas PPEPP mencapai ${ppeppStats.indeks}% (${ppeppStats.label}). Rerata tahap PPEPP = ${stats.ppeppMean}% (SD = ${stats.ppeppSd}, CV = ${stats.ppeppCvPct}%).`
    );
    addChartFigure(chart1);
    addChartFigure(chart2);
    appendScopeAggregateSectionPdf();
    addSubHeader('3.1 Statistik Efektivitas & Keseimbangan Siklus PPEPP');
    addTable(
      [['Parameter Statistik', 'Nilai Empiris', 'Interpretasi Analisis PPEPP']],
      statRows,
      7.5
    );

    addSubHeader('3.2 Matriks Analisis 5 Tahapan Siklus PPEPP');
    addTable(
      [['Tahapan Siklus', 'Fokus Evaluasi', 'Indikator Efektivitas', 'Temuan & Analisis Kesenjangan']],
      [
        [`1. Penetapan (${ppeppStats.penetapan}%)`, 'Kebijakan, VMTS, CPL & target standar', 'Kelengkapan Identitas & Target >= 5', 'Dokumen profil & target terisi; sinkronkan berkala SN-DIKTI.'],
        [`2. Pelaksanaan (${ppeppStats.pelaksanaan}%)`, 'Implementasi tridharma & bukti dokumen', 'Skor terbobot AMI & tautan bukti', `Skor terbobot AMI ${overall.rataRataCapaianTerbobot.toFixed(2)}.`],
        [`3. Evaluasi (${ppeppStats.evaluasi}%)`, 'Pelaksanaan AMI & analisis PLOR+CA', 'Rasio temuan ber-PLOR+CA', `${nonCompliant.length} temuan KTS/OB teridentifikasi.`],
        [`4. Pengendalian (${ppeppStats.pengendalian}%)`, 'Penyusunan PTK/RTL, PIC & tenggat', 'Kelengkapan PTK/RTL & PIC', `Kelengkapan PTK/RTL ${stats.ptkPlanCompletenessPct}%.`],
        [`5. Peningkatan (${ppeppStats.peningkatan}%)`, 'Verifikasi penutupan & pelampauan standar', 'Closed - Verified & Best Practice', `${overall.totalCounts['Best Practice']} Best Practice tercatat.`],
      ]
    );

    addSectionHeader('4 & 5. FAKTOR PENDUKUNG/PENGHAMBAT, SINTESIS & REKOMENDASI');
    addParagraph(`Faktor Pendukung: ${meta.faktorPendukung}`);
    addParagraph(`Faktor Penghambat: ${meta.faktorPenghambat}`);
    addParagraph(`Sintesis Efektivitas Sistemik & Substantif: ${meta.kesimpulan}`);
    addParagraph(`Rekomendasi & RTL: ${meta.saran}`);
  } else {
    addSectionHeader('BAB I & II. PENDAHULUAN, HASIL EVALUASI & RTM');
    addParagraph(
      `Laporan Perbaikan dan Peningkatan Standar SPMI memastikan keterlacakan penuh (traceability) dari temuan AMI (${overall.totalCounts.Mayor} Mayor, ${overall.totalCounts.Minor} Minor, ${overall.totalCounts.Observasi} Observasi), hasil RTM (${meta.arahanPimpinanRtm}), pengendalian PTK, hingga peningkatan target standar baru.`
    );

    addSectionHeader('BAB III. PENGENDALIAN STANDAR, GRAFIK MONEV & ANALISIS STATISTIK');
    addChartFigure(chart1);
    appendScopeAggregateSectionPdf();
    addTable(
      [['Parameter Statistik Pengendalian & Peningkatan', 'Nilai Empiris', 'Interpretasi']],
      statRows,
      7.5
    );
    addSubHeader('3.2 Matriks Pengendalian Standar (PTK & Status Verifikasi)');
    if (scopeLevel === 'prodi') {
      addTable(
        [['No', 'Standar & Kode', 'Temuan / KTS', 'Akar Masalah/Penunjang', 'Tindakan Koreksi', 'Bukti Dukung', 'Status']],
        nonCompliant.length > 0
          ? nonCompliant.map((item, i) => [
              String(i + 1),
              `${item.indicator.code} (${item.kategori})`,
              item.indicator.uraian,
              item.evaluation.akar_masalah || item.evaluation.plor_ca.problem || '-',
              item.evaluation.ptk_rtl || '-',
              item.evaluation.bukti_realisasi || item.evaluation.bukti_link || 'Proses unggah',
              item.evaluation.monev_status,
            ])
          : [['-', '-', 'Tidak ada ketidaksesuaian terbuka', '-', '-', '-', 'Closed - Verified']],
        7
      );
    } else {
      const ktsRows = (scopeBundle?.allUnitFindings ?? [])
        .filter((f) => f.kategori !== 'Best Practice')
        .slice(0, 25);
      addTable(
        [['No', 'Prodi & Kode', 'Temuan / KTS', 'Akar Masalah/Penunjang', 'Tindakan Koreksi', 'Bukti Dukung', 'Status']],
        ktsRows.length > 0
          ? ktsRows.map((f, i) => [
              String(i + 1),
              `${f.namaProdi}\n${f.indicatorCode} (${f.kategori})`,
              f.indicatorUraian,
              f.akarMasalah,
              f.ptkRtl,
              f.buktiDukung,
              f.monevStatus,
            ])
          : [['-', '-', 'Tidak ada ketidaksesuaian terbuka', '-', '-', '-', 'Closed - Verified']],
        6.6
      );
    }

    addSectionHeader('BAB IV. PENINGKATAN STANDAR (CONTINUOUS IMPROVEMENT)');
    addChartFigure(chart2);
    addTable(
      [['No', 'Nama Standar', 'Target Lama', 'Target Baru (Peningkatan)', 'Alasan Peningkatan', 'Dokumen Revisi']],
      meta.standardUpgrades.map((u, i) => [
        String(i + 1),
        u.namaStandar,
        u.targetLama,
        u.targetBaru,
        u.alasanPeningkatan,
        u.dokumenRevisi,
      ]),
      7
    );

    addSectionHeader('BAB V & VI. KENDALA, REKOMENDASI, KESIMPULAN & LAMPIRAN');
    addParagraph(`Kendala: ${meta.faktorPenghambat}`);
    addParagraph(`Kesimpulan & Saran: ${meta.kesimpulan} ${meta.saran}`);
  }

  // Official Sign-off block
  ensureSpace(40);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui,', margin, y);
  doc.text(
    `${program.tempat_pengesahan || 'Ambon'}, ${
      reportType === 'rtm' || reportType === 'perbaikan_peningkatan'
        ? meta.tanggalRtm
        : meta.tanggalAudit
    }`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  const leftRoleTitle =
    scopeLevel === 'universitas'
      ? 'Rektor Universitas Pattimura'
      : scopeLevel === 'fakultas'
      ? meta.pimpinanRtmJabatan
      : `Dekan ${program.fakultas}`;
  const leftRoleName =
    scopeLevel === 'universitas'
      ? meta.pimpinanRtmNama
      : scopeLevel === 'fakultas'
      ? meta.pimpinanRtmNama
      : program.dekan_nama || '........................................';
  const leftRoleNip =
    scopeLevel === 'universitas'
      ? '........................'
      : program.dekan_nip || '........................';

  const rightRoleTitle =
    scopeLevel === 'universitas'
      ? 'Kepala LPMPP Universitas Pattimura'
      : scopeLevel === 'fakultas'
      ? reportType === 'ami'
        ? 'Ketua Tim Auditor AMI LPMPP'
        : `Ketua GJM ${shortenFacultyName(scopeBundle?.targetFakultas ?? program.fakultas)}`
      : reportType === 'ami'
      ? 'Ketua Tim Auditor AMI LPMPP'
      : `Ketua Program Studi ${program.nama_prodi}`;
  const rightRoleName =
    scopeLevel === 'universitas'
      ? meta.kepalaLpmppNama
      : scopeLevel === 'fakultas'
      ? reportType === 'ami'
        ? meta.ketuaAuditor
        : meta.anggotaAuditor1
      : reportType === 'ami'
      ? meta.ketuaAuditor
      : program.kaprodi_nama || '........................................';
  const rightRoleNip =
    scopeLevel === 'universitas'
      ? meta.kepalaLpmppNip
      : scopeLevel === 'fakultas'
      ? reportType === 'ami'
        ? meta.ketuaAuditorNip
        : '........................'
      : reportType === 'ami'
      ? meta.ketuaAuditorNip
      : program.kaprodi_nip || '........................';

  doc.setFont('helvetica', 'bold');
  doc.text(leftRoleTitle, margin, y + 5);
  doc.text(rightRoleTitle, pageWidth - margin, y + 5, { align: 'right' });

  doc.text(leftRoleName, margin, y + 23);
  doc.text(rightRoleName, pageWidth - margin, y + 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${leftRoleNip}`, margin, y + 27.5);
  doc.text(`NIP. ${rightRoleNip}`, pageWidth - margin, y + 27.5, { align: 'right' });

  // Page numbering footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `PPEPP UNPATTI · ${REPORT_TITLES[reportType]} · Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  const fileName = `${REPORT_FILE_PREFIX[reportType]}_${scopeFileSlug}_${cycle.tahun_siklus.replace(
    '/',
    '-'
  )}.pdf`;
  doc.save(fileName);
  return fileName;
}
