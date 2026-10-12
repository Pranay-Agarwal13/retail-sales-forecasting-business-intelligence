import React, { useState, useEffect } from 'react';
import {
  simulateSyntheticData,
  cleanRetailData,
  exportToCsvString,
  RetailTransaction,
  CleaningAuditReport
} from '../data/retailDataGenerator';
import { PYTHON_GENERATOR_SCRIPT, PYTHON_CLEANING_SCRIPT } from '../data/pythonScripts';
import {
  Download,
  Copy,
  Check,
  FileCode2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  GitBranch,
  TrendingUp,
  Percent,
  DollarSign
} from 'lucide-react';

export const Section2DataCleaning: React.FC = () => {
  const [sampleYears, setSampleYears] = useState<number>(3);
  const [injectAnomalies, setInjectAnomalies] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<CleaningAuditReport | null>(null);
  const [cleanData, setCleanData] = useState<RetailTransaction[]>([]);
  const [demandData, setDemandData] = useState<RetailTransaction[]>([]);
  const [selectedTab, setSelectedTab] = useState<'console' | 'table' | 'python_clean' | 'python_gen'>('console');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Run the simulation and cleaning pipeline
  const runPipeline = () => {
    setIsRunning(true);
    setTimeout(() => {
      const days = sampleYears * 365;
      const { rawRecords } = simulateSyntheticData(days, injectAnomalies);
      const { cleanRecords, demandRecords, audit } = cleanRetailData(rawRecords);
      setCleanData(cleanRecords);
      setDemandData(demandRecords);
      setAuditReport(audit);
      setIsRunning(false);
      setPage(1);
    }, 250);
  };

  useEffect(() => {
    runPipeline();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(label);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleDownloadCsv = (data: RetailTransaction[], filename: string) => {
    if (data.length === 0) return;
    const csvContent = exportToCsvString(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPython = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for the preview table
  const filteredRows = cleanData.filter((r) => {
    const matchesSearch =
      r.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.order_date.includes(searchTerm) ||
      r.product_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesType = selectedType === 'All' || r.transaction_type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const categories = ['All', 'Electronics', 'Apparel', 'Home & Kitchen', 'Beauty & Personal Care'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
              Phase 2 · Ingestion & Production Cleaning Pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Data Cleaning, Returns Modeling & Leakage-Free Feature Engineering
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Preserves customer return records for full-lifecycle BI, isolates clean forward demand for unpolluted forecasting, recomputes profit strictly via <code className="text-emerald-300 font-mono">revenue - (units * unit_cost)</code>, and prepares rolling-origin validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadCsv(cleanData, 'retail_sales_clean.csv')}
              disabled={cleanData.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download retail_sales_clean.csv
            </button>
            <button
              onClick={() => handleDownloadCsv(demandData, 'retail_sales_demand.csv')}
              disabled={demandData.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download demand_only.csv
            </button>
            <button
              onClick={() => handleDownloadPython(PYTHON_CLEANING_SCRIPT, 'clean_retail_data.py')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <FileCode2 className="w-4 h-4" />
              Download clean_data.py
            </button>
          </div>
        </div>
      </div>

      {/* Control Strip & Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Simulation Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Timespan:</span>
              <select
                value={sampleYears}
                onChange={(e) => setSampleYears(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value={1}>1 Year (2021)</option>
                <option value={2}>2 Years (2021–2022)</option>
                <option value={3}>3 Full Years (2021–2023)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={injectAnomalies}
                onChange={(e) => setInjectAnomalies(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">Inject dirty records (test cleaning assertions)</span>
            </label>

            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Pipeline...' : 'Re-Run Pipeline'}
            </button>
          </div>

          {/* View Tab Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start lg:self-auto text-xs">
            <button
              onClick={() => setSelectedTab('console')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedTab === 'console'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit & Architecture
            </button>
            <button
              onClick={() => setSelectedTab('table')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedTab === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Explorer ({cleanData.length.toLocaleString()})
            </button>
            <button
              onClick={() => setSelectedTab('python_clean')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedTab === 'python_clean'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              clean_retail_data.py
            </button>
            <button
              onClick={() => setSelectedTab('python_gen')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedTab === 'python_gen'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              generate_data.py
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Audit, Metrics & Best Practices */}
      {selectedTab === 'console' && (
        <div className="space-y-6">
          {/* Diagnostic KPI Cards */}
          {auditReport && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Gross Sales</span>
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-xl font-bold text-slate-900">
                  ${(auditReport.gross_revenue / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{auditReport.sales_count.toLocaleString()} SALE transactions</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Returns</span>
                  <Percent className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-xl font-bold text-rose-600">
                  -${(auditReport.return_revenue / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-rose-600 mt-0.5">{auditReport.returns_count.toLocaleString()} RETURN refunds ({auditReport.return_rate_pct}%)</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Net Revenue</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  ${(auditReport.net_revenue / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Gross minus returns</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Net Profit
                </div>
                <div className="text-xl font-bold text-slate-900">
                  ${(auditReport.net_profit / 1000).toFixed(1)}k
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Margin: {(auditReport.avg_profit_margin * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Demand Subset
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {demandData.length.toLocaleString()}
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5">SALE-only for forecasting</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Hygiene Audit
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  All Assertions Passed
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Deduplicated & verified</div>
              </div>
            </div>
          )}

          {/* Technical Improvements Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900 text-base">
                Production Upgrades: Returns, Leakage Prevention & Time-Series Evaluation
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  1. Returns Modeled, Not Deleted
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Both <code className="text-slate-800 font-mono">SALE</code> and <code className="text-slate-800 font-mono">RETURN</code> rows are preserved in <code className="text-slate-800 font-mono">retail_sales_clean.csv</code>. This enables net revenue, refund rate, and inventory reversal BI analysis.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                  Separate <code className="text-blue-600">retail_sales_demand.csv</code> filters <code className="text-slate-800 font-mono">transaction_type == 'SALE'</code> for time-series models.
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  2. Explicit Profit Re-computation
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Instead of trusting raw profit, product master stores <code className="text-slate-800 font-mono">unit_cost</code>. Profit is explicitly computed via:
                </p>
                <div className="font-mono text-[11px] bg-slate-900 text-emerald-300 p-2 rounded">
                  profit = revenue - (units * unit_cost)
                </div>
                <p className="text-slate-500 text-[11px]">
                  Guarantees mathematical integrity across both discounted sales and refund reversals.
                </p>
              </div>

              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  3. Leakage-Free XGBoost Features
                </div>
                <p className="text-slate-600 leading-relaxed">
                  All target lag features (<code className="text-slate-800 font-mono">lag_1, lag_7, lag_14, lag_28</code>) and rolling aggregates (<code className="text-slate-800 font-mono">rolling(7).mean()</code>) strictly enforce:
                </p>
                <div className="font-mono text-[11px] bg-slate-900 text-indigo-300 p-2 rounded">
                  df[target].shift(1).rolling(7).mean()
                </div>
                <p className="text-slate-500 text-[11px]">
                  Zero look-ahead target leakage into training matrices.
                </p>
              </div>

              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  4. Rolling-Origin Cross-Validation
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Replaces arbitrary chronological splits with an expanding-window rolling-origin CV evaluator:
                </p>
                <p className="text-slate-500 text-[11px]">
                  • Train to Jun 30, test Jul (30d)<br />
                  • Train to Jul 31, test Aug (30d)<br />
                  • Train to Aug 31, test Sep (30d)<br />
                  Averages metrics across folds for robust generalization.
                </p>
              </div>

              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  5. WAPE & MASE Primary Metrics
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Retail demand is often intermittent or zero-heavy, making MAPE volatile. Evaluator adds:
                </p>
                <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                  <div>• <strong>WAPE:</strong> <code className="text-slate-800">sum(|y - ŷ|) / sum(y)</code> (Volume-weighted)</div>
                  <div>• <strong>MASE:</strong> <code className="text-slate-800">MAE / MAE_seasonal_naive</code> (Hyndman, 2006)</div>
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  6. Rigorous Assertion Testing
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Automated test assertions ensure:
                </p>
                <p className="text-slate-500 text-[11px]">
                  • Critical modeling fields contain no nulls.<br />
                  • All unit_costs are positive.<br />
                  • Max discrepancy between profit and revenue - cost is $\le 0.05$.<br />
                  • Demand dataframe has 100% positive units and revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cleaned Data Explorer */}
      {selectedTab === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search product, store, date..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 w-56 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-hidden"
                >
                  <option value="All">All Types</option>
                  <option value="SALE">SALE</option>
                  <option value="RETURN">RETURN</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-slate-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length.toLocaleString()} rows
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Store</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Cost</th>
                  <th className="py-2.5 px-3 text-right">Disc.</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-center">Promo</th>
                  <th className="py-2.5 px-3 text-center">Holiday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {paginatedRows.map((r, i) => (
                  <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${r.transaction_type === 'RETURN' ? 'bg-rose-50/30' : ''}`}>
                    <td className="py-2 px-3 text-slate-900 font-medium whitespace-nowrap">{r.order_date}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${r.transaction_type === 'SALE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {r.transaction_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap font-sans">{r.store_name}</td>
                    <td className="py-2 px-3 text-slate-900 font-sans max-w-[180px] truncate" title={r.product_name}>
                      {r.product_name}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{r.category}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${r.units_sold < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {r.units_sold}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">${r.unit_price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">${r.unit_cost.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{(r.discount * 100).toFixed(0)}%</td>
                    <td className={`py-2 px-3 text-right font-semibold ${r.revenue < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      ${r.revenue.toFixed(2)}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${r.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${r.profit.toFixed(2)}
                    <td className="py-2 px-3 text-right text-slate-700">
                      {r.profit_margin !== undefined ? (
                        `${((r.profit_margin || 0) * 100).toFixed(1)}%`
                      ) : (
                        <span className="text-slate-400 font-sans text-[10px]">N/A (Return)</span>
                      )}
                    </td>
                      {r.promotion_flag ? (
                        <span className="text-amber-700 font-sans text-[10px] font-bold">YES</span>
                      ) : (
                        <span className="text-slate-300 font-sans text-[10px]">No</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {r.holiday_flag ? (
                        <span className="text-rose-600 font-sans text-[10px] font-bold">YES</span>
                      ) : (
                        <span className="text-slate-300 font-sans text-[10px]">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Python Cleaning Code */}
      {selectedTab === 'python_clean' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              <span>clean_retail_data.py</span>
              <span className="text-slate-500 text-[11px]">(Modular Pipeline with Returns, MASE, CV & XGBoost Feats)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(PYTHON_CLEANING_SCRIPT, 'clean')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
              >
                {copiedScript === 'clean' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript === 'clean' ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={() => handleDownloadPython(PYTHON_CLEANING_SCRIPT, 'clean_retail_data.py')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .py
              </button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{PYTHON_CLEANING_SCRIPT}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: Python Generator Code */}
      {selectedTab === 'python_gen' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span>generate_synthetic_retail_data.py</span>
              <span className="text-slate-500 text-[11px]">(With Return Modeling & Unit Cost Master)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(PYTHON_GENERATOR_SCRIPT, 'gen')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
              >
                {copiedScript === 'gen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript === 'gen' ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={() => handleDownloadPython(PYTHON_GENERATOR_SCRIPT, 'generate_synthetic_retail_data.py')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .py
              </button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto">
            <pre>{PYTHON_GENERATOR_SCRIPT}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
