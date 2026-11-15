import {
  OverallAmiRecap,
  SpmiReportType,
  StandardRecap,
} from '../types/ami';
import { PpeppStatsData } from './spmiReportDefaults';
import { SpmiStatisticalSummary } from './spmiStatistics';
import { AggregatedSpmiBundle } from './spmiAggregateReport';

export interface RenderedChartImage {
  title: string;
  caption: string;
  dataUrl: string;
  bytes: Uint8Array;
  widthPx: number;
  heightPx: number;
}

function createHiResCanvas(w = 1360, h = 600): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  // Subtle frame border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  return { canvas, ctx };
}

function canvasToChartImage(
  canvas: HTMLCanvasElement,
  title: string,
  caption: string
): RenderedChartImage {
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const base64 = dataUrl.split(',')[1] ?? '';
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return {
    title,
    caption,
    dataUrl,
    bytes,
    widthPx: canvas.width,
    heightPx: canvas.height,
  };
}

function drawChartHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  title: string,
  subtitle: string
) {
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 44, 46);

  ctx.fillStyle = '#475569';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(subtitle, 44, 74);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(44, 90);
  ctx.lineTo(w - 44, 90);
  ctx.stroke();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  startX: number,
  y: number
) {
  let x = startX;
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x, y - 14, 18, 16);
    ctx.fillStyle = '#1E293B';
    ctx.fillText(it.label, x + 26, y);
    x += ctx.measureText(it.label).width + 64;
  });
}

function shortStdLabel(id: number, nama: string): string {
  const clean = nama.replace(/^Standar\s+/i, '');
  const trimmed = clean.length > 15 ? clean.slice(0, 14) + '…' : clean;
  return `S${id}. ${trimmed}`;
}

/* ============================================================================
 * 1. AMI CHARTS: (A) Capaian vs Target 10 Standar  (B) Distribusi Temuan
 * ============================================================================ */

function renderAmiCapaianVsTarget(
  recaps: StandardRecap[],
  overall: OverallAmiRecap
): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Grafik Capaian vs Target Mutu 10 Standar SPMI (Skala 0–100)',
    `Garis putus-putus menunjukkan Rata-rata Terbobot AMI (${overall.rataRataCapaianTerbobot.toFixed(
      2
    )})`
  );

  drawLegend(
    ctx,
    [
      { label: 'Nilai Capaian (0–100)', color: '#1E3A8A' },
      { label: 'Nilai Target 1 Th yad', color: '#D97706' },
      { label: `Rata-rata Terbobot (${overall.rataRataCapaianTerbobot.toFixed(1)})`, color: '#DC2626' },
    ],
    44,
    126
  );

  const plotL = 90;
  const plotR = W - 46;
  const plotT = 152;
  const plotB = H - 96;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  // Grid lines 0..100 step 20
  ctx.font = '15px monospace';
  ctx.textAlign = 'right';
  for (let v = 0; v <= 100; v += 20) {
    const yy = plotB - (v / 100) * plotH;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(plotL, yy);
    ctx.lineTo(plotR, yy);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), plotL - 12, yy + 5);
  }

  // Bars
  const groupW = plotW / Math.max(1, recaps.length);
  const barW = Math.min(34, groupW * 0.34);

  recaps.forEach((r, idx) => {
    const cx = plotL + idx * groupW + groupW / 2;
    const hCap = (r.nilaiCapaian / 100) * plotH;
    const hTar = (r.nilaiTarget / 100) * plotH;

    // Capaian bar
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(cx - barW - 3, plotB - hCap, barW, hCap);
    // Target bar
    ctx.fillStyle = '#D97706';
    ctx.fillRect(cx + 3, plotB - hTar, barW, hTar);

    // Value labels above bars
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(r.nilaiCapaian.toFixed(1), cx - barW / 2 - 3, plotB - hCap - 8);
    ctx.fillStyle = '#92400E';
    ctx.fillText(r.nilaiTarget.toFixed(1), cx + barW / 2 + 3, plotB - hTar - 8);

    // X-axis label (2 lines)
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`Standar ${r.standardId}`, cx, plotB + 24);
    const shortTxt = r.nama.replace(/^Standar\s+/i, '').slice(0, 14);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(shortTxt, cx, plotB + 44);
  });

  // Reference dashed line for Rata-rata Terbobot
  const avgY = plotB - (overall.rataRataCapaianTerbobot / 100) * plotH;
  ctx.save();
  ctx.setLineDash([10, 6]);
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(plotL, avgY);
  ctx.lineTo(plotR, avgY);
  ctx.stroke();
  ctx.restore();

  return canvasToChartImage(
    canvas,
    'Gambar 3.1 Perbandingan Nilai Capaian vs Target per Standar SPMI',
    `Profil ketercapaian 10 Standar SPMI terhadap target 1 tahun ke depan dengan garis acuan rata-rata terbobot ${overall.rataRataCapaianTerbobot.toFixed(2)}.`
  );
}

function renderAmiTemuanDistribution(
  recaps: StandardRecap[]
): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Distribusi Kategori Temuan Audit per Standar SPMI',
    'Komposisi butir indikator: Mayor, Minor, Observasi, Sesuai (Baik), dan Best Practice'
  );

  drawLegend(
    ctx,
    [
      { label: 'Mayor', color: '#DC2626' },
      { label: 'Minor', color: '#EA580C' },
      { label: 'Observasi', color: '#D97706' },
      { label: 'Sesuai (Baik)', color: '#16A34A' },
      { label: 'Best Practice', color: '#0284C7' },
    ],
    44,
    126
  );

  const plotL = 230;
  const plotR = W - 64;
  const plotT = 152;
  const plotB = H - 56;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const maxTotal = Math.max(
    1,
    ...recaps.map((r) => r.indicatorCount)
  );
  const stepX = Math.max(1, Math.ceil(maxTotal / 5));

  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  for (let v = 0; v <= maxTotal; v += stepX) {
    const xx = plotL + (v / maxTotal) * plotW;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xx, plotT);
    ctx.lineTo(xx, plotB);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), xx, plotB + 24);
  }

  const rowH = plotH / Math.max(1, recaps.length);
  const barH = Math.min(28, rowH * 0.65);

  recaps.forEach((r, idx) => {
    const cy = plotT + idx * rowH + rowH / 2;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortStdLabel(r.standardId, r.nama), plotL - 14, cy + 5);

    const segments = [
      { val: r.counts.Mayor, color: '#DC2626' },
      { val: r.counts.Minor, color: '#EA580C' },
      { val: r.counts.Observasi, color: '#D97706' },
      { val: r.counts['Sesuai (Baik)'], color: '#16A34A' },
      { val: r.counts['Best Practice'], color: '#0284C7' },
    ];

    let curX = plotL;
    segments.forEach((seg) => {
      if (seg.val <= 0) return;
      const segW = (seg.val / maxTotal) * plotW;
      ctx.fillStyle = seg.color;
      ctx.fillRect(curX, cy - barH / 2, segW, barH);
      if (segW >= 20) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(seg.val), curX + segW / 2, cy + 5);
      }
      curX += segW;
    });

    ctx.fillStyle = '#475569';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${r.indicatorCount} ind.`, curX + 8, cy + 5);
  });

  return canvasToChartImage(
    canvas,
    'Gambar 3.2 Peta Distribusi Kategori Temuan Audit per Standar',
    'Sebaran temuan ketidaksesuaian (Mayor, Minor, Observasi), kepatuhan (Sesuai Baik), dan pelampauan standar (Best Practice).'
  );
}

/* ============================================================================
 * 2. RTM CHARTS: (A) Ranking Gap Prioritas  (B) Kesiapan Status PTK & Mutu
 * ============================================================================ */

function renderRtmGapPriority(stats: SpmiStatisticalSummary): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Diagram Prioritas Intervensi RTM Berdasarkan Besaran Gap (Target − Capaian)',
    `Standar diurutkan dari deviasi tertinggi hingga terendah · Mean Gap = ${stats.meanGap.toFixed(
      2
    )} poin`
  );

  drawLegend(
    ctx,
    [
      { label: 'Prioritas Tinggi (Gap >= 15)', color: '#DC2626' },
      { label: 'Prioritas Sedang (Gap 8–14.9)', color: '#D97706' },
      { label: 'Terkendali (Gap < 8)', color: '#1E3A8A' },
    ],
    44,
    126
  );

  const items = stats.standardGapRanking;
  const plotL = 240;
  const plotR = W - 90;
  const plotT = 152;
  const plotB = H - 54;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const maxGap = Math.max(20, ...items.map((x) => Math.max(0, x.gap)));
  const niceMax = Math.ceil(maxGap / 5) * 5;

  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  for (let v = 0; v <= niceMax; v += Math.max(5, Math.round(niceMax / 5))) {
    const xx = plotL + (v / niceMax) * plotW;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xx, plotT);
    ctx.lineTo(xx, plotB);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), xx, plotB + 24);
  }

  const rowH = plotH / Math.max(1, items.length);
  const barH = Math.min(28, rowH * 0.65);

  items.forEach((item, idx) => {
    const cy = plotT + idx * rowH + rowH / 2;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortStdLabel(item.standardId, item.nama), plotL - 14, cy + 5);

    const safeGap = Math.max(0, item.gap);
    const w = (safeGap / niceMax) * plotW;
    ctx.fillStyle =
      item.urgency === 'Prioritas Tinggi'
        ? '#DC2626'
        : item.urgency === 'Prioritas Sedang'
        ? '#D97706'
        : '#1E3A8A';
    ctx.fillRect(plotL, cy - barH / 2, w, barH);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Δ ${item.gap.toFixed(1)} (${item.ktsCount} KTS)`,
      plotL + w + 10,
      cy + 5
    );
  });

  return canvasToChartImage(
    canvas,
    'Gambar 3.1 Peringkat Gap Kesenjangan Mutu untuk Prioritas Keputusan RTM',
    `Identifikasi standar dengan kesenjangan target tertinggi (${stats.maxGapStandardName}, Δ = ${stats.maxGap.toFixed(2)}) sebagai dasar alokasi sumber daya RTM.`
  );
}

function renderRtmPtkReadiness(stats: SpmiStatisticalSummary): RenderedChartImage {
  const W = 1360;
  const H = 560;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Profil Kepatuhan Mutu & Status Penyelesaian PTK/RTL',
    `Tingkat Kepatuhan: ${stats.complianceRatePct}% · Kelengkapan Rencana PTK: ${stats.ptkPlanCompletenessPct}% · Closure Rate: ${stats.ptkClosureRatePct}%`
  );

  const metrics = [
    { label: 'Kepatuhan (Sesuai + Best Practice)', value: stats.compliantCount, color: '#16A34A' },
    { label: 'PTK Closed - Verified', value: stats.ptkClosedCount, color: '#0284C7' },
    { label: 'PTK In Progress', value: stats.ptkInProgressCount, color: '#D97706' },
    { label: 'PTK Open (Perlu Tindak Lanjut)', value: stats.ptkOpenCount, color: '#DC2626' },
  ];

  const maxV = Math.max(10, ...metrics.map((m) => m.value));
  const plotL = 370;
  const plotR = W - 110;
  const plotT = 136;
  const plotB = H - 70;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  ctx.font = '15px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const val = Math.round((maxV / 5) * i);
    const xx = plotL + (i / 5) * plotW;
    ctx.strokeStyle = i === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xx, plotT);
    ctx.lineTo(xx, plotB);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(val), xx, plotB + 26);
  }

  const rowH = plotH / metrics.length;
  const barH = 44;

  metrics.forEach((m, idx) => {
    const cy = plotT + idx * rowH + rowH / 2;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(m.label, plotL - 18, cy + 6);

    const w = (m.value / maxV) * plotW;
    ctx.fillStyle = m.color;
    ctx.fillRect(plotL, cy - barH / 2, w, barH);

    const pct = ((m.value / Math.max(1, stats.nIndicators)) * 100).toFixed(1);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${m.value} ind. (${pct}%)`, plotL + w + 14, cy + 6);
  });

  return canvasToChartImage(
    canvas,
    'Gambar 3.2 Distribusi Kepatuhan Standar dan Kesiapan Penyelesaian PTK',
    `Komposisi status seluruh ${stats.nIndicators} indikator mutu sebagai bahan pengambilan kebijakan pengendalian pada RTM.`
  );
}

/* ============================================================================
 * 3. PPEPP CHARTS: (A) Radar 5 Tahap PPEPP  (B) Tren Antar Siklus
 * ============================================================================ */

function renderPpeppRadar(ppeppStats: PpeppStatsData): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Diagram Radar Efektivitas 5 Tahapan Siklus PPEPP',
    `Indeks Komposit: ${ppeppStats.indeks}% (${ppeppStats.label}) vs Ambang Batas Efektif (70%) & Sangat Efektif (85%)`
  );

  const cx = 460;
  const cy = 355;
  const radius = 195;

  const stages = [
    { label: `P1 Penetapan (${ppeppStats.penetapan}%)`, val: ppeppStats.penetapan },
    { label: `P2 Pelaksanaan (${ppeppStats.pelaksanaan}%)`, val: ppeppStats.pelaksanaan },
    { label: `E Evaluasi (${ppeppStats.evaluasi}%)`, val: ppeppStats.evaluasi },
    { label: `P3 Pengendalian (${ppeppStats.pengendalian}%)`, val: ppeppStats.pengendalian },
    { label: `P4 Peningkatan (${ppeppStats.peningkatan}%)`, val: ppeppStats.peningkatan },
  ];

  const getPoint = (idx: number, pct: number) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
    const r = (pct / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
  };

  // Concentric pentagons (20..100)
  [20, 40, 60, 80, 100].forEach((lvl) => {
    ctx.strokeStyle = lvl === 100 ? '#94A3B8' : '#E2E8F0';
    ctx.lineWidth = lvl === 100 ? 1.8 : 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const p = getPoint(i, lvl);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${lvl}%`, cx, cy - (lvl / 100) * radius - 4);
  });

  // 70% threshold pentagon
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const p = getPoint(i, 70);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Axes & labels
  stages.forEach((st, i) => {
    const pOuter = getPoint(i, 100);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pOuter.x, pOuter.y);
    ctx.stroke();

    const pLbl = getPoint(i, 122);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign =
      Math.abs(pLbl.x - cx) < 20
        ? 'center'
        : pLbl.x > cx
        ? 'left'
        : 'right';
    ctx.fillText(st.label, pLbl.x, pLbl.y + 5);
  });

  // Actual PPEPP polygon
  ctx.fillStyle = 'rgba(30, 58, 138, 0.22)';
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  stages.forEach((st, i) => {
    const p = getPoint(i, st.val);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  stages.forEach((st, i) => {
    const p = getPoint(i, st.val);
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Right-side scorecard summary
  const boxX = 860;
  let boxY = 170;
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.fillRect(boxX, boxY, 440, 330);
  ctx.strokeRect(boxX, boxY, 440, 330);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 19px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Ringkasan Kinerja Siklus PPEPP', boxX + 24, boxY + 38);

  boxY += 68;
  stages.forEach((st) => {
    ctx.fillStyle = '#334155';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(st.label.split(' (')[0], boxX + 24, boxY);

    // Mini bar
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(boxX + 185, boxY - 14, 165, 14);
    ctx.fillStyle = st.val >= 80 ? '#16A34A' : st.val >= 65 ? '#1E3A8A' : '#D97706';
    ctx.fillRect(boxX + 185, boxY - 14, (st.val / 100) * 165, 14);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${st.val}%`, boxX + 414, boxY);
    boxY += 42;
  });

  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Indeks Komposit: ${ppeppStats.indeks}%`, boxX + 24, boxY + 18);

  return canvasToChartImage(
    canvas,
    'Gambar 3.1 Grafik Radar Keseimbangan 5 Tahap Siklus PPEPP',
    `Profil efektivitas Penetapan (${ppeppStats.penetapan}%), Pelaksanaan (${ppeppStats.pelaksanaan}%), Evaluasi (${ppeppStats.evaluasi}%), Pengendalian (${ppeppStats.pengendalian}%), dan Peningkatan (${ppeppStats.peningkatan}%).`
  );
}

function renderPpeppCycleTrend(
  stats: SpmiStatisticalSummary
): RenderedChartImage {
  const W = 1360;
  const H = 600;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Tren Capaian Mutu & Efektivitas Penyelesaian PTK Antar Siklus PPEPP',
    'Evaluasi konsistensi peningkatan kualitas mutu program studi lintas siklus akademik'
  );

  drawLegend(
    ctx,
    [
      { label: 'Capaian Mutu (0–100)', color: '#1E3A8A' },
      { label: 'Target Mutu (0–100)', color: '#D97706' },
      { label: 'Efektivitas PTK (%)', color: '#16A34A' },
    ],
    44,
    126
  );

  const pts = stats.cycleTrend;
  const plotL = 90;
  const plotR = W - 50;
  const plotT = 152;
  const plotB = H - 80;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  ctx.font = '15px monospace';
  ctx.textAlign = 'right';
  for (let v = 0; v <= 100; v += 20) {
    const yy = plotB - (v / 100) * plotH;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(plotL, yy);
    ctx.lineTo(plotR, yy);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), plotL - 12, yy + 5);
  }

  const groupW = plotW / Math.max(1, pts.length);
  const barW = Math.min(44, groupW * 0.28);

  const linePoints: { x: number; y: number; val: number }[] = [];

  pts.forEach((pt, idx) => {
    const cx = plotL + idx * groupW + groupW / 2;
    const hCap = (pt.capaian / 100) * plotH;
    const hTar = (pt.target / 100) * plotH;

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(cx - barW - 4, plotB - hCap, barW, hCap);
    ctx.fillStyle = '#D97706';
    ctx.fillRect(cx + 4, plotB - hTar, barW, hTar);

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(pt.capaian.toFixed(1), cx - barW / 2 - 4, plotB - hCap - 8);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(pt.siklus, cx, plotB + 28);

    linePoints.push({
      x: cx,
      y: plotB - (pt.efektivitasPtk / 100) * plotH,
      val: pt.efektivitasPtk,
    });
  });

  if (linePoints.length > 0) {
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    linePoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    linePoints.forEach((p) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#15803D';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.val}%`, p.x, p.y - 14);
    });
  }

  return canvasToChartImage(
    canvas,
    'Gambar 3.2 Analisis Tren Kinerja Mutu & Efektivitas PTK Antar Siklus',
    'Perkembangan longitudinal rata-rata capaian standar terhadap target mutu serta persentase penutupan PTK lintas siklus PPEPP.'
  );
}

/* ============================================================================
 * 4. PERBAIKAN & PENINGKATAN CHARTS
 * ============================================================================ */

function renderPerbaikanMonevChart(
  stats: SpmiStatisticalSummary
): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Progres Verifikasi Tindakan Koreksi (Monev PTK/RTL) per Standar',
    `Tingkat Penutupan (Closure Rate): ${stats.ptkClosureRatePct}% · Indeks Reduksi Risiko KTS: ${stats.riskReductionIndexPct}%`
  );

  drawLegend(
    ctx,
    [
      { label: 'Closed - Verified', color: '#16A34A' },
      { label: 'In Progress', color: '#D97706' },
      { label: 'Open (Belum Selesai)', color: '#DC2626' },
    ],
    44,
    126
  );

  const items = stats.standardMonevBreakdown;
  const plotL = 230;
  const plotR = W - 80;
  const plotT = 152;
  const plotB = H - 56;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  const maxKts = Math.max(3, ...items.map((i) => i.totalKts));

  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  for (let v = 0; v <= maxKts; v++) {
    const xx = plotL + (v / maxKts) * plotW;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xx, plotT);
    ctx.lineTo(xx, plotB);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), xx, plotB + 24);
  }

  const rowH = plotH / Math.max(1, items.length);
  const barH = Math.min(28, rowH * 0.65);

  items.forEach((item, idx) => {
    const cy = plotT + idx * rowH + rowH / 2;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortStdLabel(item.standardId, item.nama), plotL - 14, cy + 5);

    if (item.totalKts === 0) {
      ctx.fillStyle = '#16A34A';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('100% Sesuai (Nihil KTS)', plotL + 10, cy + 5);
      return;
    }

    const segs = [
      { val: item.closedCount, color: '#16A34A' },
      { val: item.inProgressCount, color: '#D97706' },
      { val: item.openCount, color: '#DC2626' },
    ];

    let curX = plotL;
    segs.forEach((s) => {
      if (s.val <= 0) return;
      const w = (s.val / maxKts) * plotW;
      ctx.fillStyle = s.color;
      ctx.fillRect(curX, cy - barH / 2, w, barH);
      if (w >= 24) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.val), curX + w / 2, cy + 5);
      }
      curX += w;
    });

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.closurePct}% closed`, curX + 10, cy + 5);
  });

  return canvasToChartImage(
    canvas,
    'Gambar 3.1 Status Pengendalian Standar dan Verifikasi Monev PTK',
    'Proporsi temuan ketidaksesuaian yang telah diverifikasi tuntas (Closed), sedang berjalan, maupun masih terbuka pada setiap standar.'
  );
}

function renderPeningkatanRoadmapChart(
  recaps: StandardRecap[]
): RenderedChartImage {
  const W = 1360;
  const H = 610;
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    'Peta Peningkatan Standar Berkelanjutan (Continuous Quality Improvement)',
    'Perbandingan Capaian Siklus Berjalan, Target Saat Ini, dan Proyeksi Target Peningkatan Standar Baru'
  );

  drawLegend(
    ctx,
    [
      { label: 'Capaian Saat Ini', color: '#1E3A8A' },
      { label: 'Target Siklus Ini', color: '#D97706' },
      { label: 'Proyeksi Target Peningkatan (CQI)', color: '#059669' },
    ],
    44,
    126
  );

  const plotL = 90;
  const plotR = W - 46;
  const plotT = 152;
  const plotB = H - 96;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  ctx.font = '15px monospace';
  ctx.textAlign = 'right';
  for (let v = 0; v <= 100; v += 20) {
    const yy = plotB - (v / 100) * plotH;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(plotL, yy);
    ctx.lineTo(plotR, yy);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), plotL - 12, yy + 5);
  }

  const groupW = plotW / Math.max(1, recaps.length);
  const barW = Math.min(26, groupW * 0.25);

  recaps.forEach((r, idx) => {
    const cx = plotL + idx * groupW + groupW / 2;
    const upgradedTarget = Math.min(100, Number((Math.max(r.nilaiCapaian, r.nilaiTarget) + 5).toFixed(1)));

    const h1 = (r.nilaiCapaian / 100) * plotH;
    const h2 = (r.nilaiTarget / 100) * plotH;
    const h3 = (upgradedTarget / 100) * plotH;

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(cx - barW * 1.5 - 3, plotB - h1, barW, h1);

    ctx.fillStyle = '#D97706';
    ctx.fillRect(cx - barW * 0.5, plotB - h2, barW, h2);

    ctx.fillStyle = '#059669';
    ctx.fillRect(cx + barW * 0.5 + 3, plotB - h3, barW, h3);

    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(upgradedTarget.toFixed(0), cx + barW + 3, plotB - h3 - 8);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(`Standar ${r.standardId}`, cx, plotB + 24);
    const shortTxt = r.nama.replace(/^Standar\s+/i, '').slice(0, 14);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(shortTxt, cx, plotB + 44);
  });

  return canvasToChartImage(
    canvas,
    'Gambar 4.1 Roadmap Peningkatan Target Mutu 10 Standar SPMI',
    'Visualisasi pelampauan target mutu berkelanjutan dari baseline capaian siklus berjalan menuju target peningkatan baru.'
  );
}

export function renderChartsForReport(params: {
  reportType: SpmiReportType;
  recaps: StandardRecap[];
  overall: OverallAmiRecap;
  ppeppStats: PpeppStatsData;
  stats: SpmiStatisticalSummary;
}): [RenderedChartImage, RenderedChartImage] {
  const { reportType, recaps, overall, ppeppStats, stats } = params;
  switch (reportType) {
    case 'ami':
      return [
        renderAmiCapaianVsTarget(recaps, overall),
        renderAmiTemuanDistribution(recaps),
      ];
    case 'rtm':
      return [
        renderRtmGapPriority(stats),
        renderRtmPtkReadiness(stats),
      ];
    case 'efektivitas_ppepp':
      return [
        renderPpeppRadar(ppeppStats),
        renderPpeppCycleTrend(stats),
      ];
    case 'perbaikan_peningkatan':
      return [
        renderPerbaikanMonevChart(stats),
        renderPeningkatanRoadmapChart(recaps),
      ];
  }
}

export function renderUnitComparisonChart(
  bundle: AggregatedSpmiBundle
): RenderedChartImage | null {
  if (bundle.scopeLevel === 'prodi') return null;

  const isUniv = bundle.scopeLevel === 'universitas';
  const rows = isUniv
    ? bundle.facultyRows.map((f) => ({
        label: f.shortFakultas,
        skorAmi: f.meanSkorAmi,
        indeksPpepp: f.meanIndeksPpepp,
        kualitas: f.meanIndeksKualitas,
      }))
    : bundle.prodiRows.slice(0, 16).map((p) => ({
        label:
          p.program.nama_prodi.length > 22
            ? p.program.nama_prodi.slice(0, 20) + '…'
            : p.program.nama_prodi,
        skorAmi: p.skorAmiTerbobot,
        indeksPpepp: p.indeksPpepp,
        kualitas: p.skorIndeksKualitas,
      }));

  if (rows.length === 0) return null;

  const W = 1360;
  const H = Math.max(540, 190 + rows.length * 36);
  const { canvas, ctx } = createHiResCanvas(W, H);

  drawChartHeader(
    ctx,
    W,
    isUniv
      ? 'Komparasi Skor AMI & Indeks PPEPP per Fakultas / Pascasarjana / PSDKU'
      : `Komparasi Kinerja Mutu Antar Program Studi (${bundle.targetFakultas})`,
    isUniv
      ? `Agregasi ${bundle.programCount} Program Studi pada ${bundle.facultyCount} unit Fakultas/Pascasarjana/PSDKU`
      : `Menampilkan ${rows.length} dari ${bundle.programCount} Program Studi diurutkan berdasarkan Indeks Kualitas`
  );

  drawLegend(
    ctx,
    [
      { label: 'Skor AMI Terbobot', color: '#1E3A8A' },
      { label: 'Indeks PPEPP (%)', color: '#059669' },
    ],
    44,
    126
  );

  const plotL = 290;
  const plotR = W - 72;
  const plotT = 152;
  const plotB = H - 52;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  for (let v = 0; v <= 100; v += 20) {
    const xx = plotL + (v / 100) * plotW;
    ctx.strokeStyle = v === 0 ? '#64748B' : '#E2E8F0';
    ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xx, plotT);
    ctx.lineTo(xx, plotB);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(String(v), xx, plotB + 22);
  }

  const rowH = plotH / rows.length;
  const barH = Math.min(13, rowH * 0.34);

  rows.forEach((row, idx) => {
    const cy = plotT + idx * rowH + rowH / 2;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.label, plotL - 14, cy + 5);

    const w1 = (Math.min(100, row.skorAmi) / 100) * plotW;
    const w2 = (Math.min(100, row.indeksPpepp) / 100) * plotW;

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(plotL, cy - barH - 1, w1, barH);

    ctx.fillStyle = '#059669';
    ctx.fillRect(plotL, cy + 1, w2, barH);

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1E3A8A';
    ctx.fillText(row.skorAmi.toFixed(1), plotL + w1 + 8, cy - 2);
    ctx.fillStyle = '#065F46';
    ctx.fillText(row.indeksPpepp.toFixed(1), plotL + w2 + 8, cy + barH + 1);
  });

  return canvasToChartImage(
    canvas,
    isUniv
      ? 'Gambar 3.3 Peta Komparasi Kinerja Mutu Antar Fakultas / Pascasarjana / PSDKU'
      : `Gambar 3.3 Peta Komparasi Kinerja Mutu Antar Program Studi di ${bundle.targetFakultas}`,
    `Rata-rata skor antar unit = ${bundle.crossUnitStats.meanSkor.toFixed(
      2
    )} ± ${bundle.crossUnitStats.sdSkor.toFixed(
      2
    )} (CV = ${bundle.crossUnitStats.cvPct.toFixed(2)}%).`
  );
}
