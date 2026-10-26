// ============================================================================
// MOCK DATA & GOOGLE SHEETS SCHEMA GENERATOR (ALIGNED TO ACTUAL DASHBOARD)
// ============================================================================
// Disesuaikan dengan struktur metrik, nama produk, nama sales, source,
// dan psikolog/mitra ahli dari screenshot dashboard asli.
// ============================================================================

export const SERVICE_TYPES = [
  'KONSELING REGULER',
  'ASESMEN & DIAGNOSTIK',
  'KONSELING OFFLINE',
  'KONSELING BUNDLING',
  'KONSELING PASANGAN',
];

export const PRODUCTS = [
  { name: 'KONSELING REGULER SENIOR 2', service: 'KONSELING REGULER', price: 512000, segment: 'TA', octSesi: 103, sepSesi: 43 },
  { name: 'MHCU', service: 'ASESMEN & DIAGNOSTIK', price: 295000, segment: 'SOP', octSesi: 58, sepSesi: 27 },
  { name: 'ADHD', service: 'ASESMEN & DIAGNOSTIK', price: 1192000, segment: 'TA', octSesi: 39, sepSesi: 13 },
  { name: 'KONSELING REGULER SENIOR 1', service: 'KONSELING REGULER', price: 395000, segment: 'TA', octSesi: 24, sepSesi: 11 },
  { name: 'KONSELING BUNDLING SENIOR 2', service: 'KONSELING BUNDLING', price: 980000, segment: 'TA', octSesi: 23, sepSesi: 3 },
  { name: 'MHD', service: 'ASESMEN & DIAGNOSTIK', price: 910000, segment: 'SOP', octSesi: 20, sepSesi: 7 },
  { name: 'KONSELING REGULER JUNIOR', service: 'KONSELING REGULER', price: 275000, segment: 'SOP', octSesi: 17, sepSesi: 6 },
  { name: 'KONSELING OFFLINE TEBET', service: 'KONSELING OFFLINE', price: 868000, segment: 'TA', octSesi: 16, sepSesi: 9 },
  { name: 'ADHD KOMPREHENSIF', service: 'ASESMEN & DIAGNOSTIK', price: 1560000, segment: 'TA', octSesi: 10, sepSesi: 5 },
  { name: 'BRAINSPOTTING OFFLINE', service: 'KONSELING OFFLINE', price: 950000, segment: 'TA', octSesi: 7, sepSesi: 4 },
  { name: 'KONSELING PASANGAN OFFLINE', service: 'KONSELING PASANGAN', price: 1376500, segment: 'TA', octSesi: 5, sepSesi: 3 },
  { name: 'Autism Online Remaja/Dewasa', service: 'ASESMEN & DIAGNOSTIK', price: 920000, segment: 'TA', octSesi: 5, sepSesi: 3 },
  { name: 'ADHD REMAJA', service: 'ASESMEN & DIAGNOSTIK', price: 890000, segment: 'TA', octSesi: 4, sepSesi: 2 },
  { name: 'Others', service: 'KONSELING REGULER', price: 450000, segment: 'SOP', octSesi: 50, sepSesi: 13 },
];

export const SALES_TEAM = [
  { name: 'Mayang (Nur)', code: 'Ms NUR', monthlyTarget: 25000000, annualTarget: 25000000 * 12, leadsTargetPct: 15, octLeads: 33, octClosing: 13 },
  { name: 'Ayu', code: 'Ms AYU', monthlyTarget: 35000000, annualTarget: 35000000 * 12, leadsTargetPct: 15, octLeads: 44, octClosing: 16 },
  { name: 'Yuyun', code: 'Ms YUYUN', monthlyTarget: 35000000, annualTarget: 35000000 * 12, leadsTargetPct: 15, octLeads: 55, octClosing: 17 },
  { name: 'Arina', code: 'Ms ARINA', monthlyTarget: 35000000, annualTarget: 35000000 * 12, leadsTargetPct: 15, octLeads: 59, octClosing: 12 },
  { name: 'Yuni (Shinta)', code: 'Ms SHINTA', monthlyTarget: 35000000, annualTarget: 35000000 * 12, leadsTargetPct: 15, octLeads: 87, octClosing: 17 },
  { name: 'Prily (Lusy)', code: 'Ms PRILLY', monthlyTarget: 25000000, annualTarget: 25000000 * 12, leadsTargetPct: 15, octLeads: 28, octClosing: 7 },
];

export const MITRA_AHLI = [
  { name: 'Toetiek Septriasih', specialty: 'Psikolog Klinis Senior', client: 64, sesi: 65, sesiOn: 45, sesiOff: 20 },
  { name: 'Ghassani Salsabila', specialty: 'Psikolog Klinis Dewasa', client: 31, sesi: 36, sesiOn: 26, sesiOff: 10 },
  { name: 'Irdha Zahra', specialty: 'Psikolog Klinis & Trauma', client: 30, sesi: 33, sesiOn: 23, sesiOff: 10 },
  { name: 'Efrida Sartika', specialty: 'Psikolog Pernikahan & Keluarga', client: 24, sesi: 26, sesiOn: 18, sesiOff: 8 },
  { name: 'Intan Kusuma', specialty: 'Psikolog Klinis', client: 11, sesi: 11, sesiOn: 8, sesiOff: 3 },
  { name: 'Vonny Permanasari', specialty: 'Psikolog Anak & Remaja', client: 8, sesi: 8, sesiOn: 6, sesiOff: 2 },
  { name: 'Muhammad Syibbli', specialty: 'Psikolog Klinis', client: 8, sesi: 10, sesiOn: 7, sesiOff: 3 },
  { name: 'Rizky Dianita', specialty: 'Psikolog Klinis', client: 7, sesi: 7, sesiOn: 5, sesiOff: 2 },
  { name: 'Ganda Mery', specialty: 'Psikolog Klinis', client: 7, sesi: 8, sesiOn: 6, sesiOff: 2 },
  { name: 'Anggiastri Hanantyasari', specialty: 'Psikolog Klinis', client: 5, sesi: 6, sesiOn: 4, sesiOff: 2 },
  { name: 'Faradila Azka', specialty: 'Psikolog Klinis', client: 4, sesi: 4, sesiOn: 3, sesiOff: 1 },
  { name: 'Munazilah', specialty: 'Psikolog Klinis', client: 2, sesi: 2, sesiOn: 2, sesiOff: 0 },
  { name: 'Alfia Noor', specialty: 'Psikolog Klinis', client: 2, sesi: 2, sesiOn: 2, sesiOff: 0 },
  { name: 'Immanuela Indraningtyas', specialty: 'Psikolog Klinis', client: 1, sesi: 1, sesiOn: 1, sesiOff: 0 },
  { name: 'Viniatry Utami', specialty: 'Psikolog Klinis', client: 1, sesi: 1, sesiOn: 1, sesiOff: 0 },
  { name: 'Gerdaning Tyas', specialty: 'Psikolog Klinis', client: 1, sesi: 1, sesiOn: 1, sesiOff: 0 },
  { name: 'Nurul Astria', specialty: 'Psikolog Klinis', client: 1, sesi: 1, sesiOn: 1, sesiOff: 0 },
  { name: 'Lady Christanty', specialty: 'Psikolog Klinis', client: 1, sesi: 1, sesiOn: 1, sesiOff: 0 },
];

export const LEAD_SOURCES = [
  { name: 'LANJUTAN', sesi: 206, nominal: 123100000 },
  { name: 'ORGANIC', sesi: 67, nominal: 52100000 },
  { name: 'WEB', sesi: 56, nominal: 50500000 },
  { name: 'ADS', sesi: 28, nominal: 23700000 },
  { name: 'REFERAL', sesi: 15, nominal: 6600000 },
  { name: 'IG', sesi: 5, nominal: 5300000 },
  { name: 'BO', sesi: 2, nominal: 579000 },
  { name: 'BC', sesi: 1, nominal: 473000 },
  { name: 'WAG', sesi: 1, nominal: 331500 },
];

// Multi-year macro trend (2024 - 2026) in Million IDR (sesuai data closing sheet)
export const MULTI_YEAR_ANNUAL = [
  { year: '2024', revenueJuta: 784, revenue: 783622400 },
  { year: '2025', revenueJuta: 1820, revenue: 1820382012 },
  { year: '2026', revenueJuta: 1849, revenue: 1849239002 },
];

// Monthly Cohort Table data (sesuai screenshot: bulan_tahun, Klien, Klien Baru, Total Klien, Klien Lanjutan, % Klien Lanjutan)
export const COHORT_MONTHLY_DATA = [
  { yearMonth: '2026-01', klien: 382, klienBaru: 272, totalKlien: 5124, klienLanjutan: 110, pctKlienLanjutan: 2.1 },
  { yearMonth: '2026-02', klien: 278, klienBaru: 155, totalKlien: 5279, klienLanjutan: 123, pctKlienLanjutan: 2.3 },
  { yearMonth: '2026-03', klien: 269, klienBaru: 153, totalKlien: 5432, klienLanjutan: 116, pctKlienLanjutan: 2.1 },
  { yearMonth: '2026-04', klien: 309, klienBaru: 199, totalKlien: 5631, klienLanjutan: 110, pctKlienLanjutan: 2.0 },
  { yearMonth: '2026-05', klien: 218, klienBaru: 118, totalKlien: 5749, klienLanjutan: 100, pctKlienLanjutan: 1.7 },
  { yearMonth: '2026-06', klien: 205, klienBaru: 121, totalKlien: 5870, klienLanjutan: 84, pctKlienLanjutan: 1.4 },
  { yearMonth: '2026-07', klien: 208, klienBaru: 102, totalKlien: 5972, klienLanjutan: 106, pctKlienLanjutan: 1.8 },
  { yearMonth: '2026-08', klien: 191, klienBaru: 87, totalKlien: 6059, klienLanjutan: 104, pctKlienLanjutan: 1.7 },
  { yearMonth: '2026-09', klien: 198, klienBaru: 107, totalKlien: 6166, klienLanjutan: 91, pctKlienLanjutan: 1.5 },
  { yearMonth: '2026-10', klien: 214, klienBaru: 119, totalKlien: 6285, klienLanjutan: 95, pctKlienLanjutan: 1.5 },
];

// Monthly Capacity & Conversion (sesuai grafik Sesi Tersedia vs Terjual dan Conversion Rate)
export const CAPACITY_MONTHLY_DATA = [
  { month: 1, monthLabel: 'Jan', sesi_terjual: 312, sesi_tersedia: 1444, conversionRate: 21.6 },
  { month: 2, monthLabel: 'Feb', sesi_terjual: 297, sesi_tersedia: 1199, conversionRate: 24.7 },
  { month: 3, monthLabel: 'Mar', sesi_terjual: 281, sesi_tersedia: 750, conversionRate: 37.5 },
  { month: 4, monthLabel: 'Apr', sesi_terjual: 295, sesi_tersedia: 1166, conversionRate: 25.3 },
  { month: 5, monthLabel: 'Mei', sesi_terjual: 285, sesi_tersedia: 993, conversionRate: 28.7 },
  { month: 6, monthLabel: 'Jun', sesi_terjual: 263, sesi_tersedia: 1023, conversionRate: 25.7 },
  { month: 7, monthLabel: 'Jul', sesi_terjual: 255, sesi_tersedia: 1328, conversionRate: 19.2 },
  { month: 8, monthLabel: 'Agu', sesi_terjual: 225, sesi_tersedia: 1018, conversionRate: 22.1 },
  { month: 9, monthLabel: 'Sep', sesi_terjual: 214, sesi_tersedia: 1138, conversionRate: 18.8 },
  { month: 10, monthLabel: 'Okt', sesi_terjual: 381, sesi_tersedia: 1420, conversionRate: 26.8 },
];

// Monthly Revenue Trend for SOP (All) and TA (in IDR) with MoM growth
export const MONTHLY_SOP_TA_SERIES = [
  { month: 1, monthLabel: 'Jan', revSOP: 291400000, revTA: 162900000, targetSOP: 325000000, targetTA: 185000000, momSOP: 0, momTA: 0 },
  { month: 2, monthLabel: 'Feb', revSOP: 283200000, revTA: 172300000, targetSOP: 325000000, targetTA: 185000000, momSOP: -2.8, momTA: 5.8 },
  { month: 3, monthLabel: 'Mar', revSOP: 317200000, revTA: 163900000, targetSOP: 325000000, targetTA: 185000000, momSOP: 12.0, momTA: -4.9 },
  { month: 4, monthLabel: 'Apr', revSOP: 323300000, revTA: 165100000, targetSOP: 325000000, targetTA: 185000000, momSOP: 1.9, momTA: 0.7 },
  { month: 5, monthLabel: 'Mei', revSOP: 294700000, revTA: 137300000, targetSOP: 325000000, targetTA: 185000000, momSOP: -8.8, momTA: -16.8 },
  { month: 6, monthLabel: 'Jun', revSOP: 353800000, revTA: 173500000, targetSOP: 325000000, targetTA: 185000000, momSOP: 20.1, momTA: 26.4 },
  { month: 7, monthLabel: 'Jul', revSOP: 296200000, revTA: 169700000, targetSOP: 325000000, targetTA: 185000000, momSOP: -16.3, momTA: -2.2 },
  { month: 8, monthLabel: 'Agu', revSOP: 351600000, revTA: 155400000, targetSOP: 325000000, targetTA: 185000000, momSOP: 18.7, momTA: -8.4 },
  { month: 9, monthLabel: 'Sep', revSOP: 311593500, revTA: 156229000, targetSOP: 320000000, targetTA: 185000000, momSOP: -11.4, momTA: 0.5 },
  { month: 10, monthLabel: 'Okt', revSOP: 342800000, revTA: 262683500, targetSOP: 325000000, targetTA: 185000000, momSOP: 10.0, momTA: 68.1 },
];

// Horizontal Stacked Bar by Sales (Monthly Jan-Oct) matching Business Performance center chart
export const SALES_MONTHLY_STACK_DATA = [
  {
    salesCode: 'Ms NUR',
    salesName: 'Mayang (Nur)',
    Jan: 41.3, Feb: 33.1, Mar: 38.5, Apr: 41.9, Mei: 26.5, Jun: 23.4, Jul: 35.3, Agu: 38.4, Sep: 24.3, Okt: 39.8,
  },
  {
    salesCode: 'Ms SHINTA',
    salesName: 'Yuni (Shinta)',
    Jan: 29.0, Feb: 34.4, Mar: 36.7, Apr: 32.6, Mei: 29.4, Jun: 32.5, Jul: 34.6, Agu: 33.1, Sep: 30.8, Okt: 36.2,
  },
  {
    salesCode: 'Ms AYU',
    salesName: 'Ayu',
    Jan: 27.6, Feb: 32.2, Mar: 35.2, Apr: 33.4, Mei: 35.1, Jun: 33.4, Jul: 28.7, Agu: 25.0, Sep: 39.8, Okt: 38.5,
  },
  {
    salesCode: 'Ms ARINA',
    salesName: 'Arina',
    Jan: 29.4, Feb: 28.5, Mar: 24.3, Apr: 21.0, Mei: 24.6, Jun: 28.2, Jul: 30.1, Agu: 24.3, Sep: 23.1, Okt: 29.4,
  },
  {
    salesCode: 'Ms YUYUN',
    salesName: 'Yuyun',
    Jan: 23.1, Feb: 21.1, Mar: 17.6, Apr: 19.3, Mei: 20.9, Jun: 42.6, Jul: 25.7, Agu: 27.1, Sep: 21.4, Okt: 31.8,
  },
  {
    salesCode: 'Ms LULU',
    salesName: 'Lulu',
    Jan: 18.1, Feb: 19.2, Mar: 15.6, Apr: 23.2, Mei: 19.0, Jun: 9.6, Jul: 6.7, Agu: 11.4, Sep: 14.8, Okt: 18.4,
  },
];

function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function generateDummyDataset() {
  const transactions = [];
  let txId = 1;

  // Generate transactions for 2026 (Jan to Oct 25) calibrated so October MTD = Rp 262.683.500 & 381 Sesi
  // and September MTD = Rp 99.654.500 & 149 Sesi
  for (let month = 1; month <= 10; month++) {
    const maxDay = month === 10 ? 25 : 28;
    for (let day = 1; day <= maxDay; day++) {
      const dateStr = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const s = month * 1000 + day * 37;

      PRODUCTS.forEach((prod, pIdx) => {
        const targetMonthSesi = month === 10 ? prod.octSesi : month === 9 ? prod.sepSesi : Math.round(prod.octSesi * 0.72);
        // Distribute sessions across days in the month deterministically
        const basePerDay = Math.floor(targetMonthSesi / maxDay);
        const remainder = targetMonthSesi % maxDay;
        const sesiToday = basePerDay + (day <= remainder ? 1 : 0);

        if (sesiToday > 0) {
          const salesObj = SALES_TEAM[(pIdx + day) % SALES_TEAM.length];
          const mitraObj = MITRA_AHLI[(pIdx + day * 2) % MITRA_AHLI.length];
          const srcObj = LEAD_SOURCES[(pIdx + day) % LEAD_SOURCES.length];

          // Calibrate exact October & September revenue totals
          let unitPrice = prod.price;
          if (month === 10) {
            unitPrice = Math.round((262683500 / 381));
          } else if (month === 9) {
            unitPrice = Math.round((99654500 / 149));
          }

          transactions.push({
            id: `TX-${txId++}`,
            date: dateStr,
            year: 2026,
            month,
            day,
            client_id: `CL-2026-${(month * 100 + day * 7 + pIdx) % 320}`,
            is_new_client: seededRandom(s + pIdx) > 0.35,
            service_type: prod.service,
            status_terjual: 'Terjual',
            segment: prod.segment,
            product_name: prod.name,
            sales_name: salesObj.name,
            mitra_name: mitraObj.name,
            mitra_specialty: mitraObj.specialty,
            session_mode: (day + pIdx) % 3 === 0 ? 'OFF' : 'ON',
            sessions_count: sesiToday,
            revenue: sesiToday * unitPrice,
            source: srcObj.name,
          });
        }
      });
    }
  }

  return {
    mode: 'dummy',
    lastUpdated: '2026-10-25T01:15:00+07:00',
    transactions,
    productsCatalog: PRODUCTS,
    salesTeam: SALES_TEAM,
    mitraCatalog: MITRA_AHLI,
    leadSourcesCatalog: LEAD_SOURCES,
    multiYearAnnual: MULTI_YEAR_ANNUAL,
    cohortMonthly: COHORT_MONTHLY_DATA,
    capacityMonthly: CAPACITY_MONTHLY_DATA,
    monthlySopTaSeries: MONTHLY_SOP_TA_SERIES,
    salesMonthlyStack: SALES_MONTHLY_STACK_DATA,
    targets: {
      targetBulananAll: 320000000,
      targetPersentaseLeads: 15,
      targetTA: 180000000,
      mtdTargetMarketing: 180000000,
      annualTargetMarketing: 2295000000,
      annualActualYTD: 1481492250,
      ytd2025JanSep: 1823971250,
      ytd2026JanSep: 2750102587,
      sopMtdActual: 311593500,
      sopMtdTarget: 320000000,
      sopYtdActual: 2750102587,
      sopYtdTarget: 3700000000,
      taMtdActual: 156229000,
      taMtdTarget: 180000000,
      taYtdActual: 1445057050,
      taYtdTarget: 2485200000,
    },
  };
}

export function getMonthShortName(monthNumber) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return names[(monthNumber - 1) % 12] || '';
}

export function getMonthFullName(monthNumber) {
  const names = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return names[(monthNumber - 1) % 12] || '';
}
