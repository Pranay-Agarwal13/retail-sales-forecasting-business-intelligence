import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  MapPin,
  Tag,
  RotateCcw,
  Lightbulb,
  FileCode2,
  Download,
  ArrowUpRight,
  ShieldAlert,
  ShoppingBag,
  DollarSign
} from 'lucide-react';

export const Section3EDA: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'kpis' | 'seasonality' | 'pareto' | 'stores' | 'promotions' | 'returns' | 'insights' | 'code'
  >('kpis');

  // Simulated aggregate statistics matching the 3-year cleaned dataset
  const kpis = {
    grossSales: 4185200,
    returnRefunds: 146480,
    netRevenue: 4038720,
    grossProfit: 2012400,
    netProfit: 1941650,
    forwardUnits: 184520,
    returnRatePct: 3.50,
    profitMarginPct: 48.08,
    yoyGrowth2022: 7.2,
    yoyGrowth2023: 7.8,
  };

  const insightsList = [
    {
      num: 1,
      title: "Weekend Demand Concentration",
      insight: "Friday through Sunday drives 53.8% of enterprise sales volume.",
      evidence: "Average daily sales jump from $3,120 (Mon–Thu) to $4,680 on Saturday and $4,210 on Sunday.",
      action: "Transition delivery logistics to Thursday night replenishment and schedule 35% higher store staffing during peak weekend hours."
    },
    {
      num: 2,
      title: "Q4 Holiday Asymmetry",
      insight: "November and December generate 28.5% of annual net revenue, peaking on Black Friday.",
      evidence: "November daily revenue averages $5,240 and December $5,620 compared to the $3,680 annual baseline.",
      action: "Issue purchase orders for top electronics and winter apparel by early October to avoid supply chain lead-time stockouts."
    },
    {
      num: 3,
      title: "Pareto Revenue Concentration (80/20)",
      insight: "Top 7 products (35% of SKU catalog) generate 80.4% of enterprise revenue.",
      evidence: "UltraHD 55-inch 4K TV and 14-inch Laptop alone account for $1.52M of the $4.04M portfolio.",
      action: "Establish dedicated vendor safety stock agreements and strict automated reorder trigger points for top 7 SKUs."
    },
    {
      num: 4,
      title: "High Margin Cushion in Consumables",
      insight: "Beauty & Personal Care delivers superior margin stability (68.4% gross margin) with lowest volatility.",
      evidence: "Consistently sustains >65% margin across all 3 years, experiencing a negligible return rate of 1.1%.",
      action: "Expand prime shelf space in checkout impulse zones and test subscription replenishment models for skincare and haircare."
    },
    {
      num: 5,
      title: "Apparel Return Margin Erosion",
      insight: "Apparel experiences the highest return rate (5.4%), eroding $78,000 in net gross profit annually.",
      evidence: "Denim Jeans and Outerwear show return rates exceeding 6.2% due to customer sizing variance.",
      action: "Introduce digital sizing fit-guides on store POS tablets and adjust supplier return allowances to recover packaging costs."
    },
    {
      num: 6,
      title: "Promotion Margin Dilution at >20% Discount",
      insight: "Discounts above 20% generate incremental unit volume but cannibalize net dollar profit.",
      evidence: "A 30% discount expands unit sales by +68% but contracts net profit per order by 24.6% due to high fixed COGS.",
      action: "Cap standard retail discount campaigns at 15%. Restrict 30%+ markdowns exclusively to end-of-season inventory clearance."
    },
    {
      num: 7,
      title: "Promotional Sweet Spot (10%–15%)",
      insight: "Moderate discounts of 10%–15% optimize total dollar profit contribution.",
      evidence: "Delivers +32% unit volume lift while maintaining a healthy 44.2% net margin, maximizing absolute dollar profit.",
      action: "Standardize mid-season promotional playbooks around 10%–15% thresholds paired with minimum basket thresholds ($100+)."
    },
    {
      num: 8,
      title: "Promotions Increase Customer Return Rates",
      insight: "Promotional purchases show a 4.6% return rate versus 3.2% for non-promoted transactions.",
      evidence: "Discounts induce higher impulsive buying behavior that subsequently results in customer remorse returns.",
      action: "Shorten return windows on clearance items from 30 days to 14 days and offer store-credit incentives for kept exchanges."
    },
    {
      num: 9,
      title: "Regional Sales Disparity (East & West Outperform)",
      insight: "East ($1.38M) and West ($1.22M) regions contribute 64.4% of total sales; North lags by 22%.",
      evidence: "Midwest Commerce Plaza (North) averages only $385K over 3 years due to lower commercial foot traffic.",
      action: "Reallocate high-ticket electronics assortment toward East & West urban stores, shifting North stores toward essentials."
    },
    {
      num: 10,
      title: "Downtown Metro Flagship Dominance",
      insight: "Store STR-101 (Downtown Flagship) generates 1.45x the sales volume of the average store.",
      evidence: "Delivers $742K in net revenue, with highest velocity in audio, laptop, and business apparel categories.",
      action: "Use STR-101 as the pilot testbed for new product launches and prioritize direct warehouse-to-store daily cross-docking."
    },
    {
      num: 11,
      title: "Holiday Daily Sales Lift (+38%)",
      insight: "Recognized holidays produce median daily unit lifts of +38% across all categories.",
      evidence: "Black Friday and Cyber Monday average 2.8x standard weekday demand; Memorial Day delivers +42% lift.",
      action: "Build automated holiday multiplier regressors into econometric forecasting pipelines (SARIMA/Prophet/XGBoost)."
    },
    {
      num: 12,
      title: "Declining Legacy Product Risk",
      insight: "Bluetooth Portable Speaker and Ceramic Diffuser show negative YoY sales velocity (-4.2% and -6.1%).",
      evidence: "Consecutive quarterly declines in 2023 despite baseline enterprise growth of +7.8%.",
      action: "Phase out end-of-life SKUs and renegotiate minimum order quantities with vendors to prevent obsolete inventory write-offs."
    },
    {
      num: 13,
      title: "Right-Skewed Revenue Distribution",
      insight: "Transaction values exhibit positive skewness (mean $218.80 vs. median $132.50).",
      evidence: "Occasional large multi-item orders and high-ticket TV/laptop transactions create long upper tails.",
      action: "Use log transformations or robust scalers when training linear models; tree-based models (XGBoost) naturally handle skewness."
    },
    {
      num: 14,
      title: "Outlier Retention Policy for Modeling",
      insight: "Holiday peak spikes are genuine commercial seasonality, not sensor or logging errors.",
      evidence: "Statistical IQR outlier filtering would discard Black Friday surges that represent 6.5% of annual revenue.",
      action: "Retain high-volume holiday observations in training sets; capture variance via explicit calendar and promotional features."
    },
    {
      num: 15,
      title: "Stable 7.5% Baseline CAGR",
      insight: "Enterprise demonstrates consistent organic growth across physical branch networks over 36 months.",
      evidence: "30-day moving average demand expanded from 152 units/day (Jan 2021) to 186 units/day (Dec 2023).",
      action: "Adopt baseline multiplicative trend models in SARIMA and Prophet with seasonal weekly periodicity (m=7)."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
              Phase 3 · Exploratory Data Analysis & Business Telemetry
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Exploratory Data Analysis (EDA) & Diagnostic Intelligence
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Uncovering seasonal patterns, Pareto 80/20 SKU distributions, promotional price elasticity, customer returns impact, and store efficiencies across 3 years of POS data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              10 Publication Charts Generated
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: 'kpis', label: 'Executive KPIs', icon: BarChart3 },
            { id: 'seasonality', label: 'Seasonality & Trends', icon: Calendar },
            { id: 'pareto', label: 'Pareto & Products', icon: Layers },
            { id: 'stores', label: 'Store & Region Matrix', icon: MapPin },
            { id: 'promotions', label: 'Promotion Elasticity', icon: Tag },
            { id: 'returns', label: 'Returns Deep-Dive', icon: RotateCcw },
            { id: 'insights', label: '15 Business Insights', icon: Lightbulb },
            { id: 'code', label: 'Visualizer Code (.py & .ipynb)', icon: FileCode2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Executive KPIs */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Gross Sales
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${(kpis.grossSales / 1e6).toFixed(2)}M
              </div>
              <div className="text-xs text-slate-400 mt-0.5">3-Year forward revenue</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider mb-1">
                Customer Returns
              </div>
              <div className="text-2xl font-bold text-rose-600">
                -${(kpis.returnRefunds / 1e3).toFixed(1)}K
              </div>
              <div className="text-xs text-rose-500 mt-0.5">{kpis.returnRatePct}% return rate</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                Net Revenue
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                ${(kpis.netRevenue / 1e6).toFixed(2)}M
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">+7.5% 3-Year CAGR</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Net Profit
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${(kpis.netProfit / 1e6).toFixed(2)}M
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Overall Margin: {kpis.profitMarginPct}%</div>
            </div>
          </div>

          {/* Executive Summary Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Executive Portfolio P&L Summary (2021–2023)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Consolidated Financials</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-4">Financial Dimension</th>
                    <th className="py-2.5 px-4 text-right">2021</th>
                    <th className="py-2.5 px-4 text-right">2022</th>
                    <th className="py-2.5 px-4 text-right">2023</th>
                    <th className="py-2.5 px-4 text-right">Total 3-Year</th>
                    <th className="py-2.5 px-4 text-right">YoY Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">Gross Sales Revenue</td>
                    <td className="py-2.5 px-4 text-right">$1,298,400</td>
                    <td className="py-2.5 px-4 text-right">$1,392,100</td>
                    <td className="py-2.5 px-4 text-right">$1,494,700</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">$4,185,200</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-sans font-medium">+7.4% avg</td>
                  </tr>
                  <tr className="bg-rose-50/20">
                    <td className="py-2.5 px-4 font-sans text-rose-800">Customer Returns / Refunds</td>
                    <td className="py-2.5 px-4 text-right text-rose-600">-$45,400</td>
                    <td className="py-2.5 px-4 text-right text-rose-600">-$48,700</td>
                    <td className="py-2.5 px-4 text-right text-rose-600">-$52,380</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-700">-$146,480</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-sans">3.5% rate</td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="py-2.5 px-4 font-sans text-slate-900">Net Revenue</td>
                    <td className="py-2.5 px-4 text-right">$1,253,000</td>
                    <td className="py-2.5 px-4 text-right">$1,343,400</td>
                    <td className="py-2.5 px-4 text-right">$1,442,320</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700">$4,038,720</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-sans">+7.5% YoY</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Total Cost of Goods Sold (COGS)</td>
                    <td className="py-2.5 px-4 text-right">$651,560</td>
                    <td className="py-2.5 px-4 text-right">$698,568</td>
                    <td className="py-2.5 px-4 text-right">$750,006</td>
                    <td className="py-2.5 px-4 text-right">$2,100,134</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-sans">52.0% of rev</td>
                  </tr>
                  <tr className="bg-emerald-50/30 font-bold">
                    <td className="py-2.5 px-4 font-sans text-emerald-950">Net Profit</td>
                    <td className="py-2.5 px-4 text-right text-emerald-800">$601,440</td>
                    <td className="py-2.5 px-4 text-right text-emerald-800">$644,832</td>
                    <td className="py-2.5 px-4 text-right text-emerald-800">$695,378</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700">$1,941,650</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-sans">+7.6% YoY</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-sans text-slate-700">Net Profit Margin (%)</td>
                    <td className="py-2.5 px-4 text-right">48.00%</td>
                    <td className="py-2.5 px-4 text-right">48.00%</td>
                    <td className="py-2.5 px-4 text-right">48.21%</td>
                    <td className="py-2.5 px-4 text-right font-bold">48.08%</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-sans">Stable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Seasonality & Trends */}
      {activeTab === 'seasonality' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Time Trends & Seasonality Decomposition
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analysis of multi-frequency retail periodicity: daily Poisson demand variations, Friday-through-Sunday surges, and fourth-quarter holiday peaks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Day-of-Week Pattern</span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Weekend Surge</span>
                </div>
                <p className="text-slate-600">
                  Daily demand rises steadily from Monday (index 0.85) to a Saturday peak (index 1.45). Friday–Sunday generates <strong>53.8% of weekly volume</strong>.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                  <strong>Takeaway:</strong> Store replenishment schedules must deliver inventory by Thursday evening to avoid Saturday stockouts.
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Month-of-Year Seasonality</span>
                  <span className="text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Q4 Concentration</span>
                </div>
                <p className="text-slate-600">
                  Spring sees a minor bump (+15%), summer stays flat, and November/December surges (+35% to +45%), driving <strong>28.5% of annual revenue</strong>.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                  <strong>Takeaway:</strong> Safety stock lead times require purchase order commitments 60 days in advance (early October).
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Holiday Impact</span>
                  <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">+38% Median Lift</span>
                </div>
                <p className="text-slate-600">
                  Major holidays (Black Friday, Cyber Monday, Christmas Eve) produce a <strong>1.65x multiplier</strong> on daily sales.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                  <strong>Takeaway:</strong> Models must include calendar holiday flags as explicit exogenous features rather than treating surges as outliers.
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Moving Average Trend</span>
                  <span className="text-[11px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded">+7.4% Baseline CAGR</span>
                </div>
                <p className="text-slate-600">
                  The 30-day moving average smooths weekly noise and reveals organic secular expansion from 152 to 186 daily units.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                  <strong>Takeaway:</strong> Baseline multi-year forecasting requires explicit trend modeling (additive in SARIMA, piecewise linear in Prophet).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pareto & Products */}
      {activeTab === 'pareto' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Product Portfolio & Pareto (80/20) Distribution
            </h3>
            <p className="text-xs text-slate-600">
              Evaluating SKU concentration, top revenue generators versus margin champions, and long-tail assortment health.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
                <div className="text-[11px] uppercase font-semibold text-slate-500">Pareto Concentration</div>
                <div className="text-xl font-bold text-slate-900">7 of 20 SKUs (35%)</div>
                <p className="text-slate-600">Generate 80.4% of enterprise net revenue.</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
                <div className="text-[11px] uppercase font-semibold text-slate-500">Top Revenue Leader</div>
                <div className="text-xl font-bold text-blue-600">UltraHD 55" 4K Smart TV</div>
                <p className="text-slate-600">$842K Net Revenue | 32.0% Margin</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1.5">
                <div className="text-[11px] uppercase font-semibold text-slate-500">Top Margin Leader</div>
                <div className="text-xl font-bold text-emerald-600">Eau de Parfum Spray</div>
                <p className="text-slate-600">78.0% Margin | 1.5% Return Rate</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Net Revenue</th>
                    <th className="py-2.5 px-3 text-right">Profit</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3 text-right">Cumul. Rev %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {[
                    { rank: 1, name: "UltraHD 55-inch 4K Smart TV", cat: "Electronics", units: 1680, price: "$499.99", rev: "$839,983", prof: "$268,794", margin: "32.0%", cum: "20.8%" },
                    { rank: 2, name: "14-inch Productivity Laptop", cat: "Electronics", units: 840, price: "$799.99", rev: "$671,991", prof: "$188,157", margin: "28.0%", cum: "37.4%" },
                    { rank: 3, name: "Weatherproof Parka Jacket", cat: "Apparel", units: 2840, price: "$149.00", rev: "$423,160", prof: "$232,738", margin: "55.0%", cum: "47.9%" },
                    { rank: 4, name: "Noise-Cancelling Wireless Headphones", cat: "Electronics", units: 1890, price: "$199.99", rev: "$377,981", prof: "$181,430", margin: "48.0%", cum: "57.3%" },
                    { rank: 5, name: "Non-Stick Cookware Set (10-Piece)", cat: "Home & Kitchen", units: 2360, price: "$129.99", rev: "$306,776", prof: "$153,388", margin: "50.0%", cum: "64.9%" },
                    { rank: 6, name: "Slim-Fit Denim Jeans", cat: "Apparel", units: 3980, price: "$68.00", rev: "$270,640", prof: "$167,796", margin: "62.0%", cum: "71.6%" },
                    { rank: 7, name: "Eau de Parfum Spray (50ml)", cat: "Beauty", units: 2950, price: "$85.00", rev: "$250,750", prof: "$195,585", margin: "78.0%", cum: "80.4%" },
                    { rank: 8, name: "12-Cup Programmable Coffee Maker", cat: "Home & Kitchen", units: 2420, price: "$89.99", rev: "$217,775", prof: "$97,998", margin: "45.0%", cum: "85.8%" },
                    { rank: 9, name: "Sonic Electric Toothbrush", cat: "Beauty", units: 2940, price: "$64.99", rev: "$191,070", prof: "$105,088", margin: "55.0%", cum: "90.5%" },
                    { rank: 10, name: "Bluetooth Portable Speaker", cat: "Electronics", units: 1980, price: "$79.99", rev: "$158,380", prof: "$82,357", margin: "52.0%", cum: "94.4%" },
                  ].map((row) => (
                    <tr key={row.rank} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-sans font-bold text-slate-700">#{row.rank}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{row.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-500">{row.cat}</td>
                      <td className="py-2 px-3 text-right">{row.units}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{row.price}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{row.rev}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-medium">{row.prof}</td>
                      <td className="py-2 px-3 text-right font-semibold">{row.margin}</td>
                      <td className="py-2 px-3 text-right text-rose-600 font-bold">{row.cum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Store & Region */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Store Network & Regional Territory Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="text-slate-500 font-semibold block">East Region</span>
                <span className="text-lg font-bold text-slate-900">$1,382,400 (34.2%)</span>
                <span className="text-slate-500 block mt-1">2 Stores | Avg Margin: 48.2%</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="text-slate-500 font-semibold block">West Region</span>
                <span className="text-lg font-bold text-slate-900">$1,219,800 (30.2%)</span>
                <span className="text-slate-500 block mt-1">2 Stores | Avg Margin: 48.0%</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="text-slate-500 font-semibold block">South Region</span>
                <span className="text-lg font-bold text-slate-900">$848,100 (21.0%)</span>
                <span className="text-slate-500 block mt-1">2 Stores | Avg Margin: 48.1%</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <span className="text-slate-500 font-semibold block">North Region (Laggard)</span>
                <span className="text-lg font-bold text-rose-600">$588,420 (14.6%)</span>
                <span className="text-slate-500 block mt-1">2 Stores | Traffic: 0.95x</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Key Regional Observations:</div>
              <div>• <strong>Flagship Store STR-101 (Downtown Metro):</strong> Captures $742K net sales with a 1.45 traffic index. Generates 52% of regional electronics demand.</div>
              <div>• <strong>North Region Lag:</strong> Midwest Commerce Plaza suffers from lower pedestrian density, leading to a 22% drag compared to company-wide store average.</div>
              <div>• <strong>Recommendation:</strong> Restructure regional logistics to replenish East and West stores twice weekly; downsize slow-moving electronics footprint in North branches.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Promotion Elasticity */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Promotional Elasticity & Profit Margin Dilution
            </h3>
            <p className="text-xs text-slate-600">
              Evaluating the empirical trade-off between discount-driven sales volume lift and net profit per order.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                <span className="font-semibold text-slate-700 block">Baseline (No Promo)</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">3.4 Units / Order</span>
                <span className="text-slate-500 text-[11px]">Net Margin: 48.5%</span>
              </div>

              <div className="border border-emerald-300 rounded-lg p-3.5 bg-emerald-50/30">
                <span className="font-semibold text-emerald-950 block">10%–15% Discount</span>
                <span className="text-xl font-bold text-emerald-700 block mt-1">4.5 Units (+32%)</span>
                <span className="text-emerald-700 text-[11px] font-medium">Sweet Spot: Max Profit $</span>
              </div>

              <div className="border border-amber-300 rounded-lg p-3.5 bg-amber-50/30">
                <span className="font-semibold text-amber-950 block">20% Discount</span>
                <span className="text-xl font-bold text-amber-700 block mt-1">5.1 Units (+50%)</span>
                <span className="text-amber-800 text-[11px]">Margin: 38.2% (Breakeven $)</span>
              </div>

              <div className="border border-rose-300 rounded-lg p-3.5 bg-rose-50/30">
                <span className="font-semibold text-rose-950 block">30%+ Discount</span>
                <span className="text-xl font-bold text-rose-600 block mt-1">5.7 Units (+68%)</span>
                <span className="text-rose-700 text-[11px] font-bold">Margin Dilution (-24.6% Profit)</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Commercial Rule of Thumb:</div>
              <p>
                Price elasticity of demand is <strong>elastic ($\epsilon \approx -2.2$)</strong> between 0% and 15% discount tiers, generating profitable volume lift. However, because landed COGS accounts for 52% of list price on average, discounts exceeding 20% destroy gross profit dollars. High markdowns should only be used as emergency liquidity mechanisms for inventory clearance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Returns Deep-Dive */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Customer Returns & Financial Impact Deep-Dive
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="font-bold text-slate-900">Return Rate by Merchandising Category</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Apparel (Highest Sizing Variance)</span>
                      <span className="text-rose-600 font-bold">5.4% ($78,200)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[54%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Home & Kitchen</span>
                      <span className="text-slate-700 font-bold">3.2% ($34,500)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[32%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Electronics</span>
                      <span className="text-slate-700 font-bold">2.6% ($41,200)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[26%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Beauty & Personal Care (Consumables)</span>
                      <span className="text-emerald-700 font-bold">1.1% ($7,800)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[11%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="font-bold text-slate-900">Promotions Induce Higher Returns</div>
                <p className="text-slate-600">
                  Transactions with promotional discounts experience a <strong>4.6% return rate</strong> compared to <strong>3.2% for full-price transactions</strong> (+44% relative increase in returns).
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-3 rounded border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-900">Operational Recommendation:</div>
                  <div>• Enforce a 14-day return window on promotional apparel (down from standard 30 days).</div>
                  <div>• Offer a +5% store-credit bonus for customers opting for store exchanges over cash refunds.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: 15 Business Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              15 Actionable Strategic Insights Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Formulated as: <strong>Insight → Empirical Evidence → Recommended Business Action</strong>
            </p>
          </div>

          <div className="space-y-3">
            {insightsList.map((item) => (
              <div key={item.num} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    {item.num}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                      Insight
                    </span>
                    <p className="text-slate-700">{item.insight}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Empirical Evidence
                    </span>
                    <p className="text-slate-700 font-mono text-[11px]">{item.evidence}</p>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Recommended Business Action
                    </span>
                    <p className="text-slate-800 font-medium">{item.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Code & Notebooks */}
      {activeTab === 'code' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Production EDA Visualizer Suite & Jupyter Notebook
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved in <code className="text-slate-800 font-mono">src/eda_visualizer.py</code> and <code className="text-slate-800 font-mono">notebooks/02_exploratory_data_analysis.ipynb</code>
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              10 Matplotlib/Seaborn Visual Functions
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                src/eda_visualizer.py
              </div>
              <p className="text-slate-600 leading-relaxed">
                Contains 10 standalone plotting functions with publication-quality formatting, corporate palettes, and automatic export to <code className="text-slate-800">reports/figures/</code>.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-emerald-600" />
                notebooks/02_exploratory_data_analysis.ipynb
              </div>
              <p className="text-slate-600 leading-relaxed">
                End-to-end interactive notebook executing Sections A through G, generating all charts, printing executive summary tables, and providing markdown takeaways.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
