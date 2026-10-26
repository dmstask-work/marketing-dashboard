import React, { useState, useEffect } from 'react';
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
} from './data/mockData';
import { loadDashboardDataset } from './services/sheetsAdapter';
import { DEFAULT_TARGET_CONFIG } from './utils/analyticsEngine';
import MarketingDashboard from './pages/MarketingDashboard';
import BusinessPerformanceDashboard from './pages/BusinessPerformanceDashboard';
import LeaderboardMitraDashboard from './pages/LeaderboardMitraDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketing');
  const [dataset, setDataset] = useState(() => generateDummyDataset());
  const [dataSourceConfig, setDataSourceConfig] = useState({
    mode: 'api', // Automatically connects to real Google Sheets via /api/dashboard
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [loadingSource, setLoadingSource] = useState(true);
  const [sourceError, setSourceError] = useState('');

  // Global Target Configuration (Defaults: All=320.000.000, Leads=15%, TA=180.000.000)
  const [targetConfig, setTargetConfig] = useState(DEFAULT_TARGET_CONFIG);

  // Page 1: Marketing Dashboard Filters
  const [marketingFilters, setMarketingFilters] = useState({
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    serviceType: 'ALL',
    statusTerjual: 'ALL',
    salesName: 'ALL',
    trendGranularity: 'daily',
  });

  // Page 2: Business Performance Filter
  const [businessMonth, setBusinessMonth] = useState(9); // Default s/d Sep (9/2026)

  // Page 3: Leaderboard Mitra Ahli Filters
  const [leaderboardFilters, setLeaderboardFilters] = useState({
    month: 10,
    sessionMode: 'ALL',
  });

  // Automatically load real Google Sheets dataset on initial mount
  useEffect(() => {
    let mounted = true;
    async function initRealData() {
      setLoadingSource(true);
      try {
        const realDataset = await loadDashboardDataset({ mode: 'api' });
        if (mounted) {
          setDataset(realDataset);
          setDataSourceConfig({ mode: realDataset.mode === 'google_sheets' ? 'api' : 'dummy' });
        }
      } catch (err) {
        console.warn('Fallback to Dummy Engine:', err.message);
      } finally {
        if (mounted) setLoadingSource(false);
      }
    }
    initRealData();
    return () => {
      mounted = false;
    };
  }, []);

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
  if (marketingFilters.startDate !== '2026-10-01' || marketingFilters.endDate !== '2026-10-25') {
    activeFilterCount++;
  }
  if (
    targetConfig.targetBulananAll !== DEFAULT_TARGET_CONFIG.targetBulananAll ||
    targetConfig.targetPersentaseLeads !== DEFAULT_TARGET_CONFIG.targetPersentaseLeads ||
    targetConfig.targetTA !== DEFAULT_TARGET_CONFIG.targetTA
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
          businessMonth={businessMonth}
          setBusinessMonth={setBusinessMonth}
          leaderboardFilters={leaderboardFilters}
          setLeaderboardFilters={setLeaderboardFilters}
          targetConfig={targetConfig}
          setTargetConfig={setTargetConfig}
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
  const [draftTarget, setDraftTarget] = useState(targetConfig);

  const handleResetDefault = () => {
    setDraftMkt({
      startDate: '2026-10-01',
      endDate: '2026-10-25',
      serviceType: 'ALL',
      statusTerjual: 'ALL',
      salesName: 'ALL',
      trendGranularity: 'daily',
    });
    setDraftBizMonth(9);
    setDraftLb({ month: 10, sessionMode: 'ALL' });
    setDraftTarget(DEFAULT_TARGET_CONFIG);
  };

  const handleApply = () => {
    setMarketingFilters(draftMkt);
    setBusinessMonth(Number(draftBizMonth));
    setLeaderboardFilters(draftLb);
    setTargetConfig({
      targetBulananAll: Number(draftTarget.targetBulananAll) || 320000000,
      targetPersentaseLeads: Number(draftTarget.targetPersentaseLeads) || 15,
      targetTA: Number(draftTarget.targetTA) || 180000000,
    });
    onClose();
  };

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
                min="2026-01-01"
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
                max="2026-10-25"
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
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
            <div className="mb-form-field">
              <label>Bulan Periode</label>
              <select
                className="mb-form-select"
                value={draftLb.month}
                onChange={(e) =>
                  setDraftLb((prev) => ({ ...prev, month: Number(e.target.value) }))
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
                  <option key={m} value={m}>
                    {getMonthFullName(m)} 2026
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-form-field">
              <label>Mode Sesi (On / Off)</label>
              <select
                className="mb-form-select"
                value={draftLb.sessionMode}
                onChange={(e) =>
                  setDraftLb((prev) => ({ ...prev, sessionMode: e.target.value }))
                }
              >
                <option value="ALL">Semua Sesi (ON + OFF)</option>
                <option value="ON">Sesi Online (ON)</option>
                <option value="OFF">Sesi Offline (OFF)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mb-form-grid" style={{ marginTop: 12 }}>
          <div className="mb-form-field">
            <label>Target Bulanan All (IDR)</label>
            <input
              type="number"
              className="mb-form-input"
              step="5000000"
              value={draftTarget.targetBulananAll}
              onChange={(e) =>
                setDraftTarget((prev) => ({ ...prev, targetBulananAll: e.target.value }))
              }
            />
          </div>

          <div className="mb-form-field">
            <label>Target Bulanan TA (IDR)</label>
            <input
              type="number"
              className="mb-form-input"
              step="5000000"
              value={draftTarget.targetTA}
              onChange={(e) =>
                setDraftTarget((prev) => ({ ...prev, targetTA: e.target.value }))
              }
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
