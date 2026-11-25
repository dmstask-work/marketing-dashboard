import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Award,
  Database,
  SlidersHorizontal,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  generateDummyDataset,
  SERVICE_TYPES,
  SALES_TEAM,
  getMonthFullName,
  getMonthShortName,
} from './data/mockData';
import { loadDashboardDataset, saveRemoteTargetConfig } from './services/sheetsAdapter';
import {
  DEFAULT_TARGET_CONFIG,
  DEFAULT_MONTHLY_TARGETS_ALL,
  DEFAULT_MONTHLY_TARGETS_TA,
} from './utils/analyticsEngine';
import MarketingDashboard from './pages/MarketingDashboard';
import BusinessPerformanceDashboard from './pages/BusinessPerformanceDashboard';
import LeaderboardMitraDashboard from './pages/LeaderboardMitraDashboard';

const TARGET_STORAGE_KEY = 'dashboard_target_config_v1';

function normalizeTargetConfig(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_TARGET_CONFIG;
  const baseAll = Number(raw.targetBulananAll) || DEFAULT_TARGET_CONFIG.targetBulananAll;
  const baseTA = Number(raw.targetTA) || DEFAULT_TARGET_CONFIG.targetTA;
  const leadsPct =
    Number(raw.targetPersentaseLeads) || DEFAULT_TARGET_CONFIG.targetPersentaseLeads;

  const monthlyTargetsAll =
    Array.isArray(raw.monthlyTargetsAll) && raw.monthlyTargetsAll.length === 12
      ? raw.monthlyTargetsAll.map((v) => Number(v) || baseAll)
      : Array(12).fill(baseAll);

  const monthlyTargetsTA =
    Array.isArray(raw.monthlyTargetsTA) && raw.monthlyTargetsTA.length === 12
      ? raw.monthlyTargetsTA.map((v) => Number(v) || baseTA)
      : Array(12).fill(baseTA);

  return {
    targetBulananAll: baseAll,
    targetPersentaseLeads: leadsPct,
    targetTA: baseTA,
    monthlyTargetsAll,
    monthlyTargetsTA,
  };
}

function loadInitialTargetConfig() {
  try {
    const saved = localStorage.getItem(TARGET_STORAGE_KEY);
    if (saved) {
      return normalizeTargetConfig(JSON.parse(saved));
    }
  } catch (_) {
    // Ignore storage read errors
  }
  return DEFAULT_TARGET_CONFIG;
}

function getDefaultMtdRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    startDate: `${y}-${m}-01`,
    endDate: `${y}-${m}-${d}`,
    currentMonth: now.getMonth() + 1,
  };
}

export default function App() {
  const defaultPeriod = getDefaultMtdRange();
  const [activeTab, setActiveTab] = useState('marketing');
  const [dataset, setDataset] = useState(() => generateDummyDataset());
  const [dataSourceConfig, setDataSourceConfig] = useState({
    mode: 'api', // Automatically connects to real Google Sheets via /api/dashboard
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [loadingSource, setLoadingSource] = useState(true);
  const [sourceError, setSourceError] = useState('');
  const [hasCustomDateFilter, setHasCustomDateFilter] = useState(false);

  // Global Target Configuration (Persisted in localStorage & synced via Google Sheets for all users)
  const [targetConfig, setTargetConfig] = useState(() => loadInitialTargetConfig());
  const lastTargetSaveRef = useRef(0);

  const handleSaveTargetConfig = (nextTargetConfig) => {
    lastTargetSaveRef.current = Date.now();
    setTargetConfig(nextTargetConfig);
    try {
      localStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(nextTargetConfig));
    } catch (_) {
      // Ignore storage errors
    }
    saveRemoteTargetConfig(nextTargetConfig).catch((err) => {
      console.warn('Gagal menyinkronkan target ke Google Sheets:', err.message);
    });
  };

  // Page 1: Marketing Dashboard Filters (Default: Current Month MTD up to today / latest sheet date)
  const [marketingFilters, setMarketingFilters] = useState({
    startDate: defaultPeriod.startDate,
    endDate: defaultPeriod.endDate,
    serviceType: 'ALL',
    statusTerjual: 'ALL',
    salesName: 'ALL',
    trendGranularity: 'daily',
  });

  // Page 2: Business Performance Filter
  const [businessMonth, setBusinessMonth] = useState(defaultPeriod.currentMonth);

  // Page 3: Leaderboard Mitra Ahli Filters
  const [leaderboardFilters, setLeaderboardFilters] = useState({
    month: defaultPeriod.currentMonth,
    sessionMode: 'ALL',
  });

  // Automatically load & poll real Google Sheets dataset in real-time (every 15s + on tab focus)
  useEffect(() => {
    let mounted = true;

    async function syncRealData(isInitial = false) {
      if (dataSourceConfig.mode !== 'api') return;
      if (isInitial) setLoadingSource(true);
      try {
        const realDataset = await loadDashboardDataset({
          mode: 'api',
          forceRefresh: !isInitial,
        });
        if (!mounted) return;
        setDataset(realDataset);

        if (realDataset.savedTargetConfig && Date.now() - lastTargetSaveRef.current > 8000) {
          const normalizedRemote = normalizeTargetConfig(realDataset.savedTargetConfig);
          setTargetConfig(normalizedRemote);
          try {
            localStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(normalizedRemote));
          } catch (_) {
            // Ignore localStorage quota error
          }
        }

        // If user hasn't manually overridden the date range, keep endDate synced with latest current-month data or today
        if (!hasCustomDateFilter && realDataset.mode === 'google_sheets') {
          const freshDefault = getDefaultMtdRange();
          const curMonthPrefix = freshDefault.startDate.slice(0, 7);
          let maxDateInMonth = freshDefault.endDate;

          (realDataset.financeRows || []).forEach((r) => {
            if (r.date && r.date.startsWith(curMonthPrefix) && r.date > maxDateInMonth) {
              maxDateInMonth = r.date;
            }
          });
          (realDataset.leadsRows || []).forEach((r) => {
            if (r.date && r.date.startsWith(curMonthPrefix) && r.date > maxDateInMonth) {
              maxDateInMonth = r.date;
            }
          });

          setMarketingFilters((prev) => {
            if (prev.startDate === freshDefault.startDate && prev.endDate === maxDateInMonth) {
              return prev;
            }
            return {
              ...prev,
              startDate: freshDefault.startDate,
              endDate: maxDateInMonth,
            };
          });
        }
      } catch (err) {
        if (isInitial) {
          console.warn('Fallback to Dummy Engine:', err.message);
        }
      } finally {
        if (mounted && isInitial) setLoadingSource(false);
      }
    }

    syncRealData(true);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRealData(false);
      }
    }, 15000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncRealData(false);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [dataSourceConfig.mode, hasCustomDateFilter]);

  const handleApplyDataSource = async (newConfig) => {
    setLoadingSource(true);
    setSourceError('');
    try {
      const loaded = await loadDashboardDataset(newConfig);
      setDataset(loaded);
      setDataSourceConfig(newConfig);
      setIsSourceModalOpen(false);
    } catch (err) {
      setSourceError(err.message || 'Gagal memuat data Google Sheets');
    } finally {
      setLoadingSource(false);
    }
  };

  const handleForceRefresh = async () => {
    setLoadingSource(true);
    try {
      const refreshed = await loadDashboardDataset({
        mode: dataSourceConfig.mode,
        forceRefresh: true,
      });
      setDataset(refreshed);
    } catch (err) {
      console.error('Gagal refresh:', err);
    } finally {
      setLoadingSource(false);
    }
  };

  const pageTitles = {
    marketing: 'Marketing Dashboard',
    business: 'Business Performance Dashboard',
    leaderboard: 'Leaderboard Mitra Ahli Dashboard',
  };

  const pageSubtitles = {
    marketing: '',
    business: '',
    leaderboard: '',
  };

  // Count non-default filters for badge indicator on [Filter] button
  let activeFilterCount = 0;
  if (marketingFilters.serviceType !== 'ALL') activeFilterCount++;
  if (marketingFilters.salesName !== 'ALL') activeFilterCount++;
  if (hasCustomDateFilter) {
    activeFilterCount++;
  }
  const hasCustomMonthlyAll =
    Array.isArray(targetConfig.monthlyTargetsAll) &&
    targetConfig.monthlyTargetsAll.some((v, idx) => Number(v) !== DEFAULT_MONTHLY_TARGETS_ALL[idx]);
  const hasCustomMonthlyTA =
    Array.isArray(targetConfig.monthlyTargetsTA) &&
    targetConfig.monthlyTargetsTA.some((v, idx) => Number(v) !== DEFAULT_MONTHLY_TARGETS_TA[idx]);

  if (
    targetConfig.targetBulananAll !== DEFAULT_TARGET_CONFIG.targetBulananAll ||
    targetConfig.targetPersentaseLeads !== DEFAULT_TARGET_CONFIG.targetPersentaseLeads ||
    targetConfig.targetTA !== DEFAULT_TARGET_CONFIG.targetTA ||
    hasCustomMonthlyAll ||
    hasCustomMonthlyTA
  ) {
    activeFilterCount++;
  }

  // Dynamic filter options from real Google Sheets if available
  const availableServiceTypes =
    dataset.filterOptions?.serviceTypes?.length > 0
      ? dataset.filterOptions.serviceTypes
      : SERVICE_TYPES;

  const availableSalesNames =
    dataset.filterOptions?.salesNames?.length > 0
      ? dataset.filterOptions.salesNames
      : SALES_TEAM.map((s) => s.name);

  const availableStatuses =
    dataset.filterOptions?.statuses?.length > 0
      ? dataset.filterOptions.statuses
      : ['Terjual', 'NEW', 'MAINTENANCE', 'REFERAL'];

  return (
    <div className="app-layout">
      {/* ====================================================================
          1. HEADER SECTION (Slim Single-Line Header)
         ==================================================================== */}
      <header className="mb-top-header">
        <div className="mb-header-inner">
          <div className="mb-brand-area">
            <h1 className="mb-page-title">{pageTitles[activeTab]}</h1>
            <span className="mb-page-subtitle">{pageSubtitles[activeTab]}</span>
          </div>

          <div className="mb-header-right">
            {/* 3 SEPARATE PAGE TABS */}
            <nav className="mb-nav-group">
              <button
                className={`mb-nav-tab ${activeTab === 'marketing' ? 'active' : ''}`}
                onClick={() => setActiveTab('marketing')}
              >
                <LayoutDashboard size={14} />
                Marketing
              </button>
              <button
                className={`mb-nav-tab ${activeTab === 'business' ? 'active' : ''}`}
                onClick={() => setActiveTab('business')}
              >
                <TrendingUp size={14} />
                Business Performance
              </button>
              <button
                className={`mb-nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                <Award size={14} />
                Leaderboard Mitra Ahli
              </button>
            </nav>

            {/* COMPACT [Filter] BUTTON OPENING MODAL POPUP */}
            <button
              className="mb-btn-filter"
              onClick={() => setIsFilterModalOpen(true)}
              title="Buka Filter"
            >
              <SlidersHorizontal size={14} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="mb-filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. BODY SECTION (Main Dashboard Content Area)
         ==================================================================== */}
      <main className="mb-body-main">
        {activeTab === 'marketing' && (
          <MarketingDashboard
            dataset={dataset}
            filters={marketingFilters}
            setFilters={setMarketingFilters}
            targetConfig={targetConfig}
          />
        )}

        {activeTab === 'business' && (
          <BusinessPerformanceDashboard
            dataset={dataset}
            selectedMonth={businessMonth}
            targetConfig={targetConfig}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardMitraDashboard
            dataset={dataset}
            selectedMonth={leaderboardFilters.month}
            sessionMode={leaderboardFilters.sessionMode}
          />
        )}
      </main>

      {/* ====================================================================
          3. FOOTER SECTION (Clean Single-Line Footer with Source Button)
         ==================================================================== */}
      <footer className="mb-footer">
        <div className="mb-footer-inner">
          <div>
            <strong>Executive & Marketing Analytics Dashboard</strong> © 2026 SOP <i>(TS)</i>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dataset.mode === 'google_sheets' && (
              <button
                className="mb-powered-badge"
                onClick={handleForceRefresh}
                disabled={loadingSource}
                title="Refresh data terbaru dari Google Sheets"
              >
                <RefreshCw size={12} color="#509EE3" />
                <span>{loadingSource ? 'Syncing...' : 'Refresh Sheets'}</span>
              </button>
            )}

            <button
              className="mb-powered-badge"
              onClick={() => setIsSourceModalOpen(true)}
              title="Klik untuk konfigurasi sumber data Google Sheets / Dummy"
            >
              <Database size={13} color={dataset.mode === 'google_sheets' ? '#2E8540' : '#509EE3'} />
              <span>
                Source:{' '}
                <strong>
                  {dataset.mode === 'google_sheets' ? 'Google Sheets (Live)' : 'Dummy Engine'}
                </strong>
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          MODAL 1: CLEAN FILTER & TARGET POPUP
         ==================================================================== */}
      {isFilterModalOpen && (
        <FilterAndTargetModal
          activeTab={activeTab}
          marketingFilters={marketingFilters}
          setMarketingFilters={setMarketingFilters}
          setHasCustomDateFilter={setHasCustomDateFilter}
          businessMonth={businessMonth}
          setBusinessMonth={setBusinessMonth}
          leaderboardFilters={leaderboardFilters}
          setLeaderboardFilters={setLeaderboardFilters}
          targetConfig={targetConfig}
          setTargetConfig={handleSaveTargetConfig}
          availableServiceTypes={availableServiceTypes}
          availableSalesNames={availableSalesNames}
          availableStatuses={availableStatuses}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

      {/* ====================================================================
          MODAL 2: DATA SOURCE CONFIGURATION POPUP
         ==================================================================== */}
      {isSourceModalOpen && (
        <DataSourceModal
          currentConfig={dataSourceConfig}
          datasetMode={dataset.mode}
          onClose={() => setIsSourceModalOpen(false)}
          onSave={handleApplyDataSource}
          loading={loadingSource}
          error={sourceError}
        />
      )}
    </div>
  );
}

function FilterAndTargetModal({
  activeTab,
  marketingFilters,
  setMarketingFilters,
  setHasCustomDateFilter,
  businessMonth,
  setBusinessMonth,
  leaderboardFilters,
  setLeaderboardFilters,
  targetConfig,
  setTargetConfig,
  availableServiceTypes,
  availableSalesNames,
  availableStatuses,
  onClose,
}) {
  const [draftMkt, setDraftMkt] = useState(marketingFilters);
  const [draftBizMonth, setDraftBizMonth] = useState(businessMonth);
  const [draftLb, setDraftLb] = useState(leaderboardFilters);
  const [draftTarget, setDraftTarget] = useState(() => ({
    ...targetConfig,
    monthlyTargetsAll:
      Array.isArray(targetConfig.monthlyTargetsAll) && targetConfig.monthlyTargetsAll.length === 12
        ? [...targetConfig.monthlyTargetsAll]
        : Array(12).fill(Number(targetConfig.targetBulananAll) || 320000000),
    monthlyTargetsTA:
      Array.isArray(targetConfig.monthlyTargetsTA) && targetConfig.monthlyTargetsTA.length === 12
        ? [...targetConfig.monthlyTargetsTA]
        : Array(12).fill(Number(targetConfig.targetTA) || 180000000),
  }));
  const [monthlyTargetSegment, setMonthlyTargetSegment] = useState('BMI'); // 'BMI' | 'TA'

  const handleResetDefault = () => {
    const def = getDefaultMtdRange();
    setDraftMkt({
      startDate: def.startDate,
      endDate: def.endDate,
      serviceType: 'ALL',
      statusTerjual: 'ALL',
      salesName: 'ALL',
      trendGranularity: 'daily',
    });
    setDraftBizMonth(def.currentMonth);
    setDraftLb({ month: def.currentMonth, sessionMode: 'ALL' });
    setDraftTarget({
      ...DEFAULT_TARGET_CONFIG,
      monthlyTargetsAll: [...DEFAULT_MONTHLY_TARGETS_ALL],
      monthlyTargetsTA: [...DEFAULT_MONTHLY_TARGETS_TA],
    });
    setHasCustomDateFilter(false);
  };

  const handleApply = () => {
    const def = getDefaultMtdRange();
    if (draftMkt.startDate !== def.startDate || draftMkt.endDate !== def.endDate) {
      setHasCustomDateFilter(true);
    }
    const baseAll = Number(draftTarget.targetBulananAll) || 320000000;
    const baseTA = Number(draftTarget.targetTA) || 180000000;
    const normalizedMonthlyAll = Array.isArray(draftTarget.monthlyTargetsAll)
      ? draftTarget.monthlyTargetsAll.map((v) => Number(v) || baseAll)
      : Array(12).fill(baseAll);
    const normalizedMonthlyTA = Array.isArray(draftTarget.monthlyTargetsTA)
      ? draftTarget.monthlyTargetsTA.map((v) => Number(v) || baseTA)
      : Array(12).fill(baseTA);

    const nextTargetConfig = {
      targetBulananAll: baseAll,
      targetPersentaseLeads: Number(draftTarget.targetPersentaseLeads) || 15,
      targetTA: baseTA,
      monthlyTargetsAll: normalizedMonthlyAll,
      monthlyTargetsTA: normalizedMonthlyTA,
    };

    setMarketingFilters(draftMkt);
    setBusinessMonth(Number(draftBizMonth));
    setLeaderboardFilters(draftLb);
    setTargetConfig(nextTargetConfig);
    onClose();
  };

  const handleMonthTargetChange = (segment, monthIdx, rawValue) => {
    const key = segment === 'BMI' ? 'monthlyTargetsAll' : 'monthlyTargetsTA';
    setDraftTarget((prev) => {
      const nextArr = [...(prev[key] || [])];
      nextArr[monthIdx] = rawValue;
      return {
        ...prev,
        [key]: nextArr,
      };
    });
  };

  const handleApplyBaseToAll12Months = (segment) => {
    if (segment === 'BMI') {
      const val = Number(draftTarget.targetBulananAll) || 320000000;
      setDraftTarget((prev) => ({
        ...prev,
        monthlyTargetsAll: Array(12).fill(val),
      }));
    } else {
      const val = Number(draftTarget.targetTA) || 180000000;
      setDraftTarget((prev) => ({
        ...prev,
        monthlyTargetsTA: Array(12).fill(val),
      }));
    }
  };

  const activeMonthlyList =
    monthlyTargetSegment === 'BMI'
      ? draftTarget.monthlyTargetsAll || DEFAULT_MONTHLY_TARGETS_ALL
      : draftTarget.monthlyTargetsTA || DEFAULT_MONTHLY_TARGETS_TA;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-mb" onClick={(e) => e.stopPropagation()}>
        <div className="mb-card-top" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
            Filter
          </div>
          <button
            className="mb-filter-reset"
            onClick={onClose}
            style={{ height: 28, padding: '0 8px' }}
          >
            <X size={14} />
          </button>
        </div>

        {activeTab === 'marketing' && (
          <div className="mb-form-grid">
            <div className="mb-form-field">
              <label>Dari Tanggal</label>
              <input
                type="date"
                className="mb-form-input"
                value={draftMkt.startDate}
                max={draftMkt.endDate}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="mb-form-field">
              <label>Sampai Tanggal</label>
              <input
                type="date"
                className="mb-form-input"
                value={draftMkt.endDate}
                min={draftMkt.startDate}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>

            <div className="mb-form-field">
              <label>Jenis Layanan</label>
              <select
                className="mb-form-select"
                value={draftMkt.serviceType}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, serviceType: e.target.value }))
                }
              >
                <option value="ALL">Semua Jenis Layanan</option>
                {availableServiceTypes.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-form-field">
              <label>Nama Sales</label>
              <select
                className="mb-form-select"
                value={draftMkt.salesName}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, salesName: e.target.value }))
                }
              >
                <option value="ALL">Semua Tim Sales</option>
                {availableSalesNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-form-field">
              <label>Status Transaksi</label>
              <select
                className="mb-form-select"
                value={draftMkt.statusTerjual}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, statusTerjual: e.target.value }))
                }
              >
                <option value="ALL">Semua Status (All)</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-form-field">
              <label>Granularitas Tren</label>
              <select
                className="mb-form-select"
                value={draftMkt.trendGranularity}
                onChange={(e) =>
                  setDraftMkt((prev) => ({ ...prev, trendGranularity: e.target.value }))
                }
              >
                <option value="daily">Harian (Daily)</option>
                <option value="weekly">Mingguan (Weekly)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="mb-form-grid">
            <div className="mb-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Bulan Cut-off Evaluasi (2026)</label>
              <select
                className="mb-form-select"
                value={draftBizMonth}
                onChange={(e) => setDraftBizMonth(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    s/d Bulan {m}/2026 ({getMonthFullName(m)} 2026)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="mb-form-grid">
            <div className="mb-form-field" style={{ gridColumn: 'span 2' }}>
              <label>Bulan Periode</label>
              <select
                className="mb-form-select"
                value={draftLb.month}
                onChange={(e) =>
                  setDraftLb((prev) => ({ ...prev, month: Number(e.target.value) }))
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {getMonthFullName(m)} 2026
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mb-form-grid" style={{ marginTop: 12 }}>
          <div className="mb-form-field">
            <label>Target Bulanan BMI / All (IDR)</label>
            <input
              type="number"
              className="mb-form-input"
              step="5000000"
              value={draftTarget.targetBulananAll}
              onChange={(e) => {
                const newVal = e.target.value;
                setDraftTarget((prev) => {
                  const prevBase = Number(prev.targetBulananAll) || 320000000;
                  const allMatchPrev =
                    Array.isArray(prev.monthlyTargetsAll) &&
                    prev.monthlyTargetsAll.every((m) => Number(m) === prevBase);
                  return {
                    ...prev,
                    targetBulananAll: newVal,
                    monthlyTargetsAll: allMatchPrev
                      ? Array(12).fill(Number(newVal) || 0)
                      : prev.monthlyTargetsAll,
                  };
                });
              }}
            />
          </div>

          <div className="mb-form-field">
            <label>Target Bulanan TA (IDR)</label>
            <input
              type="number"
              className="mb-form-input"
              step="5000000"
              value={draftTarget.targetTA}
              onChange={(e) => {
                const newVal = e.target.value;
                setDraftTarget((prev) => {
                  const prevBase = Number(prev.targetTA) || 180000000;
                  const allMatchPrev =
                    Array.isArray(prev.monthlyTargetsTA) &&
                    prev.monthlyTargetsTA.every((m) => Number(m) === prevBase);
                  return {
                    ...prev,
                    targetTA: newVal,
                    monthlyTargetsTA: allMatchPrev
                      ? Array(12).fill(Number(newVal) || 0)
                      : prev.monthlyTargetsTA,
                  };
                });
              }}
            />
          </div>

          <div className="mb-form-field" style={{ gridColumn: 'span 2' }}>
            <label>Target Persentase Leads (%)</label>
            <input
              type="number"
              className="mb-form-input"
              min="1"
              max="100"
              value={draftTarget.targetPersentaseLeads}
              onChange={(e) =>
                setDraftTarget((prev) => ({
                  ...prev,
                  targetPersentaseLeads: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* KONFIGURASI TARGET TAHUNAN PER 12 BULAN (JAN - DES) */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B' }}>
                Set Target
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="mini-toggle-group">
                <button
                  type="button"
                  className={`mini-toggle-btn ${monthlyTargetSegment === 'BMI' ? 'active' : ''}`}
                  onClick={() => setMonthlyTargetSegment('BMI')}
                >
                  Target BMI (12 Bln)
                </button>
                <button
                  type="button"
                  className={`mini-toggle-btn ${monthlyTargetSegment === 'TA' ? 'active' : ''}`}
                  onClick={() => setMonthlyTargetSegment('TA')}
                >
                  Target TA (12 Bln)
                </button>
              </div>
              <button
                type="button"
                className="mb-filter-reset"
                style={{ height: 26, padding: '0 8px', fontSize: '0.68rem' }}
                onClick={() => handleApplyBaseToAll12Months(monthlyTargetSegment)}
                title="Samakan seluruh 12 bulan dengan nilai Target Bulanan di atas"
              >
                Samakan 12 Bulan
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m, idx) => (
              <div key={m} className="mb-form-field">
                <label style={{ fontSize: '0.7rem' }}>
                  {m}. {getMonthShortName(m)} ({monthlyTargetSegment})
                </label>
                <input
                  type="number"
                  className="mb-form-input"
                  style={{ height: 32, fontSize: '0.75rem', padding: '0 8px' }}
                  step="5000000"
                  value={activeMonthlyList[idx] ?? 0}
                  onChange={(e) =>
                    handleMonthTargetChange(monthlyTargetSegment, idx, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <button className="mb-filter-reset" onClick={handleResetDefault}>
            <RotateCcw size={13} />
            Reset Default
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mb-filter-reset" onClick={onClose}>
              Batal
            </button>
            <button className="mb-btn-filter" onClick={handleApply}>
              <CheckCircle2 size={14} />
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourceModal({ currentConfig, datasetMode, onClose, onSave, loading, error }) {
  const [mode, setMode] = useState(
    datasetMode === 'google_sheets' ? 'api' : currentConfig.mode
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-mb" onClick={(e) => e.stopPropagation()}>
        <div className="mb-card-top" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2E353B' }}>
            Sumber Data Dashboard
          </div>
          <button className="mb-filter-reset" onClick={onClose} style={{ height: 28, padding: '0 8px' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <label
            className="mb-card"
            style={{ padding: '12px 14px', cursor: 'pointer', flexDirection: 'row', justifyContent: 'flex-start', gap: 10 }}
          >
            <input
              type="radio"
              name="ds_mode"
              checked={mode === 'api'}
              onChange={() => setMode('api')}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                1. Live Google Sheets (`.env` + `service_account.json`)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#74838F' }}>
                Menarik data riil dari sheet <code>finance</code>, <code>closing</code>, dan <code>leads</code> melalui endpoint <code>/api/dashboard</code>.
              </div>
            </div>
          </label>

          <label
            className="mb-card"
            style={{ padding: '12px 14px', cursor: 'pointer', flexDirection: 'row', justifyContent: 'flex-start', gap: 10 }}
          >
            <input
              type="radio"
              name="ds_mode"
              checked={mode === 'dummy'}
              onChange={() => setMode('dummy')}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                2. Mode Data Dummy (Simulasi Offline)
              </div>
              <div style={{ fontSize: '0.74rem', color: '#74838F' }}>
                Menggunakan data simulasi internal tanpa koneksi internet.
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: 12,
              borderRadius: 6,
              background: '#FEF2F2',
              color: '#DC2626',
              fontSize: '0.76rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="mb-filter-reset" onClick={onClose}>
            Batal
          </button>
          <button
            className="mb-btn-filter"
            disabled={loading}
            onClick={() => onSave({ mode })}
          >
            <CheckCircle2 size={13} />
            {loading ? 'Memuat Data...' : 'Terapkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
