import React, { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getMonthShortName, getMonthFullName } from '../data/mockData';
import {
  computeLeaderboardAnalytics,
  CLAY_THEME_COLORS,
} from '../utils/analyticsEngine';

export default function LeaderboardMitraDashboard({
  dataset,
  selectedMonth = 10,
  sessionMode = 'ALL',
}) {
  const leaderboardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const analytics = useMemo(
    () =>
      computeLeaderboardAnalytics(dataset, {
        month: selectedMonth,
        sessionMode,
      }),
    [dataset, selectedMonth, sessionMode]
  );

  const { summaryKpis, rankedTable, top5ByClient, top5BySesi } = analytics;
  const monthFull = getMonthFullName(selectedMonth);

  const handleDownloadPdf = async () => {
    if (!leaderboardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const element = leaderboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F4F6F9',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`Leaderboard_Mitra_Ahli_${monthFull}_2026_${sessionMode}.pdf`);
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div ref={leaderboardRef}>
      {/* SECTION 1: AT A GLANCE KPI & TOP 5 PSYCHOLOGISTS CHARTS */}
      <div className="mb-section-heading">
        <span>Ringkasan Sesi & Top 5 Mitra Ahli ({monthFull} 2026 - Mode: {sessionMode})</span>
        <button
          className="mb-btn-filter"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          data-html2canvas-ignore="true"
          title="Download Leaderboard Mitra Ahli sebagai PDF"
        >
          <Download size={14} />
          <span>{isDownloading ? 'Mengunduh PDF...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* 2 Summary KPI Cards */}
      <div className="grid-kpi-2" style={{ marginBottom: 14 }}>
        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">SESSION ON/OFF ({getMonthShortName(selectedMonth)} 2026)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{summaryKpis.totalAllSessions}</div>
            <div className="mb-kpi-sub">
              <span>Total Sesi Terjual ({sessionMode})</span>
            </div>
          </div>
        </div>

        <div className="mb-card">
          <div className="mb-card-top">
            <span className="mb-card-title">CLIENT ({getMonthShortName(selectedMonth)} 2026)</span>
            <span className="mb-dots">...</span>
          </div>
          <div className="mb-kpi-center">
            <div className="mb-kpi-number">{summaryKpis.totalAllClients}</div>
            <div className="mb-kpi-sub">
              <span>Total Klien Ditangani</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Side-by-side Bar Charts (Top 5 Clients & Top 5 Sessions) */}
      <div className="grid-charts-2">
        {/* Chart 1: Top 5 Psychologists with the Most Clients */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Top 5 Psychologists with the Most Clients - {monthFull}</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.blue }} />
                  Klien ({monthFull})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={top5ByClient}
                layout="vertical"
                margin={{ top: 6, right: 36, left: 10, bottom: 6 }}
              >
                <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  domain={[0, 75]}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  dataKey="mitraName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={135}
                  tick={{ fontSize: 11, fill: '#4C5773', fontWeight: 500 }}
                />
                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="totalClient" name="Klien" fill={CLAY_THEME_COLORS.blue} barSize={20}>
                  <LabelList
                    dataKey="totalClient"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#4C5773' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top 5 Psychologists with the Most Session */}
        <div className="mb-card">
          <div className="mb-card-top">
            <div>
              <div className="mb-card-title">Top 5 Psychologists with the Most Session - ({sessionMode})</div>
              <div className="mb-inline-legend">
                <span className="mb-legend-item">
                  <span className="mb-legend-dot" style={{ background: CLAY_THEME_COLORS.coral }} />
                  Total Sesi Terjual ({monthFull})
                </span>
              </div>
            </div>
            <span className="mb-dots">...</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={top5BySesi}
                layout="vertical"
                margin={{ top: 6, right: 36, left: 10, bottom: 6 }}
              >
                <CartesianGrid horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  domain={[0, 75]}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#74838F' }}
                />
                <YAxis
                  dataKey="mitraName"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={135}
                  tick={{ fontSize: 11, fill: '#4C5773', fontWeight: 500 }}
                />
                <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="totalSesi" name="Sesi" fill={CLAY_THEME_COLORS.coral} barSize={20}>
                  <LabelList
                    dataKey="totalSesi"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#4C5773' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: MONTHLY RANK TABLE MITRA AHLI */}
      <div className="mb-section-heading">
        <span>Tabel Peringkat Bulanan Mitra Ahli</span>
      </div>

      <div className="mb-card">
        <div className="mb-card-top">
          <span className="mb-card-title">
            Monthly Rank Table Mitra Ahli - {monthFull} 2026
          </span>
          <span className="mb-dots">...</span>
        </div>

        <div className="mb-table-wrap">
          <table className="mb-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Rank</th>
                <th>Mitra Ahli</th>
                <th className="num">Client</th>
                <th className="num">Session Online (ON)</th>
                <th className="num">Session Offline (OFF)</th>
                <th className="num">Total Session (ON/OFF)</th>
              </tr>
            </thead>
            <tbody>
              {rankedTable.map((row) => (
                <tr key={row.mitraName}>
                  <td style={{ color: '#74838F', fontWeight: 600 }}>{row.rank}.</td>
                  <td className="link-col">{row.mitraName}</td>
                  <td className="num">{row.totalClient}</td>
                  <td className="num">{row.sesiOnline}</td>
                  <td className="num">{row.sesiOffline}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {row.totalSesi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-table-footer">{rankedTable.length} rows</div>
      </div>
    </div>
  );
}
