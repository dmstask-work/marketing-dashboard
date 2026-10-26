import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import {
  computeMarketingAnalytics,
  formatIDR,
  formatGapIDR,
  formatNumber,
  formatPct,
  CLAY_THEME_COLORS,
} from '../utils/analyticsEngine';

export default function MarketingDashboard({
  dataset,
  filters,
  setFilters,
  targetConfig,
}) {
  const analytics = React.useMemo(
    () => computeMarketingAnalytics(dataset, filters, targetConfig),
    [dataset, filters, targetConfig]
  );

  const {
    kpis,
    periodInfo,
    dynamicHighlights,
    trendSeries,
    topTenProductsBySesi,
    compareProductsChartData,
    sourceStats,
    topProductPerformanceTable,
    productComparisonTable,
    leadsBySalesTable,
    totalLeadsSummary,
  } = analytics;

  return (
    <div>
      {/* SECTION 1: PROGRAM AT A GLANCE (6 METABASE KPI CARDS) */}
      <div className="mb-section-heading">
        <span>
          Summary, Trend & Acquisition Source
        </span>
      </div>

      <div className="grid-kpi-6">
        {/* Card 1: Nominal MTD */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Nominal ({periodInfo.currentMonthShort} MTD)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{formatNumber(kpis.revenueMTD)}</div>
            <div className="mb-kpi-sub">
              <span className={`mb-delta ${kpis.revenueGrowthPct >= 0 ? 'up' : 'down'}`}>
                {kpis.revenueGrowthPct >= 0 ? '↑' : '↓'} {formatPct(kpis.revenueGrowthPct, false, 1)}
              </span>
              <span>vs {formatNumber(kpis.revenueLastMTD)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Sesi MTD */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Sesi ({periodInfo.currentMonthShort} MTD)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{formatNumber(kpis.sesiMTD)}</div>
            <div className="mb-kpi-sub">
              <span className={`mb-delta ${kpis.sesiGrowthPct >= 0 ? 'up' : 'down'}`}>
                {kpis.sesiGrowthPct >= 0 ? '↑' : '↓'} {formatPct(kpis.sesiGrowthPct, false, 1)}
              </span>
              <span>vs {formatNumber(kpis.sesiLastMTD)} sesi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ticket Size */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Ticket Size</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{formatIDR(kpis.ticketSizeMTD, true)}</div>
            <div className="mb-kpi-sub">
              <span className={`mb-delta ${kpis.ticketSizeGrowthPct >= 0 ? 'up' : 'down'}`}>
                {kpis.ticketSizeGrowthPct >= 0 ? '↑' : '↓'}{' '}
                {formatPct(Math.abs(kpis.ticketSizeGrowthPct), false, 1)}
              </span>
              <span>vs {formatIDR(kpis.ticketSizeLastMTD, true)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Nominal vs Target TA */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Nominal vs Target TA</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{formatPct(kpis.mtdVsTargetPct, false, 1)}</div>
            <div className="mb-progress-track">
              <div
                className="mb-progress-fill"
                style={{
                  width: `${Math.min(100, kpis.mtdVsTargetPct)}%`,
                  backgroundColor: CLAY_THEME_COLORS.green,
                }}
              />
            </div>
            <div className="mb-kpi-sub">
              <span>Target TA: {formatNumber(kpis.targetMonthly)}</span>
            </div>
          </div>
        </div>

        {/* Card 5: GAP Revenue */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">GAP Revenue (Target TA)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className={`mb-kpi-number ${kpis.gapMonthlyRevenue <= 0 ? 'green' : 'coral'}`}>
              {formatGapIDR(kpis.gapMonthlyRevenue)}
            </div>
            <div className="mb-kpi-sub">
              <span>
                {kpis.gapMonthlyRevenue <= 0 ? 'Melampaui Target TA' : 'Kurang dari Target TA'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 6: Nominal Annual (YTD) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">Nominal Annual (YTD)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number" style={{ fontSize: '1.3rem' }}>
              {formatNumber(kpis.revenueAnnualYTD)}
            </div>
            <div className="mb-progress-track">
              <div
                className="mb-progress-fill"
                style={{
                  width: `${Math.min(100, kpis.revAnnualVsTargetPct)}%`,
                  backgroundColor: CLAY_THEME_COLORS.coral,
                }}
              />
            </div>
            <div className="mb-kpi-sub">
              <span className="mb-delta down">{formatPct(kpis.revAnnualVsTargetPct, false, 1)}</span>
              <span>dari {formatIDR(kpis.targetAnnual, true)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-charts-2">
        {/* Chart 1: Tren Penjualan (by Revenue) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Tren Penjualan (by Revenue) - {periodInfo.currentMonthName} vs {periodInfo.prevMonthName}
              </div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Nominal {filters.trendGranularity === 'weekly' ? 'Mingguan' : 'Harian'} ({periodInfo.currentMonthName})
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.coral }} />
                  Nominal {filters.trendGranularity === 'weekly' ? 'Mingguan' : 'Harian'} ({periodInfo.prevMonthName})
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="mini-toggle-group">
                <button
                  className={`mini-toggle-btn ${filters.trendGranularity === 'daily' ? 'active' : ''}`}
                  onClick={() => setFilters((prev) => ({ ...prev, trendGranularity: 'daily' }))}
                >
                  Daily
                </button>
                <button
                  className={`mini-toggle-btn ${filters.trendGranularity === 'weekly' ? 'active' : ''}`}
                  onClick={() => setFilters((prev) => ({ ...prev, trendGranularity: 'weekly' }))}
                >
                  Weekly
                </button>
              </div>
              <span className="mb-dots">...</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <LineChart data={trendSeries} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatIDR(v, true)}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                  width={60}
                />
                <Tooltip
                  formatter={(val, name, props) => {
                    if (name.includes(periodInfo.currentMonthName)) {
                      const spike = props?.payload?.spikeMTD || 0;
                      const spikeSign = spike > 0 ? '+' : '';
                      return [
                        `${formatIDR(val)} (Δ ${spikeSign}${formatIDR(spike, true)})`,
                        name,
                      ];
                    }
                    return [formatIDR(val), name];
                  }}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="nominalMTD"
                  name={`Nominal (${periodInfo.currentMonthName})`}
                  stroke={CLAY_THEME_COLORS.blue}
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: CLAY_THEME_COLORS.blue }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="nominalLastMTD"
                  name={`Nominal (${periodInfo.prevMonthName})`}
                  stroke={CLAY_THEME_COLORS.coral}
                  strokeWidth={2}
                  dot={{ r: 2, fill: CLAY_THEME_COLORS.coral }}
                  activeDot={{ r: 4.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Nominal and Sesi by Source */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Nominal & Sesi by Source - {periodInfo.currentMonthName}</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.indigo }} />
                  Sesi
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.green }} />
                  Nominal (Revenue)
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <ComposedChart data={sourceStats} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="source"
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
                  tickFormatter={(v) => formatIDR(v, true)}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <Tooltip
                  formatter={(val, name) =>
                    name.includes('Nominal') ? formatIDR(val) : `${val} Sesi`
                  }
                  contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="sesi"
                  name="Sesi"
                  fill={CLAY_THEME_COLORS.indigo}
                  barSize={34}
                >
                  <LabelList
                    dataKey="sesi"
                    position="top"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#2E353B' }}
                  />
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Nominal"
                  stroke={CLAY_THEME_COLORS.green}
                  strokeWidth={2.2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: DISTRIBUSI & PERBANDINGAN PRODUK (DYNAMIC MONTH NAMES) */}
      <div className="mb-section-heading">
        <span>
          Performa & Perbandingan Produk Terjual ({periodInfo.currentMonthName} vs {periodInfo.prevMonthName})
        </span>
      </div>

      <div className="grid-charts-2">
        {/* Top 10 Produk Terjual */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Top 10 Produk Terjual - {periodInfo.currentMonthName} (by Sesi)
              </div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Sesi Terjual ({periodInfo.currentMonthName})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 295 }}>
            <ResponsiveContainer>
              <BarChart
                data={topTenProductsBySesi}
                layout="vertical"
                margin={{ top: 4, right: 36, left: 12, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={150}
                  tick={{ fontSize: 11, fill: '#4C5773' }}
                />
                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar
                  dataKey="sesiMTD"
                  name={`Sesi ${periodInfo.currentMonthName}`}
                  fill={CLAY_THEME_COLORS.blue}
                  barSize={16}
                >
                  <LabelList
                    dataKey="sesiMTD"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 600, fill: '#4C5773' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compare Product Terjual: Dynamic Month Names */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">
                Compare Produk Terjual - Sesi {periodInfo.currentMonthName} vs Sesi {periodInfo.prevMonthName}
              </div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Sesi {periodInfo.currentMonthName} (MTD)
                </span>
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.teal }} />
                  Sesi {periodInfo.prevMonthName} (Last MTD)
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 295 }}>
            <ResponsiveContainer>
              <BarChart
                data={compareProductsChartData}
                margin={{ top: 16, right: 12, left: 0, bottom: 16 }}
              >
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="shortName"
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#4C5773' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar
                  dataKey="sesiMTD"
                  name={`Sesi ${periodInfo.currentMonthName}`}
                  fill={CLAY_THEME_COLORS.blue}
                >
                  <LabelList dataKey="sesiMTD" position="top" style={{ fontSize: 10, fontWeight: 700, fill: '#2E353B' }} />
                </Bar>
                <Bar
                  dataKey="sesiLastMTD"
                  name={`Sesi ${periodInfo.prevMonthName}`}
                  fill={CLAY_THEME_COLORS.teal}
                >
                  <LabelList dataKey="sesiLastMTD" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#74838F' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: RINCIAN TABEL PRODUK & LEADS BY SALES (DYNAMIC MONTH HEADERS) */}
      <div className="mb-section-heading">
        <span>Tabel Rincian Produk & Konversi Leads Sales</span>
      </div>

      <div className="grid-charts-2">
        {/* Table 1: Top Produk Performance (MTD) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">
              Top Produk Performance - {periodInfo.currentMonthName} MTD
            </span>
            <span className="mb-dots">...</span>
          </div>

          <div className="mb-table-wrap" style={{ maxHeight: 330, overflowY: 'auto' }}>
            <table className="mb-table">
              <thead>
                <tr>
                  <th>Jenis Produk</th>
                  <th>Layanan</th>
                  <th className="num">Sesi ({periodInfo.currentMonthShort})</th>
                  <th className="num">Nominal</th>
                  <th className="num">% Kontribusi</th>
                </tr>
              </thead>
              <tbody>
                {topProductPerformanceTable.map((item) => (
                  <tr key={item.productName}>
                    <td className="link-col">{item.productName}</td>
                    <td>{item.serviceType}</td>
                    <td className="num">{item.sesiMTD}</td>
                    <td className="num">{formatNumber(item.revenueMTD)}</td>
                    <td className="num">{formatPct(item.contributionPct, false, 2)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2}>Grand total</td>
                  <td className="num">
                    {topProductPerformanceTable.reduce((s, i) => s + i.sesiMTD, 0)}
                  </td>
                  <td className="num">
                    {formatNumber(
                      topProductPerformanceTable.reduce((s, i) => s + i.revenueMTD, 0)
                    )}
                  </td>
                  <td className="num">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-table-footer">{topProductPerformanceTable.length} rows</div>
        </div>

        {/* Table 2: Perbandingan Produk Terjual Bulan Ini vs Bulan Lalu (Dynamic Month Columns) */}
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">
              Perbandingan Produk Terjual - {periodInfo.currentMonthName} vs {periodInfo.prevMonthName}
            </span>
            <span className="mb-dots">...</span>
          </div>

          <div className="mb-table-wrap" style={{ maxHeight: 330, overflowY: 'auto' }}>
            <table className="mb-table">
              <thead>
                <tr>
                  <th>Jenis Produk</th>
                  <th className="num">Sesi {periodInfo.currentMonthName}</th>
                  <th className="num">Sesi {periodInfo.prevMonthName}</th>
                  <th className="num">Growth</th>
                </tr>
              </thead>
              <tbody>
                {productComparisonTable.map((item) => (
                  <tr key={item.productName}>
                    <td className="link-col">{item.productName}</td>
                    <td className="num">{item.sesiMTD}</td>
                    <td className="num">{item.sesiLastMTD}</td>
                    <td className="num">
                      <span className={`mb-delta ${item.growthPct >= 0 ? 'up' : 'down'}`}>
                        {formatPct(item.growthPct, false, 2)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Grand total</td>
                  <td className="num">
                    {productComparisonTable.reduce((s, i) => s + i.sesiMTD, 0)}
                  </td>
                  <td className="num">
                    {productComparisonTable.reduce((s, i) => s + i.sesiLastMTD, 0)}
                  </td>
                  <td className="num">{formatPct(kpis.sesiGrowthPct, false, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mb-table-footer">{productComparisonTable.length} rows</div>
        </div>
      </div>

      {/* Full-width Clean Table: Leads by Sales */}
      <div className="mb-card">
        <div className="mb-card-top">
          <span className="mb-card-title">
            Leads & Closing by Sales - {periodInfo.currentMonthName} MTD
          </span>
          <span className="mb-dots">...</span>
        </div>

        <div className="mb-table-wrap">
          <table className="mb-table">
            <thead>
              <tr>
                <th>Sales</th>
                <th className="num">Leads</th>
                <th className="num">Closing</th>
                <th className="num">% Closing by Leads</th>
                <th className="num">% Target</th>
                <th className="num">Target (Closing)</th>
              </tr>
            </thead>
            <tbody>
              {leadsBySalesTable.map((row) => (
                <tr key={row.salesName}>
                  <td className="link-col">{row.salesName}</td>
                  <td className="num">{row.jumlahLeads}</td>
                  <td className="num">{row.closing}</td>
                  <td className="num">{formatPct(row.pctLeadsClosing, false, 2)}</td>
                  <td className="num">{formatPct(row.targetPct, false, 0)}</td>
                  <td className="num">{row.targetNumber}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>{totalLeadsSummary.salesName}</td>
                <td className="num">{totalLeadsSummary.jumlahLeads}</td>
                <td className="num">{totalLeadsSummary.closing}</td>
                <td className="num">{formatPct(totalLeadsSummary.pctLeadsClosing, false, 2)}</td>
                <td className="num">{formatPct(totalLeadsSummary.targetPct, false, 0)}</td>
                <td className="num">{totalLeadsSummary.targetNumber}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-table-footer">{leadsBySalesTable.length} sales reps</div>
      </div>
    </div>
  );
}
