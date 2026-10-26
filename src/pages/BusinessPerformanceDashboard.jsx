import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { getMonthShortName } from '../data/mockData';
import {
  computeBusinessPerformanceAnalytics,
  formatIDR,
  formatNumber,
  formatPct,
  CLAY_THEME_COLORS,
  HARMONIOUS_SERIES_PALETTE,
} from '../utils/analyticsEngine';

export default function BusinessPerformanceDashboard({
  dataset,
  selectedMonth = 9,
  targetConfig,
}) {
  const [stackMode, setStackMode] = useState('revenue'); // 'revenue' or 'percentage'

  const analytics = useMemo(
    () => computeBusinessPerformanceAnalytics(dataset, selectedMonth, targetConfig),
    [dataset, selectedMonth, targetConfig]
  );

  const {
    multiYearAnnual,
    ytdComparison,
    sopMetrics,
    taMetrics,
    monthlySopTaSeries,
    activeMonths,
    salesHorizontalStacked,
    salesPerformanceCards,
    clientRetentionTable,
    capacityMonthly,
  } = analytics;

  const ytdCompareBars = [
    {
      name: `YTD Jan–${getMonthShortName(selectedMonth)} 2025`,
      revenue: ytdComparison.ytd2025,
      fill: CLAY_THEME_COLORS.blue,
    },
    {
      name: `YTD Jan–${getMonthShortName(selectedMonth)} 2026`,
      revenue: ytdComparison.ytd2026,
      fill: CLAY_THEME_COLORS.green,
    },
  ];

  const sopMtdBars = [
    { name: 'SOP Revenue', value: sopMetrics.mtdActual, fill: CLAY_THEME_COLORS.blue },
    { name: 'Target All', value: sopMetrics.mtdTarget, fill: CLAY_THEME_COLORS.green },
  ];

  const sopYtdBars = [
    { name: 'SOP Revenue', value: sopMetrics.ytdActual, fill: CLAY_THEME_COLORS.coral },
    { name: 'Target', value: sopMetrics.ytdTarget, fill: CLAY_THEME_COLORS.green },
  ];

  const taMtdBars = [
    { name: 'TA Revenue', value: taMetrics.mtdActual, fill: CLAY_THEME_COLORS.blue },
    { name: 'Target TA', value: taMetrics.mtdTarget, fill: CLAY_THEME_COLORS.green },
  ];

  const taYtdBars = [
    { name: 'TA Revenue', value: taMetrics.ytdActual, fill: CLAY_THEME_COLORS.coral },
    { name: 'Target', value: taMetrics.ytdTarget, fill: CLAY_THEME_COLORS.green },
  ];

  return (
    <div>
      {/* SECTION 1: MACRO & MULTI-YEAR AT A GLANCE */}
      <div className="mb-section-heading">
        <span>Pertumbuhan Tahunan & Perbandingan YTD</span>
      </div>

      <div className="grid-charts-12">
        {/* Trend Line Chart Annual (2020 - 2026 *dalam juta) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Tren Pertumbuhan Pendapatan Tahunan · {multiYearAnnual[0]?.year || '2024'} –{' '}
                {multiYearAnnual[multiYearAnnual.length - 1]?.year || '2026'}
              </div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Revenue Tahunan (Juta IDR)
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 255 }}>
            <ResponsiveContainer>
              <LineChart data={multiYearAnnual} margin={{ top: 12, right: 20, left: 6, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="year"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <Tooltip
                  formatter={(v) => [`Rp ${formatNumber(v)} Juta`, 'Revenue']}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenueJuta"
                  name="Revenue (Juta Rp)"
                  stroke={CLAY_THEME_COLORS.blue}
                  strokeWidth={2.4}
                  dot={{ r: 3.5, fill: CLAY_THEME_COLORS.blue }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Comparison YTD Jan-Sep 2025 vs YTD Jan-Sep 2026 */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Revenue Comparison
              </div>
              <div className="mb-inline-legend">
                <span className="mb-delta up">
                  ↑ +{formatPct(ytdComparison.ytdGrowthPct, false, 2)} (+{formatIDR(ytdComparison.ytdGapNominal)})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 255 }}>
            <ResponsiveContainer>
              <BarChart data={ytdCompareBars} margin={{ top: 20, right: 20, left: 10, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#4C5773', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatIDR(v, true)}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <Tooltip
                  formatter={(v) => formatIDR(v)}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Revenue YTD" barSize={64}>
                  {ytdCompareBars.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    formatter={(v) => formatIDR(v, true)}
                    style={{ fontSize: 11, fontWeight: 700, fill: '#2E353B' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: PERFORMANCE - SOP (ALL) */}
      <div className="mb-section-heading">
        <span>Performance - SOP</span>
      </div>

      <div className="grid-kpi-3">
        {/* MTD vs Target Bulanan (SOP) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">MTD vs Target Bulanan ({selectedMonth}/2026) - SOP</div>
              <div className="mb-inline-legend">
                <span>Aktual: {formatNumber(sopMetrics.mtdActual)} ({formatPct(sopMetrics.mtdPct, false, 1)})</span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={sopMtdBars} margin={{ top: 18, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 11, fill: '#4C5773' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="value" barSize={52}>
                  {sopMtdBars.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v) => formatIDR(v, true)} style={{ fontSize: 10, fontWeight: 700, fill: '#2E353B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* YTD vs Target Tahunan (SOP) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">YTD vs Target Tahunan (s.d {selectedMonth}/2026) - SOP</div>
              <div className="mb-inline-legend">
                <span>Aktual: {formatNumber(sopMetrics.ytdActual)} ({formatPct(sopMetrics.ytdPct, false, 1)})</span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={sopYtdBars} margin={{ top: 18, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 11, fill: '#4C5773' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="value" barSize={52}>
                  {sopYtdBars.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v) => formatIDR(v, true)} style={{ fontSize: 10, fontWeight: 700, fill: '#2E353B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tren Revenue SOP */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Tren Revenue Bulanan - SOP</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  SOP Revenue
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.green }} />
                  Average Keseluruhan ({formatIDR(sopMetrics.avgMonthly, true)})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthlySopTaSeries} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="monthLabel" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 10, fill: '#74838F' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revSOP" name="Revenue SOP" stroke={CLAY_THEME_COLORS.blue} strokeWidth={2.2} fill="#EEF6FC" />
                <Line type="monotone" dataKey="avgSOP" name="Average SOP" stroke={CLAY_THEME_COLORS.green} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: PERFORMANCE - TA SEGMENT */}
      <div className="mb-section-heading">
        <span>Performance - TA</span>
      </div>

      <div className="grid-kpi-3">
        {/* MTD vs Target Bulanan (TA) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">MTD vs Target Bulanan ({selectedMonth}/2026) - TA</div>
              <div className="mb-inline-legend">
                <span>Aktual: {formatNumber(taMetrics.mtdActual)} ({formatPct(taMetrics.mtdPct, false, 1)})</span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={taMtdBars} margin={{ top: 18, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 11, fill: '#4C5773' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="value" barSize={52}>
                  {taMtdBars.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v) => formatIDR(v, true)} style={{ fontSize: 10, fontWeight: 700, fill: '#2E353B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* YTD vs Target Tahunan (TA) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">YTD vs Target Tahunan (s.d {selectedMonth}/2026) - TA</div>
              <div className="mb-inline-legend">
                <span>Aktual: {formatNumber(taMetrics.ytdActual)} ({formatPct(taMetrics.ytdPct, false, 1)})</span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={taYtdBars} margin={{ top: 18, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 11, fill: '#4C5773' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="value" barSize={52}>
                  {taYtdBars.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v) => formatIDR(v, true)} style={{ fontSize: 10, fontWeight: 700, fill: '#2E353B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tren Revenue TA */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Tren Revenue Bulanan - TA</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  TA Revenue
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.green }} />
                  Average Bulanan ({formatIDR(taMetrics.avgMonthly, true)})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <ComposedChart data={monthlySopTaSeries} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="monthLabel" axisLine={{ stroke: '#E2E8F0' }} tickLine={false} tick={{ fontSize: 10, fill: '#74838F' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatIDR(v, true)} tick={{ fontSize: 10, fill: '#74838F' }} />
                <Tooltip formatter={(v) => formatIDR(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revTA" name="Revenue TA" stroke={CLAY_THEME_COLORS.blue} strokeWidth={2.2} fill="#EEF6FC" />
                <Line type="monotone" dataKey="avgTA" name="Average Bulanan TA" stroke={CLAY_THEME_COLORS.green} strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: KONTRIBUSI SALES YTD, RETENSI KLIEN & TARGET INDIVIDUAL SALES */}
      <div className="mb-section-heading">
        <span>Kontribusi Revenue, Retensi Klien & Target Individual Sales</span>
      </div>

      {/* Side-by-side: Stacked Bar by Sales YTD & Sesi Tersedia vs Terjual + Conversion Rate */}
      <div className="grid-charts-2">
        {/* Stacked Bar by Sales YTD */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Detail Revenue per Sales ({stackMode === 'revenue' ? 'Nominal jt' : 'Percentage %'})
              </div>
              <div className="mb-inline-legend">
                {activeMonths.map((mKey, idx) => (
                  <span key={mKey} className="mb-legend-item">
                    <span
                      className="mb-legend-dot"
                      style={{ background: HARMONIOUS_SERIES_PALETTE[idx % HARMONIOUS_SERIES_PALETTE.length] }}
                    />
                    {mKey}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="mini-toggle-group">
                <button
                  className={`mini-toggle-btn ${stackMode === 'revenue' ? 'active' : ''}`}
                  onClick={() => setStackMode('revenue')}
                >
                  Nominal
                </button>
                <button
                  className={`mini-toggle-btn ${stackMode === 'percentage' ? 'active' : ''}`}
                  onClick={() => setStackMode('percentage')}
                >
                  %
                </button>
              </div>
              <span className="mb-dots">...</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <BarChart
                data={salesHorizontalStacked}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(v) => (stackMode === 'revenue' ? `${v}jt` : `${v}%`)}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  dataKey="salesCode"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={82}
                  tick={{ fontSize: 11, fill: '#4C5773', fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(v, name) =>
                    stackMode === 'revenue' ? [`Rp ${v}jt`, name] : [`${v}%`, name]
                  }
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                {activeMonths.map((mKey, idx) => (
                  <Bar
                    key={mKey}
                    dataKey={stackMode === 'revenue' ? mKey : `${mKey}_pct`}
                    name={mKey}
                    stackId="csStack"
                    fill={HARMONIOUS_SERIES_PALETTE[idx % HARMONIOUS_SERIES_PALETTE.length]}
                    barSize={22}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-table-footer" style={{ justifyContent: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            {salesHorizontalStacked.map((s) => (
              <span key={s.salesCode}>
                <strong style={{ color: '#2E353B' }}>{s.salesCode}:</strong> {s.totalJuta}jt (Avg: {s.avgJuta}jt)
              </span>
            ))}
          </div>
        </div>

        {/* Sesi Tersedia vs Terjual & Conversion Rate (Dummy Data) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Sesi Tersedia vs Terjual & Conversion Rate</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.teal }} />
                  Sesi Tersedia
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Sesi Terjual
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.coral }} />
                  Conversion Rate (%)
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <ComposedChart data={capacityMonthly} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <Tooltip
                  formatter={(v, name) =>
                    name.includes('Conversion') ? [`${v}%`, name] : [`${v} Sesi`, name]
                  }
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="sesi_tersedia"
                  name="Sesi Tersedia"
                  stackId="sesiStack"
                  fill={CLAY_THEME_COLORS.teal}
                  barSize={24}
                />
                <Bar
                  yAxisId="left"
                  dataKey="sesi_terjual"
                  name="Sesi Terjual"
                  stackId="sesiStack"
                  fill={CLAY_THEME_COLORS.blue}
                  barSize={24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate"
                  stroke={CLAY_THEME_COLORS.coral}
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: CLAY_THEME_COLORS.coral }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-table-footer" style={{ justifyContent: 'space-between' }}>
            <span>*Menggunakan data simulasi sementara hingga data kapasitas sesi tersedia</span>
            <span>{capacityMonthly.length} months</span>
          </div>
        </div>
      </div>

      {/* 2 Side-by-side Tables: Client Retention Table (Unchanged) & Sales Performance Table */}
      <div className="grid-charts-2">
        {/* Client Cohort Table (Unchanged per user instruction) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Retensi & Pertumbuhan Klien</span>
            <span className="mb-dots">...</span>
          </div>

          <div className="mb-table-wrap">
            <table className="mb-table">
              <thead>
                <tr>
                  <th>bulan_tahun</th>
                  <th className="num">Klien</th>
                  <th className="num">Klien Baru</th>
                  <th className="num">Total Klien</th>
                  <th className="num">Klien Lanjutan</th>
                  <th className="num">% Klien Lanjutan</th>
                </tr>
              </thead>
              <tbody>
                {clientRetentionTable.map((row) => (
                  <tr key={row.yearMonth}>
                    <td className="link-col">{row.yearMonth}</td>
                    <td className="num">{row.klien}</td>
                    <td className="num">{row.klienBaru}</td>
                    <td className="num">{formatNumber(row.totalKlien)}</td>
                    <td className="num">{row.klienLanjutan}</td>
                    <td className="num">{row.pctKlienLanjutan.toString().replace('.', ',')}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mb-table-footer">{clientRetentionTable.length} months</div>
        </div>

        {/* By Sales MTD Rev vs Target & YTD Rev vs Annual Target */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Sales Performance - MTD Revenue vs Target & YTD vs Annual Target</span>
            <span className="mb-dots">...</span>
          </div>

          <div className="mb-table-wrap">
            <table className="mb-table">
              <thead>
                <tr>
                  <th>Sales</th>
                  <th className="num">MTD Rev</th>
                  <th className="num">MTD Target</th>
                  <th className="num">% MTD</th>
                  <th className="num">YTD Rev</th>
                  <th className="num">Annual Target</th>
                  <th className="num">% YTD</th>
                </tr>
              </thead>
              <tbody>
                {salesPerformanceCards.map((s) => (
                  <tr key={s.salesCode}>
                    <td className="link-col">
                      {s.salesCode} ({s.salesName})
                    </td>
                    <td className="num">{formatIDR(s.mtdRev, true)}</td>
                    <td className="num">{formatIDR(s.mtdTarget, true)}</td>
                    <td className="num">
                      <span className={`mb-delta ${s.mtdPct >= 75 ? 'up' : 'down'}`}>
                        {formatPct(s.mtdPct, false, 1)}
                      </span>
                    </td>
                    <td className="num">{formatIDR(s.ytdRev, true)}</td>
                    <td className="num">{formatIDR(s.annualTarget, true)}</td>
                    <td className="num">{formatPct(s.ytdPct, false, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mb-table-footer">{salesPerformanceCards.length} sales reps</div>
        </div>
      </div>
    </div>
  );
}
