// ============================================================================
// REALTIME ANALYTICS & CROSS-PERIOD ENGINE (REAL GOOGLE SHEETS + DUMMY SUPPORT)
// ============================================================================

import {
  getMonthShortName,
  getMonthFullName,
  PRODUCTS,
  SALES_TEAM,
  MITRA_AHLI,
  LEAD_SOURCES,
  MULTI_YEAR_ANNUAL,
  COHORT_MONTHLY_DATA,
  CAPACITY_MONTHLY_DATA,
  MONTHLY_SOP_TA_SERIES,
  SALES_MONTHLY_STACK_DATA,
} from '../data/mockData';

// Metabase Modern UI Palette
export const CLAY_THEME_COLORS = {
  blue: '#509EE3',
  indigo: '#7172AD',
  green: '#84BB4C',
  coral: '#EF8C86',
  teal: '#88D2D6',
  lavender: '#A989C5',
  amber: '#F9D45C',
  slate: '#94A3B8',
  sage: '#509EE3',
  sand: '#84BB4C',
  terracotta: '#EF8C86',
};

export const HARMONIOUS_SERIES_PALETTE = [
  '#509EE3',
  '#88D2D6',
  '#7172AD',
  '#84BB4C',
  '#A989C5',
  '#EF8C86',
  '#F9D45C',
  '#64B5F6',
  '#94A3B8',
  '#CBD5E1',
];

export const DEFAULT_TARGET_CONFIG = {
  targetBulananAll: 320000000,
  targetPersentaseLeads: 15,
  targetTA: 180000000,
};

export function formatIDR(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (compact) {
    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toFixed(2).replace('.', ',')}M`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}jt`;
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toFixed(1).replace('.', ',')}rb`;
    }
  }

  return (
    sign +
    'Rp ' +
    Math.round(abs)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

export function formatGapIDR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2).replace('.', ',')}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1).replace('.', ',')}rb`;
  }
  return `${sign}Rp ${Math.round(abs)}`;
}

export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPct(val, showPlus = false, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  const rounded = Number(val).toFixed(decimals);
  const prefix = showPlus && val > 0 ? '+' : '';
  return `${prefix}${rounded}%`;
}

export function getPreviousMonthDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  const curMonth = end.getMonth() + 1;
  const curYear = end.getFullYear();

  const prevMonthDate = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;
  const maxDaysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  const prevStartDay = Math.min(start.getDate(), maxDaysInPrevMonth);
  const prevEndDay = Math.min(end.getDate(), maxDaysInPrevMonth);

  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevStartDay).padStart(2, '0')}`;
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevEndDay).padStart(2, '0')}`;

  return {
    curMonth,
    curYear,
    currentMonthName: getMonthFullName(curMonth),
    currentMonthShort: getMonthShortName(curMonth),
    prevStart,
    prevEnd,
    prevMonth,
    prevYear,
    prevMonthName: getMonthFullName(prevMonth),
    prevMonthShort: getMonthShortName(prevMonth),
  };
}

export function computeGrowthPct(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ============================================================================
// 1. MARKETING DASHBOARD ANALYTICS
// ============================================================================
export function computeMarketingAnalytics(dataset, filters, targetConfig = DEFAULT_TARGET_CONFIG) {
  if (dataset.mode === 'google_sheets' && dataset.financeRows?.length > 0) {
    return computeRealMarketingAnalytics(dataset, filters, targetConfig);
  }
  return computeDummyMarketingAnalytics(dataset, filters, targetConfig);
}

function computeRealMarketingAnalytics(dataset, filters, targetConfig) {
  const {
    startDate = '2026-10-01',
    endDate = '2026-10-25',
    serviceType = 'ALL',
    statusTerjual = 'ALL',
    salesName = 'ALL',
    trendGranularity = 'daily',
  } = filters;

  const {
    curYear,
    currentMonthName,
    currentMonthShort,
    prevStart,
    prevEnd,
    prevMonthName,
    prevMonthShort,
  } = getPreviousMonthDateRange(startDate, endDate);

  const targetMonthly = Number(targetConfig.targetTA) || 180000000;
  const targetBulananAll = Number(targetConfig.targetBulananAll) || 320000000;
  const targetLeadsPct = Number(targetConfig.targetPersentaseLeads) || 15;
  const targetAnnual = dataset.targets?.annualTargetMarketing || 2295000000;

  // Marketing Dashboard evaluates TA segment transactions from finance sheet
  const matchFinanceFilter = (row) => {
    const isTA = row.kategoriSegment === 'TA' || row.detailProduk === 'TA';
    if (!isTA) return false;
    const matchService =
      serviceType === 'ALL' ||
      row.jenisLayanan === serviceType ||
      row.jenisProduk === serviceType;
    const matchSales = salesName === 'ALL' || row.salesName === salesName;
    const matchStatus =
      statusTerjual === 'ALL' ||
      statusTerjual === 'Terjual' ||
      row.status === statusTerjual;
    return matchService && matchSales && matchStatus;
  };

  const curRows = dataset.financeRows.filter(
    (r) => r.date >= startDate && r.date <= endDate && matchFinanceFilter(r)
  );
  const prevRows = dataset.financeRows.filter(
    (r) => r.date >= prevStart && r.date <= prevEnd && matchFinanceFilter(r)
  );
  const annualRows = dataset.financeRows.filter(
    (r) =>
      r.date >= `${curYear}-01-01` &&
      r.date <= endDate &&
      (r.kategoriSegment === 'TA' || r.detailProduk === 'TA') &&
      (serviceType === 'ALL' || r.jenisLayanan === serviceType) &&
      (salesName === 'ALL' || r.salesName === salesName)
  );

  // KPI 1, 2, 3: Nominal MTD, Sesi MTD, Ticket Size MTD
  const revenueMTD = curRows.reduce((s, r) => s + r.nominal, 0);
  const revenueLastMTD = prevRows.reduce((s, r) => s + r.nominal, 0);
  const revenueGrowthPct = computeGrowthPct(revenueMTD, revenueLastMTD);

  const sesiMTD = curRows.reduce((s, r) => s + r.sesi, 0);
  const sesiLastMTD = prevRows.reduce((s, r) => s + r.sesi, 0);
  const sesiGrowthPct = computeGrowthPct(sesiMTD, sesiLastMTD);

  const ticketSizeMTD = sesiMTD > 0 ? Math.round(revenueMTD / sesiMTD) : 0;
  const ticketSizeLastMTD = sesiLastMTD > 0 ? Math.round(revenueLastMTD / sesiLastMTD) : 0;
  const ticketSizeGrowthPct = computeGrowthPct(ticketSizeMTD, ticketSizeLastMTD);

  // KPI 4, 5, 6: Target TA, GAP Revenue, Annual YTD
  const mtdVsTargetPct = targetMonthly > 0 ? (revenueMTD / targetMonthly) * 100 : 0;
  const gapMonthlyRevenue = targetMonthly - revenueMTD;

  const revenueAnnualYTD = annualRows.reduce((s, r) => s + r.nominal, 0);
  const revAnnualVsTargetPct = targetAnnual > 0 ? (revenueAnnualYTD / targetAnnual) * 100 : 0;
  const gapRevenueAnnual = targetAnnual - revenueAnnualYTD;

  // Trend Penjualan (by Revenue) - Non-Cumulative Daily / Weekly Dynamics & Spikes
  const endDayNum = Number(endDate.split('-')[2]) || 25;
  const startDayNum = Number(startDate.split('-')[2]) || 1;
  const dailyTrend = [];
  let cumCurrent = 0;
  let cumLast = 0;
  let prevDayCur = 0;

  for (let d = startDayNum; d <= endDayNum; d++) {
    const dayAddCur = curRows
      .filter((r) => r.day === d)
      .reduce((s, r) => s + r.nominal, 0);
    const dayAddLast = prevRows
      .filter((r) => r.day === d)
      .reduce((s, r) => s + r.nominal, 0);

    cumCurrent += dayAddCur;
    cumLast += dayAddLast;
    const spikeMTD = d === startDayNum ? 0 : dayAddCur - prevDayCur;
    prevDayCur = dayAddCur;

    dailyTrend.push({
      label: `${d} ${currentMonthShort}`,
      day: d,
      nominalMTD: dayAddCur,
      nominalLastMTD: dayAddLast,
      spikeMTD,
      nominalKumulatifMTD: cumCurrent,
      nominalKumulatifLastMTD: cumLast,
      dailyMTD: dayAddCur,
      dailyLastMTD: dayAddLast,
    });
  }

  let trendSeries = dailyTrend;
  if (trendGranularity === 'weekly') {
    const weeks = [
      { label: 'Minggu 1 (1-7)', minDay: 1, maxDay: 7 },
      { label: 'Minggu 2 (8-14)', minDay: 8, maxDay: 14 },
      { label: 'Minggu 3 (15-21)', minDay: 15, maxDay: 21 },
      { label: `Minggu 4 (22-${endDayNum})`, minDay: 22, maxDay: endDayNum },
    ];
    let prevWeekCur = 0;
    trendSeries = weeks
      .filter((w) => w.maxDay >= startDayNum && w.minDay <= endDayNum)
      .map((w, idx) => {
        const subset = dailyTrend.filter((d) => d.day >= w.minDay && d.day <= w.maxDay);
        const weekMTD = subset.reduce((s, item) => s + item.nominalMTD, 0);
        const weekLastMTD = subset.reduce((s, item) => s + item.nominalLastMTD, 0);
        const spikeMTD = idx === 0 ? 0 : weekMTD - prevWeekCur;
        prevWeekCur = weekMTD;
        return {
          label: w.label,
          nominalMTD: weekMTD,
          nominalLastMTD: weekLastMTD,
          spikeMTD,
        };
      });
  }

  // Product Performance & Comparison (from finance Jenis Produk)
  const productMap = new Map();
  curRows.forEach((r) => {
    const key = r.jenisProduk || 'LAINNYA';
    if (!productMap.has(key)) {
      productMap.set(key, {
        productName: key,
        serviceType: r.jenisLayanan || key,
        sesiMTD: 0,
        sesiLastMTD: 0,
        revenueMTD: 0,
      });
    }
    const item = productMap.get(key);
    item.sesiMTD += r.sesi;
    item.revenueMTD += r.nominal;
  });

  prevRows.forEach((r) => {
    const key = r.jenisProduk || 'LAINNYA';
    if (!productMap.has(key)) {
      productMap.set(key, {
        productName: key,
        serviceType: r.jenisLayanan || key,
        sesiMTD: 0,
        sesiLastMTD: 0,
        revenueMTD: 0,
      });
    }
    const item = productMap.get(key);
    item.sesiLastMTD += r.sesi;
  });

  const productStats = Array.from(productMap.values()).map((p) => ({
    ...p,
    shortName: p.productName.length > 25 ? p.productName.slice(0, 23) + '…' : p.productName,
    contributionPct: revenueMTD > 0 ? (p.revenueMTD / revenueMTD) * 100 : 0,
    growthPct: computeGrowthPct(p.sesiMTD, p.sesiLastMTD),
  }));

  const topTenProductsBySesi = [...productStats]
    .filter((p) => p.sesiMTD > 0)
    .sort((a, b) => b.sesiMTD - a.sesiMTD)
    .slice(0, 10);

  const compareProductsChartData = [...productStats]
    .filter((p) => p.sesiMTD > 0 || p.sesiLastMTD > 0)
    .sort((a, b) => b.sesiMTD - a.sesiMTD)
    .slice(0, 6);

  const topProductPerformanceTable = [...productStats]
    .filter((p) => p.sesiMTD > 0 || p.revenueMTD > 0)
    .sort((a, b) => b.revenueMTD - a.revenueMTD);

  const productComparisonTable = [...productStats]
    .filter((p) => p.sesiMTD > 0 || p.sesiLastMTD > 0)
    .sort((a, b) => b.sesiMTD - a.sesiMTD);

  // Nominal & Sesi by Source (from finance Source)
  const sourceMap = new Map();
  curRows.forEach((r) => {
    const src = r.source || 'LANJUTAN';
    if (!sourceMap.has(src)) {
      sourceMap.set(src, { source: src, sesi: 0, revenue: 0 });
    }
    const entry = sourceMap.get(src);
    entry.sesi += r.sesi;
    entry.revenue += r.nominal;
  });

  const sourceStats = Array.from(sourceMap.values())
    .map((s) => ({
      ...s,
      sharePct: revenueMTD > 0 ? (s.revenue / revenueMTD) * 100 : 0,
    }))
    .sort((a, b) => b.sesi - a.sesi);

  // Leads & Closing by Sales Table:
  // - Leads: from `leads` sheet (Tanggal Leads, Sales)
  // - Closing: from `finance` sheet (Tanggal, SUM(Sesi), Nama Sales)
  const coreSalesList = ['Mayang (Nur)', 'Ayu', 'Yuyun', 'Arina', 'Yuni (Shinta)'];
  const activeSalesList =
    salesName !== 'ALL' ? [salesName] : coreSalesList;

  const periodLeads = dataset.leadsRows.filter(
    (l) => l.date >= startDate && l.date <= endDate
  );

  const leadsRows = activeSalesList.map((sName) => {
    const jumlahLeads = periodLeads.filter((l) => l.salesName === sName).length;
    // Closing from finance rows (Tanggal, Sesi, Nama Sales) with Status = NEW
    const closing = curRows
      .filter((f) => f.salesName === sName && f.status === 'NEW')
      .reduce((sum, f) => sum + f.sesi, 0);

    const pctLeadsClosing = jumlahLeads > 0 ? (closing / jumlahLeads) * 100 : 0;
    const targetNumber = Math.round((jumlahLeads * targetLeadsPct) / 100);

    return {
      salesName: sName,
      jumlahLeads,
      closing,
      pctLeadsClosing,
      targetPct: targetLeadsPct,
      targetNumber,
    };
  });

  const totalLeads = leadsRows.reduce((acc, r) => acc + r.jumlahLeads, 0);
  const totalClosing = leadsRows.reduce((acc, r) => acc + r.closing, 0);
  const totalTargetNumber = leadsRows.reduce((acc, r) => acc + r.targetNumber, 0);
  const totalLeadsSummary = {
    salesName: 'TOTAL',
    jumlahLeads: totalLeads,
    closing: totalClosing,
    pctLeadsClosing: totalLeads > 0 ? (totalClosing / totalLeads) * 100 : 0,
    targetPct: targetLeadsPct,
    targetNumber: totalTargetNumber,
  };

  // Dynamic Highlights
  const top1Prod = topProductPerformanceTable[0];
  const top2Prod = topProductPerformanceTable[1];
  const topTwoShare = (top1Prod?.contributionPct || 0) + (top2Prod?.contributionPct || 0);
  const topTwoNames = top2Prod
    ? `${top1Prod.productName} & ${top2Prod.productName}`
    : top1Prod?.productName || '-';

  const dynamicHighlights = {
    periodLabel: `${currentMonthName} (${startDate} s/d ${endDate})`,
    prevPeriodLabel: `${prevMonthName} (${prevStart} s/d ${prevEnd})`,
    topTwoNames,
    topTwoShare,
    top1Sesi: top1Prod?.sesiMTD || 0,
    isTargetMet: revenueMTD >= targetMonthly,
    targetDiffAbs: Math.abs(gapMonthlyRevenue),
    salesFilterLabel: salesName === 'ALL' ? 'Seluruh Tim Sales' : `Sales ${salesName}`,
    serviceFilterLabel: serviceType === 'ALL' ? 'Semua Layanan' : serviceType,
    isLeadsTargetMet: totalLeadsSummary.pctLeadsClosing >= targetLeadsPct,
  };

  return {
    periodInfo: {
      currentRange: `${startDate} s/d ${endDate}`,
      lastMonthRange: `${prevStart} s/d ${prevEnd}`,
      currentMonthName,
      currentMonthShort,
      prevMonthName,
      prevMonthShort,
    },
    kpis: {
      revenueMTD,
      revenueLastMTD,
      revenueGrowthPct,
      sesiMTD,
      sesiLastMTD,
      sesiGrowthPct,
      ticketSizeMTD,
      ticketSizeLastMTD,
      ticketSizeGrowthPct,
      targetMonthly,
      targetBulananAll,
      targetLeadsPct,
      mtdVsTargetPct,
      gapMonthlyRevenue,
      revenueAnnualYTD,
      targetAnnual,
      revAnnualVsTargetPct,
      gapRevenueAnnual,
    },
    dynamicHighlights,
    trendSeries,
    topTenProductsBySesi,
    compareProductsChartData,
    sourceStats,
    topProductPerformanceTable,
    productComparisonTable,
    leadsBySalesTable: leadsRows,
    totalLeadsSummary,
  };
}

// ============================================================================
// 2. BUSINESS PERFORMANCE DASHBOARD ANALYTICS
// ============================================================================
export function computeBusinessPerformanceAnalytics(
  dataset,
  selectedMonth = 9,
  targetConfig = DEFAULT_TARGET_CONFIG
) {
  if (dataset.mode === 'google_sheets' && dataset.financeRows?.length > 0) {
    return computeRealBusinessPerformanceAnalytics(dataset, selectedMonth, targetConfig);
  }
  return computeDummyBusinessPerformanceAnalytics(dataset, selectedMonth, targetConfig);
}

function computeRealBusinessPerformanceAnalytics(dataset, selectedMonth = 9, targetConfig) {
  const { financeRows, closingRows = [], targets } = dataset;

  const customTargetAll = Number(targetConfig.targetBulananAll) || 320000000;
  const customTargetTA = Number(targetConfig.targetTA) || 180000000;

  const isRowTA = (r) =>
    r.detailProduk === 'TA' || (r.detailProduk === 'MP' && r.kategoriSegment === 'TA');

  // Compute monthly SOP (ALL rows in finance) and TA for 2026
  const monthlySopTaSeries = [];
  for (let m = 1; m <= selectedMonth; m++) {
    const mRows = financeRows.filter((r) => r.year === 2026 && r.month === m);
    const revSOP = mRows.reduce((s, r) => s + r.nominal, 0);
    const revTA = mRows.filter(isRowTA).reduce((s, r) => s + r.nominal, 0);

    monthlySopTaSeries.push({
      month: m,
      monthLabel: getMonthShortName(m),
      revSOP,
      revTA,
      targetSOP: customTargetAll,
      targetTA: customTargetTA,
    });
  }

  const currentMonthSeries = monthlySopTaSeries.find((m) => m.month === Number(selectedMonth)) || {
    revSOP: 0,
    revTA: 0,
  };

  const sopPeriodSum = monthlySopTaSeries.reduce((s, m) => s + m.revSOP, 0);
  const taPeriodSum = monthlySopTaSeries.reduce((s, m) => s + m.revTA, 0);

  // Full 2026 YTD across all Detail Produk for SOP (Rp 2.993.572.587) and TA only for TA (Rp 1.568.299.250)
  const all2026Rows = financeRows.filter((r) => r.year === 2026);
  const sopYtdActual = all2026Rows.reduce((s, r) => s + r.nominal, 0);
  const taYtdActual = all2026Rows.filter(isRowTA).reduce((s, r) => s + r.nominal, 0);

  const avgSOP =
    monthlySopTaSeries.length > 0 ? Math.round(sopPeriodSum / monthlySopTaSeries.length) : 0;
  const avgTA =
    monthlySopTaSeries.length > 0 ? Math.round(taPeriodSum / monthlySopTaSeries.length) : 0;

  monthlySopTaSeries.forEach((m) => {
    m.avgSOP = avgSOP;
    m.avgTA = avgTA;
  });

  // YTD 2025 comparison (from closing sheet 2025 or calibrated baseline)
  const closing2025YTD = closingRows
    .filter((c) => c.paymentYear === 2025 && c.paymentMonth <= selectedMonth)
    .reduce((s, c) => s + c.totalBayar, 0);

  const ytd2025 = closing2025YTD > 1000000000 ? closing2025YTD : targets.ytd2025JanSep;
  const ytd2026 = sopPeriodSum;
  const ytdGrowthPct = computeGrowthPct(ytd2026, ytd2025);
  const ytdGapNominal = ytd2026 - ytd2025;

  // Multi-year annual series directly from closing sheet (Total Bayar & Waktu Input)
  const yearRevenueMap = new Map();
  closingRows.forEach((c) => {
    const yr = c.inputYear || c.paymentYear;
    if (!yr) return;
    yearRevenueMap.set(yr, (yearRevenueMap.get(yr) || 0) + c.totalBayar);
  });

  const multiYearAnnual =
    yearRevenueMap.size > 0
      ? Array.from(yearRevenueMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([yr, rev]) => ({
            year: String(yr),
            revenueJuta: Math.round(rev / 1_000_000),
            revenue: rev,
          }))
      : MULTI_YEAR_ANNUAL;

  const sopYtdTarget = customTargetAll * 12;
  const taYtdTarget = customTargetTA * 12;

  const sopMetrics = {
    mtdActual: currentMonthSeries.revSOP,
    mtdTarget: customTargetAll,
    mtdPct: customTargetAll > 0 ? (currentMonthSeries.revSOP / customTargetAll) * 100 : 0,
    ytdActual: sopYtdActual,
    ytdTarget: sopYtdTarget,
    ytdPct: sopYtdTarget > 0 ? (sopYtdActual / sopYtdTarget) * 100 : 0,
    avgMonthly: avgSOP,
  };

  const taMetrics = {
    mtdActual: currentMonthSeries.revTA,
    mtdTarget: customTargetTA,
    mtdPct: customTargetTA > 0 ? (currentMonthSeries.revTA / customTargetTA) * 100 : 0,
    ytdActual: taYtdActual,
    ytdTarget: taYtdTarget,
    ytdPct: taYtdTarget > 0 ? (taYtdActual / taYtdTarget) * 100 : 0,
    avgMonthly: avgTA,
  };

  // Stacked Bar by Sales YTD (from finance sheet Nama Sales, using Ms prefix and excluding Dhea & Keke)
  const activeMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ].slice(0, selectedMonth);

  const trackedSales = [
    { salesCode: 'Ms NUR', salesName: 'Mayang (Nur)', monthlyTarget: 25000000, annualTarget: 25000000 * 12 },
    { salesCode: 'Ms SHINTA', salesName: 'Yuni (Shinta)', monthlyTarget: 35000000, annualTarget: 35000000 * 12 },
    { salesCode: 'Ms AYU', salesName: 'Ayu', monthlyTarget: 35000000, annualTarget: 35000000 * 12 },
    { salesCode: 'Ms ARINA', salesName: 'Arina', monthlyTarget: 35000000, annualTarget: 35000000 * 12 },
    { salesCode: 'Ms YUYUN', salesName: 'Yuyun', monthlyTarget: 35000000, annualTarget: 35000000 * 12 },
    { salesCode: 'Ms PRILLY', salesName: 'Prily (Lusy)', monthlyTarget: 25000000, annualTarget: 25000000 * 12 },
  ];

  const salesHorizontalStacked = trackedSales
    .map((s) => {
      let totalIDR = 0;
      const monthValues = {};
      activeMonths.forEach((mKey, idx) => {
        const mNum = idx + 1;
        const mRev = financeRows
          .filter((r) => r.year === 2026 && r.month === mNum && r.salesName === s.salesName)
          .reduce((sum, r) => sum + r.nominal, 0);
        totalIDR += mRev;
        monthValues[mKey] = Number((mRev / 1_000_000).toFixed(1));
      });

      const totalJuta = Number((totalIDR / 1_000_000).toFixed(1));
      const avgJuta =
        activeMonths.length > 0 ? Number((totalJuta / activeMonths.length).toFixed(1)) : 0;

      const item = {
        salesCode: s.salesCode,
        salesName: s.salesName,
        totalJuta,
        avgJuta,
        totalIDR,
        avgIDR: activeMonths.length > 0 ? Math.round(totalIDR / activeMonths.length) : 0,
        monthlyTarget: s.monthlyTarget,
        annualTarget: s.annualTarget,
      };

      activeMonths.forEach((mKey) => {
        item[mKey] = monthValues[mKey];
        item[`${mKey}_pct`] =
          totalJuta > 0 ? Number(((monthValues[mKey] / totalJuta) * 100).toFixed(1)) : 0;
      });

      return item;
    })
    .filter((s) => s.totalIDR > 0)
    .sort((a, b) => b.totalIDR - a.totalIDR);

  const salesPerformanceCards = salesHorizontalStacked.map((s) => {
    const currentMonthKey = getMonthShortName(selectedMonth);
    const mtdRev = Math.round((s[currentMonthKey] || 0) * 1_000_000);
    const mtdTarget = s.monthlyTarget;
    const mtdPct = mtdTarget > 0 ? (mtdRev / mtdTarget) * 100 : 0;

    const ytdRev = s.totalIDR;
    const annualTarget = s.annualTarget;
    const ytdPct = annualTarget > 0 ? (ytdRev / annualTarget) * 100 : 0;

    return {
      salesCode: s.salesCode,
      salesName: s.salesName,
      mtdRev,
      mtdTarget,
      mtdPct,
      ytdRev,
      annualTarget,
      ytdPct,
    };
  });

  // Keep Client Cohort Table & Capacity Conversion Chart using dummy data until real capacity/retention data is confirmed
  const clientRetentionTable = COHORT_MONTHLY_DATA.slice(0, selectedMonth);
  const capacityMonthly = CAPACITY_MONTHLY_DATA.slice(0, selectedMonth);

  return {
    multiYearAnnual,
    ytdComparison: {
      ytd2025,
      ytd2026,
      ytdGrowthPct,
      ytdGapNominal,
    },
    sopMetrics,
    taMetrics,
    monthlySopTaSeries,
    activeMonths,
    salesHorizontalStacked,
    salesPerformanceCards,
    clientRetentionTable,
    capacityMonthly,
  };
}

// ============================================================================
// 3. LEADERBOARD MITRA AHLI ANALYTICS (FROM CLOSING SHEET)
// ============================================================================
export function computeLeaderboardAnalytics(dataset, filters) {
  if (dataset.mode === 'google_sheets' && dataset.closingRows?.length > 0) {
    return computeRealLeaderboardAnalytics(dataset, filters);
  }
  return computeDummyLeaderboardAnalytics(dataset, filters);
}

function computeRealLeaderboardAnalytics(dataset, filters) {
  const { month = 10, sessionMode = 'ALL' } = filters;
  const targetMonth = Number(month);

  // Filter closing rows for 2026 and selected month (using Tanggal Sesi)
  const monthRows = dataset.closingRows.filter(
    (r) => r.sesiYear === 2026 && r.sesiMonth === targetMonth
  );

  const psiMap = new Map();
  monthRows.forEach((r) => {
    const matchMode = sessionMode === 'ALL' || r.sessionMode === sessionMode;
    if (!matchMode) return;

    const name = r.psikologName;
    if (!name) return;
    if (!psiMap.has(name)) {
      psiMap.set(name, {
        mitraName: name,
        specialty: 'Psikolog Klinis & Mitra Ahli',
        clientsSet: new Set(),
        sesiOnline: 0,
        sesiOffline: 0,
        totalSesi: 0,
      });
    }
    const entry = psiMap.get(name);
    if (r.clientName) {
      entry.clientsSet.add(r.clientName.toLowerCase());
    }
    if (r.sessionMode === 'ON') {
      entry.sesiOnline += r.jumlahSesi;
    } else {
      entry.sesiOffline += r.jumlahSesi;
    }
    entry.totalSesi += r.jumlahSesi;
  });

  const rankedTable = Array.from(psiMap.values())
    .map((p) => ({
      mitraName: p.mitraName,
      specialty: p.specialty,
      totalClient: p.clientsSet.size,
      sesiOnline: p.sesiOnline,
      sesiOffline: p.sesiOffline,
      totalSesi: p.totalSesi,
    }))
    .sort((a, b) => b.totalClient - a.totalClient || b.totalSesi - a.totalSesi)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

  const totalAllSessions = rankedTable.reduce((s, r) => s + r.totalSesi, 0);
  const totalAllClients = rankedTable.reduce((s, r) => s + r.totalClient, 0);

  const top5ByClient = rankedTable.slice(0, 5);
  const top5BySesi = [...rankedTable].sort((a, b) => b.totalSesi - a.totalSesi).slice(0, 5);

  return {
    summaryKpis: {
      totalAllSessions,
      totalAllClients,
    },
    rankedTable,
    top5ByClient,
    top5BySesi,
  };
}

// ============================================================================
// FALLBACK DUMMY ANALYTICS (WHEN IN DUMMY ENGINE MODE)
// ============================================================================
function computeDummyMarketingAnalytics(dataset, filters, targetConfig) {
  const {
    startDate = '2026-10-01',
    endDate = '2026-10-25',
    serviceType = 'ALL',
    statusTerjual = 'ALL',
    salesName = 'ALL',
    trendGranularity = 'daily',
  } = filters;

  const {
    curMonth,
    currentMonthName,
    currentMonthShort,
    prevStart,
    prevEnd,
    prevMonthName,
    prevMonthShort,
  } = getPreviousMonthDateRange(startDate, endDate);

  const isDefaultUnfiltered =
    serviceType === 'ALL' &&
    salesName === 'ALL' &&
    statusTerjual === 'ALL' &&
    startDate === '2026-10-01' &&
    endDate >= '2026-10-24';

  const matchDimension = (tx) => {
    const matchService = serviceType === 'ALL' || tx.service_type === serviceType;
    const matchSales = salesName === 'ALL' || tx.sales_name === salesName;
    const matchStatus = statusTerjual === 'ALL' || tx.status_terjual === statusTerjual;
    return matchService && matchSales && matchStatus;
  };

  const currentMTDTxs = dataset.transactions.filter(
    (tx) => tx.date >= startDate && tx.date <= endDate && matchDimension(tx)
  );
  const lastMTDTxs = dataset.transactions.filter(
    (tx) => tx.date >= prevStart && tx.date <= prevEnd && matchDimension(tx)
  );

  const revenueMTD = isDefaultUnfiltered
    ? 262683500
    : currentMTDTxs.reduce((s, t) => s + t.revenue, 0);
  const revenueLastMTD = isDefaultUnfiltered
    ? 99654500
    : lastMTDTxs.reduce((s, t) => s + t.revenue, 0);
  const revenueGrowthPct = computeGrowthPct(revenueMTD, revenueLastMTD);

  const sesiMTD = isDefaultUnfiltered
    ? 381
    : currentMTDTxs.reduce((s, t) => s + t.sessions_count, 0);
  const sesiLastMTD = isDefaultUnfiltered
    ? 149
    : lastMTDTxs.reduce((s, t) => s + t.sessions_count, 0);
  const sesiGrowthPct = computeGrowthPct(sesiMTD, sesiLastMTD);

  const ticketSizeMTD = sesiMTD > 0 ? Math.round(revenueMTD / sesiMTD) : 0;
  const ticketSizeLastMTD = isDefaultUnfiltered
    ? 735400
    : sesiLastMTD > 0
    ? Math.round(revenueLastMTD / sesiLastMTD)
    : 0;
  const ticketSizeGrowthPct = isDefaultUnfiltered
    ? -6.3
    : computeGrowthPct(ticketSizeMTD, ticketSizeLastMTD);

  const targetMonthly = Number(targetConfig.targetTA) || 180000000;
  const targetBulananAll = Number(targetConfig.targetBulananAll) || 320000000;
  const targetLeadsPct = Number(targetConfig.targetPersentaseLeads) || 15;

  const mtdVsTargetPct = targetMonthly > 0 ? (revenueMTD / targetMonthly) * 100 : 0;
  const gapMonthlyRevenue = targetMonthly - revenueMTD;

  const filterRatio = isDefaultUnfiltered ? 1 : Math.max(0.05, revenueMTD / 262683500);
  const revenueAnnualYTD = Math.round(dataset.targets.annualActualYTD * filterRatio);
  const targetAnnual = dataset.targets.annualTargetMarketing;
  const revAnnualVsTargetPct = targetAnnual > 0 ? (revenueAnnualYTD / targetAnnual) * 100 : 0;
  const gapRevenueAnnual = targetAnnual - revenueAnnualYTD;

  const endDayNum = Number(endDate.split('-')[2]) || 25;
  const dailyTrend = [];
  let cumCurrent = 0;
  let cumLast = 0;
  let prevDayCur = 0;

  for (let d = 1; d <= endDayNum; d++) {
    const dayAddCur = Math.round((revenueMTD / endDayNum) * (0.82 + ((d % 5) * 0.09)));
    const dayAddLast = Math.round((revenueLastMTD / endDayNum) * (0.85 + ((d % 4) * 0.08)));
    cumCurrent = d === endDayNum ? revenueMTD : Math.min(revenueMTD, cumCurrent + dayAddCur);
    cumLast = d === endDayNum ? revenueLastMTD : Math.min(revenueLastMTD, cumLast + dayAddLast);
    const spikeMTD = d === 1 ? 0 : dayAddCur - prevDayCur;
    prevDayCur = dayAddCur;

    dailyTrend.push({
      label: `${d} ${currentMonthShort}`,
      day: d,
      nominalMTD: dayAddCur,
      nominalLastMTD: dayAddLast,
      spikeMTD,
      nominalKumulatifMTD: cumCurrent,
      nominalKumulatifLastMTD: cumLast,
    });
  }

  let trendSeries = dailyTrend;
  if (trendGranularity === 'weekly') {
    const weeks = [
      { label: 'Minggu 1 (1-7)', minDay: 1, maxDay: 7 },
      { label: 'Minggu 2 (8-14)', minDay: 8, maxDay: 14 },
      { label: 'Minggu 3 (15-21)', minDay: 15, maxDay: 21 },
      { label: `Minggu 4 (22-${endDayNum})`, minDay: 22, maxDay: endDayNum },
    ];
    let prevWeekCur = 0;
    trendSeries = weeks
      .filter((w) => w.minDay <= endDayNum)
      .map((w, idx) => {
        const subset = dailyTrend.filter((d) => d.day >= w.minDay && d.day <= w.maxDay);
        const weekMTD = subset.reduce((s, item) => s + item.nominalMTD, 0);
        const weekLastMTD = subset.reduce((s, item) => s + item.nominalLastMTD, 0);
        const spikeMTD = idx === 0 ? 0 : weekMTD - prevWeekCur;
        prevWeekCur = weekMTD;
        return {
          label: w.label,
          nominalMTD: weekMTD,
          nominalLastMTD: weekLastMTD,
          spikeMTD,
        };
      });
  }

  const exactProductRevenues = {
    'KONSELING REGULER SENIOR 2': 52758000,
    'ADHD': 46490000,
    'MHD': 18200000,
    'MHCU': 17112500,
    'ADHD KOMPREHENSIF': 15600000,
    'KONSELING OFFLINE TEBET': 13883000,
    'KONSELING REGULER SENIOR 1': 9475000,
    'KONSELING PASANGAN OFFLINE': 6882500,
    'KONSELING BUNDLING SENIOR 2': 22540000,
    'KONSELING REGULER JUNIOR': 14675000,
    'BRAINSPOTTING OFFLINE': 11650000,
    'Autism Online Remaja/Dewasa': 9600000,
    'ADHD REMAJA': 7817500,
    'Others': 16000000,
  };

  const filteredProducts = PRODUCTS.filter(
    (p) => serviceType === 'ALL' || p.service === serviceType
  );
  const monthVolumeMultiplier = curMonth === 10 ? 1 : curMonth === 9 ? 0.52 : 0.68 + (curMonth % 3) * 0.08;
  const salesMultiplier = salesName === 'ALL' ? 1 : 0.22;

  const productStats = filteredProducts.map((prod) => {
    const sesiCur = Math.max(1, Math.round(prod.octSesi * monthVolumeMultiplier * salesMultiplier));
    const sesiLast = Math.max(1, Math.round(prod.sepSesi * monthVolumeMultiplier * salesMultiplier));
    const revCur = Math.round(
      (exactProductRevenues[prod.name] || prod.octSesi * prod.price) *
        monthVolumeMultiplier *
        salesMultiplier
    );
    return {
      productName: prod.name,
      shortName: prod.name.length > 25 ? prod.name.slice(0, 23) + '…' : prod.name,
      serviceType: prod.service,
      sesiMTD: sesiCur,
      sesiLastMTD: sesiLast,
      revenueMTD: revCur,
      contributionPct: 0,
      growthPct: computeGrowthPct(sesiCur, sesiLast),
    };
  });

  const totalFilteredProdRev = productStats.reduce((s, p) => s + p.revenueMTD, 0) || 1;
  productStats.forEach((p) => {
    p.contributionPct = (p.revenueMTD / totalFilteredProdRev) * 100;
  });

  const topTenProductsBySesi = [...productStats].sort((a, b) => b.sesiMTD - a.sesiMTD).slice(0, 10);
  const compareProductsChartData = [...productStats].sort((a, b) => b.sesiMTD - a.sesiMTD).slice(0, 6);
  const topProductPerformanceTable = [...productStats].sort((a, b) => b.revenueMTD - a.revenueMTD);
  const productComparisonTable = [...productStats].sort((a, b) => b.sesiMTD - a.sesiMTD);

  const sourceStats = LEAD_SOURCES.map((src) => {
    const sesi = Math.max(1, Math.round(src.sesi * filterRatio));
    const revenue = Math.round(src.nominal * filterRatio);
    return {
      source: src.name,
      sesi,
      revenue,
      sharePct: revenueMTD > 0 ? (revenue / revenueMTD) * 100 : 0,
    };
  });

  const leadsRows = SALES_TEAM.slice(0, 5)
    .filter((s) => salesName === 'ALL' || s.name === salesName)
    .map((s) => {
      const jumlahLeads = Math.max(5, Math.round(s.octLeads * monthVolumeMultiplier));
      const closing = Math.max(2, Math.round(s.octClosing * monthVolumeMultiplier));
      const pctLeadsClosing = jumlahLeads > 0 ? (closing / jumlahLeads) * 100 : 0;
      const targetNumber = Math.round((jumlahLeads * targetLeadsPct) / 100);
      return {
        salesName: s.name,
        jumlahLeads,
        closing,
        pctLeadsClosing,
        targetPct: targetLeadsPct,
        targetNumber,
      };
    });

  const totalLeads = leadsRows.reduce((acc, r) => acc + r.jumlahLeads, 0);
  const totalClosing = leadsRows.reduce((acc, r) => acc + r.closing, 0);
  const totalTargetNumber = leadsRows.reduce((acc, r) => acc + r.targetNumber, 0);
  const totalLeadsSummary = {
    salesName: 'TOTAL',
    jumlahLeads: totalLeads,
    closing: totalClosing,
    pctLeadsClosing: totalLeads > 0 ? (totalClosing / totalLeads) * 100 : 0,
    targetPct: targetLeadsPct,
    targetNumber: totalTargetNumber,
  };

  const top1Prod = topProductPerformanceTable[0];
  const top2Prod = topProductPerformanceTable[1];
  const topTwoShare = (top1Prod?.contributionPct || 0) + (top2Prod?.contributionPct || 0);
  const topTwoNames = top2Prod
    ? `${top1Prod.productName} & ${top2Prod.productName}`
    : top1Prod?.productName || '-';

  const dynamicHighlights = {
    periodLabel: `${currentMonthName} (${startDate} s/d ${endDate})`,
    prevPeriodLabel: `${prevMonthName} (${prevStart} s/d ${prevEnd})`,
    topTwoNames,
    topTwoShare,
    top1Sesi: top1Prod?.sesiMTD || 0,
    isTargetMet: revenueMTD >= targetMonthly,
    targetDiffAbs: Math.abs(gapMonthlyRevenue),
    salesFilterLabel: salesName === 'ALL' ? 'Seluruh Tim Sales' : `Sales ${salesName}`,
    serviceFilterLabel: serviceType === 'ALL' ? 'Semua Layanan' : serviceType,
    isLeadsTargetMet: totalLeadsSummary.pctLeadsClosing >= targetLeadsPct,
  };

  return {
    periodInfo: {
      currentRange: `${startDate} s/d ${endDate}`,
      lastMonthRange: `${prevStart} s/d ${prevEnd}`,
      currentMonthName,
      currentMonthShort,
      prevMonthName,
      prevMonthShort,
    },
    kpis: {
      revenueMTD,
      revenueLastMTD,
      revenueGrowthPct,
      sesiMTD,
      sesiLastMTD,
      sesiGrowthPct,
      ticketSizeMTD,
      ticketSizeLastMTD,
      ticketSizeGrowthPct,
      targetMonthly,
      targetBulananAll,
      targetLeadsPct,
      mtdVsTargetPct,
      gapMonthlyRevenue,
      revenueAnnualYTD,
      targetAnnual,
      revAnnualVsTargetPct,
      gapRevenueAnnual,
    },
    dynamicHighlights,
    trendSeries,
    topTenProductsBySesi,
    compareProductsChartData,
    sourceStats,
    topProductPerformanceTable,
    productComparisonTable,
    leadsBySalesTable: leadsRows,
    totalLeadsSummary,
  };
}

function computeDummyBusinessPerformanceAnalytics(dataset, selectedMonth = 9, targetConfig) {
  const { targets } = dataset;
  const customTargetAll = Number(targetConfig.targetBulananAll) || 320000000;
  const customTargetTA = Number(targetConfig.targetTA) || 180000000;

  const multiYearAnnual = MULTI_YEAR_ANNUAL;
  const ytd2025 = targets.ytd2025JanSep;
  const ytd2026 = targets.ytd2026JanSep;
  const ytdGrowthPct = computeGrowthPct(ytd2026, ytd2025);
  const ytdGapNominal = ytd2026 - ytd2025;

  const selectedMonthRow =
    MONTHLY_SOP_TA_SERIES.find((m) => m.month === Number(selectedMonth)) ||
    MONTHLY_SOP_TA_SERIES[8];

  const sopMtdActual = selectedMonth === 9 ? targets.sopMtdActual : selectedMonthRow.revSOP;
  const taMtdActual = selectedMonth === 9 ? targets.taMtdActual : selectedMonthRow.revTA;

  const filteredMonthlySeries = MONTHLY_SOP_TA_SERIES.filter((m) => m.month <= selectedMonth);
  const avgSOP =
    filteredMonthlySeries.length > 0
      ? Math.round(
          filteredMonthlySeries.reduce((s, m) => s + m.revSOP, 0) / filteredMonthlySeries.length
        )
      : 0;
  const avgTA =
    filteredMonthlySeries.length > 0
      ? Math.round(
          filteredMonthlySeries.reduce((s, m) => s + m.revTA, 0) / filteredMonthlySeries.length
        )
      : 0;

  const sopYtdTarget = customTargetAll * 12;
  const taYtdTarget = customTargetTA * 12;

  const sopMetrics = {
    mtdActual: sopMtdActual,
    mtdTarget: customTargetAll,
    mtdPct: customTargetAll > 0 ? (sopMtdActual / customTargetAll) * 100 : 0,
    ytdActual: targets.sopYtdActual,
    ytdTarget: sopYtdTarget,
    ytdPct: sopYtdTarget > 0 ? (targets.sopYtdActual / sopYtdTarget) * 100 : 0,
    avgMonthly: avgSOP,
  };

  const taMetrics = {
    mtdActual: taMtdActual,
    mtdTarget: customTargetTA,
    mtdPct: customTargetTA > 0 ? (taMtdActual / customTargetTA) * 100 : 0,
    ytdActual: targets.taYtdActual,
    ytdTarget: taYtdTarget,
    ytdPct: taYtdTarget > 0 ? (targets.taYtdActual / taYtdTarget) * 100 : 0,
    avgMonthly: avgTA,
  };

  const monthlySopTaSeries = filteredMonthlySeries.map((item) => ({
    ...item,
    targetSOP: customTargetAll,
    targetTA: customTargetTA,
    avgSOP,
    avgTA,
  }));

  const activeMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'].slice(
    0,
    selectedMonth
  );

  const salesHorizontalStacked = SALES_MONTHLY_STACK_DATA.map((row) => {
    const totalJuta = activeMonths.reduce((s, mKey) => s + (row[mKey] || 0), 0);
    const avgJuta = activeMonths.length > 0 ? totalJuta / activeMonths.length : 0;
    const item = {
      salesCode: row.salesCode,
      salesName: row.salesName,
      totalJuta: Number(totalJuta.toFixed(1)),
      avgJuta: Number(avgJuta.toFixed(1)),
      totalIDR: Math.round(totalJuta * 1_000_000),
      avgIDR: Math.round(avgJuta * 1_000_000),
    };
    activeMonths.forEach((mKey) => {
      item[mKey] = row[mKey];
      item[`${mKey}_pct`] = totalJuta > 0 ? Number(((row[mKey] / totalJuta) * 100).toFixed(1)) : 0;
    });
    return item;
  });

  const salesPerformanceCards = SALES_TEAM.map((s, idx) => {
    const stackRow = salesHorizontalStacked[idx] || salesHorizontalStacked[0];
    const currentMonthKey = getMonthShortName(selectedMonth);
    const mtdRev = Math.round((stackRow[currentMonthKey] || 32.5) * 1_000_000);
    const mtdTarget = s.monthlyTarget;
    const mtdPct = (mtdRev / mtdTarget) * 100;

    const ytdRev = stackRow.totalIDR;
    const annualTarget = s.annualTarget;
    const ytdPct = (ytdRev / annualTarget) * 100;

    return {
      salesCode: s.code,
      salesName: s.name,
      mtdRev,
      mtdTarget,
      mtdPct,
      ytdRev,
      annualTarget,
      ytdPct,
    };
  });

  const clientRetentionTable = COHORT_MONTHLY_DATA.slice(0, selectedMonth);
  const capacityMonthly = CAPACITY_MONTHLY_DATA.slice(0, selectedMonth);

  return {
    multiYearAnnual,
    ytdComparison: {
      ytd2025,
      ytd2026,
      ytdGrowthPct,
      ytdGapNominal,
    },
    sopMetrics,
    taMetrics,
    monthlySopTaSeries,
    activeMonths,
    salesHorizontalStacked,
    salesPerformanceCards,
    clientRetentionTable,
    capacityMonthly,
  };
}

function computeDummyLeaderboardAnalytics(dataset, filters) {
  const { month = 10, sessionMode = 'ALL' } = filters;
  const monthScale = month === 10 ? 1 : 0.85 + (month % 3) * 0.06;

  const rankedTable = MITRA_AHLI.map((m, idx) => {
    const sesiOn = Math.max(1, Math.round(m.sesiOn * monthScale));
    const sesiOff = Math.round(m.sesiOff * monthScale);
    const activeSesi =
      sessionMode === 'ON' ? sesiOn : sessionMode === 'OFF' ? sesiOff : sesiOn + sesiOff;
    const activeClient =
      sessionMode === 'ON'
        ? Math.max(1, Math.round(m.client * 0.72 * monthScale))
        : sessionMode === 'OFF'
        ? Math.max(0, Math.round(m.client * 0.28 * monthScale))
        : Math.max(1, Math.round(m.client * monthScale));

    return {
      rank: idx + 1,
      mitraName: m.name,
      specialty: m.specialty,
      totalClient: activeClient,
      sesiOnline: sesiOn,
      sesiOffline: sesiOff,
      totalSesi: activeSesi,
    };
  })
    .sort((a, b) => b.totalClient - a.totalClient || b.totalSesi - a.totalSesi)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  const totalAllSessions = rankedTable.reduce((s, r) => s + r.totalSesi, 0);
  const totalAllClients = rankedTable.reduce((s, r) => s + r.totalClient, 0);

  const top5ByClient = rankedTable.slice(0, 5);
  const top5BySesi = [...rankedTable].sort((a, b) => b.totalSesi - a.totalSesi).slice(0, 5);

  return {
    summaryKpis: {
      totalAllSessions,
      totalAllClients,
    },
    rankedTable,
    top5ByClient,
    top5BySesi,
  };
}
