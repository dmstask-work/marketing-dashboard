// ============================================================================
// GOOGLE SHEETS REAL DATA ADAPTER (finance, closing, leads)
// ============================================================================

import { generateDummyDataset } from '../data/mockData';

const ID_MONTHS = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

// Map Sales names between finance ("MS NUR", "MS AYU", etc.) and leads/closing ("Mayang (Nur)", "Ayu", etc.)
export const SALES_NAME_MAPPING = {
  'MS NUR': { canonical: 'Mayang (Nur)', code: 'Ms NUR' },
  'MAYANG (NUR)': { canonical: 'Mayang (Nur)', code: 'Ms NUR' },
  'NUR': { canonical: 'Mayang (Nur)', code: 'Ms NUR' },
  'MS AYU': { canonical: 'Ayu', code: 'Ms AYU' },
  'AYU': { canonical: 'Ayu', code: 'Ms AYU' },
  'MS YUYUN': { canonical: 'Yuyun', code: 'Ms YUYUN' },
  'YUYUN': { canonical: 'Yuyun', code: 'Ms YUYUN' },
  'MS ARINA': { canonical: 'Arina', code: 'Ms ARINA' },
  'ARINA': { canonical: 'Arina', code: 'Ms ARINA' },
  'MS SHINTA': { canonical: 'Yuni (Shinta)', code: 'Ms SHINTA' },
  'YUNI (SHINTA)': { canonical: 'Yuni (Shinta)', code: 'Ms SHINTA' },
  'SHINTA': { canonical: 'Yuni (Shinta)', code: 'Ms SHINTA' },
  'MS PRILLY': { canonical: 'Prily (Lusy)', code: 'Ms PRILLY' },
  'PRILY (LUSY)': { canonical: 'Prily (Lusy)', code: 'Ms PRILLY' },
  'MS KEKE': { canonical: 'Keke', code: 'Ms KEKE' },
  'KEKE': { canonical: 'Keke', code: 'Ms KEKE' },
  'MS DHEA': { canonical: 'Dhea', code: 'Ms DHEA' },
  'DHEA': { canonical: 'Dhea', code: 'Ms DHEA' },
};

export function normalizeSalesIdentity(rawName) {
  const cleaned = String(rawName || '').trim().toUpperCase();
  if (!cleaned) return { canonical: 'Lainnya', code: 'OTHER' };
  if (SALES_NAME_MAPPING[cleaned]) return SALES_NAME_MAPPING[cleaned];
  return { canonical: String(rawName).trim(), code: cleaned };
}

export function parseIndoOrSlashDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  // Format 1: M/D/YYYY in finance sheet (e.g., "10/23/2026" or "1/1/2026")
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (y && m && d) {
        return {
          dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          year: y,
          month: m,
          day: d,
        };
      }
    }
  }

  // Format 2: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const clean = s.slice(0, 10);
    const [y, m, d] = clean.split('-').map((n) => parseInt(n, 10));
    return { dateStr: clean, year: y, month: m, day: d };
  }

  // Format 3: Indonesian text date ("25 Oktober 2026" or "25 Oktober 2026, 13:02:40")
  const clean = s.split(',')[0].trim();
  const tokens = clean.split(/\s+/);
  if (tokens.length >= 3) {
    const d = parseInt(tokens[0], 10);
    const m = ID_MONTHS[tokens[1].toLowerCase()];
    const y = parseInt(tokens[2], 10);
    if (d && m && y) {
      return {
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        year: y,
        month: m,
        day: d,
      };
    }
  }
  return null;
}

export function parseIDRNumber(str) {
  if (str === null || str === undefined) return 0;
  const cleaned = String(str).replace(/[^0-9-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export async function loadDashboardDataset(config = {}) {
  const { mode = 'api', forceRefresh = false } = config;

  if (mode === 'dummy') {
    return generateDummyDataset();
  }

  // Fetch from /api/dashboard (Served by Vite Middleware locally or Vercel Serverless Function)
  const endpoint = forceRefresh ? '/api/dashboard?refresh=true' : '/api/dashboard';
  const res = await fetch(endpoint);
  const rawText = await res.text();
  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch (_) {
    // Non-JSON response
  }

  if (!res.ok) {
    const detail = json?.message
      ? ` — ${json.message}`
      : rawText
      ? ` — ${rawText.slice(0, 140).replace(/\s+/g, ' ')}`
      : '';
    throw new Error(`Gagal memuat API /api/dashboard (Status ${res.status})${detail}`);
  }

  if (json && json.mode === 'google_sheets' && json.sheets) {
    return transformRealSheetsToDataset(json.sheets, json.lastUpdated);
  }

  if (json && json.mode === 'error') {
    throw new Error(json.message || 'Gagal mengambil data dari Google Sheets');
  }

  return generateDummyDataset();
}

function transformRealSheetsToDataset(sheets, lastUpdated) {
  const fallback = generateDummyDataset();

  const rawFinance = sheets.finance || [];
  const rawClosing = sheets.closing || [];
  const rawLeads = sheets.leads || [];

  // 1. Parse Finance Sheet (Skip row 0 header)
  // Columns:
  // 0: Detail Produk | 1: Tanggal | 2: Nama Klien | 3: Sesi | 4: Email/Produk | 5: Nominal
  // 6: Nama Sales | 7: KATEGORI | 8: Jenis Produk | 9: Status | 10: Jenis Layanan
  // 11: Kategori (TA / PE / NON TA) | 12: Status Pembayaran | 13: Catatan | 14: Source | 15: Marketing
  const financeRows = [];
  const serviceTypesSet = new Set();
  const statusSet = new Set();
  const salesNamesSet = new Set();

  for (let i = 1; i < rawFinance.length; i++) {
    const r = rawFinance[i];
    if (!r || r.length === 0) continue;
    const parsedDate = parseIndoOrSlashDate(r[1]);
    if (!parsedDate) continue;

    const nominal = parseIDRNumber(r[5]);
    const sesi = parseInt(r[3], 10) || 0;
    const detailProduk = String(r[0] || '').trim();
    const rawSales = String(r[6] || '').trim();
    const salesIdentity = normalizeSalesIdentity(rawSales);
    const jenisProduk = String(r[8] || r[7] || 'Lainnya').trim().toUpperCase();
    const status = String(r[9] || '').trim().toUpperCase();
    const jenisLayanan = String(r[10] || jenisProduk).trim().toUpperCase();
    const kategoriSegment = String(r[11] || detailProduk || 'TA').trim().toUpperCase();
    const source = String(r[14] || 'LANJUTAN').trim().toUpperCase();

    if (jenisLayanan && jenisLayanan.length <= 45) serviceTypesSet.add(jenisLayanan);
    if (status && status.length <= 30) statusSet.add(status);
    if (
      salesIdentity.canonical &&
      salesIdentity.canonical !== 'Lainnya' &&
      salesIdentity.canonical !== 'Dhea' &&
      salesIdentity.canonical !== 'Keke'
    ) {
      salesNamesSet.add(salesIdentity.canonical);
    }

    financeRows.push({
      id: `FIN-${i}`,
      date: parsedDate.dateStr,
      year: parsedDate.year,
      month: parsedDate.month,
      day: parsedDate.day,
      detailProduk,
      clientName: String(r[2] || '').trim(),
      sesi,
      nominal,
      rawSales,
      salesName: salesIdentity.canonical,
      salesCode: salesIdentity.code,
      kategoriDetail: String(r[7] || '').trim(),
      jenisProduk,
      status,
      jenisLayanan,
      kategoriSegment, // 'TA', 'PE', 'NON TA'
      source,
    });
  }

  // 2. Parse Closing Sheet (Skip row 0 header)
  // Columns:
  // 0: No | 1: No Invoice | 2: Kategori | 3: Email Klien | 4: Nama Klien | 5: No WhatsApp
  // 6: Psikolog | 7: Sesi | 8: Jumlah Sesi | 9: Tanggal Sesi | 10: Lokasi | 11: on-off
  // 12: Potongan | 13: Overtime | 14: Total Bayar | 15: Nominal Kuitansi | 16: Tanggal Payment
  // 17: Waktu Input | 18: Sales | 19: Tanggal Scrape
  const closingRows = [];
  for (let i = 1; i < rawClosing.length; i++) {
    const r = rawClosing[i];
    if (!r || r.length === 0) continue;

    const parsedSesiDate = parseIndoOrSlashDate(r[9]);
    const parsedInputDate = parseIndoOrSlashDate(r[17]);
    const parsedPaymentDate = parseIndoOrSlashDate(r[16]) || parsedInputDate || parsedSesiDate;
    const rawPsikolog = String(r[6] || '').trim();

    // Clean psychologist display name (e.g., "Toetiek Septriasih, M.Psi., Psikolog" -> "Toetiek Septriasih")
    const shortPsikolog = rawPsikolog ? rawPsikolog.split(',')[0].trim() : '';
    const jumlahSesi = parseInt(r[8], 10) || 1;
    const rawMode = String(r[11] || 'online').trim().toLowerCase();
    const sessionMode = rawMode.includes('off') ? 'OFF' : 'ON';
    const totalBayar = parseIDRNumber(r[14]);
    const salesIdentity = normalizeSalesIdentity(r[18]);

    closingRows.push({
      id: `CLS-${i}`,
      invoice: String(r[1] || '').trim(),
      kategori: String(r[2] || 'SOP').trim(),
      clientName: String(r[4] || '').trim(),
      psikologFull: rawPsikolog,
      psikologName: shortPsikolog,
      sesiProduk: String(r[7] || '').trim(),
      jumlahSesi,
      sesiDate: parsedSesiDate ? parsedSesiDate.dateStr : null,
      sesiYear: parsedSesiDate ? parsedSesiDate.year : null,
      sesiMonth: parsedSesiDate ? parsedSesiDate.month : null,
      inputDate: parsedInputDate ? parsedInputDate.dateStr : null,
      inputYear: parsedInputDate ? parsedInputDate.year : null,
      inputMonth: parsedInputDate ? parsedInputDate.month : null,
      paymentDate: parsedPaymentDate ? parsedPaymentDate.dateStr : null,
      paymentYear: parsedPaymentDate ? parsedPaymentDate.year : null,
      paymentMonth: parsedPaymentDate ? parsedPaymentDate.month : null,
      sessionMode,
      totalBayar,
      salesName: salesIdentity.canonical,
    });
  }

  // 3. Parse Leads Sheet (Skip row 0 header)
  // Columns:
  // 0: No | 1: Tanggal Leads | 2: Source | 3: Sales | 4: Nama Lengkap | 5: No WhatsApp
  // 6: Produk | 7: Stop Stage | 8: Catatan | 9: Status Closing | 10: Total Broadcast | 11: Last Broadcast
  const leadsRows = [];
  for (let i = 1; i < rawLeads.length; i++) {
    const r = rawLeads[i];
    if (!r || r.length === 0) continue;
    const parsedDate = parseIndoOrSlashDate(r[1]);
    if (!parsedDate) continue;

    const salesIdentity = normalizeSalesIdentity(r[3]);
    if (
      salesIdentity.canonical &&
      salesIdentity.canonical !== 'Lainnya' &&
      salesIdentity.canonical !== 'Dhea' &&
      salesIdentity.canonical !== 'Keke'
    ) {
      salesNamesSet.add(salesIdentity.canonical);
    }

    leadsRows.push({
      id: `LDS-${i}`,
      date: parsedDate.dateStr,
      year: parsedDate.year,
      month: parsedDate.month,
      day: parsedDate.day,
      source: String(r[2] || '').trim().toUpperCase(),
      salesName: salesIdentity.canonical,
      produk: String(r[6] || '').trim(),
      statusClosing: String(r[9] || '').trim(),
    });
  }

  return {
    mode: 'google_sheets',
    lastUpdated: lastUpdated || new Date().toISOString(),
    financeRows,
    closingRows,
    leadsRows,
    filterOptions: {
      serviceTypes: [...serviceTypesSet].sort(),
      statuses: [...statusSet].sort(),
      salesNames: [...salesNamesSet].sort(),
    },
    // Keep static cohortMonthly & targets from fallback as requested
    cohortMonthly: fallback.cohortMonthly,
    multiYearAnnual: fallback.multiYearAnnual,
    targets: fallback.targets,
    transactions: fallback.transactions,
  };
}
