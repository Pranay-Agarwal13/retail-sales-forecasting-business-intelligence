import React from 'react';
import { Target, HelpCircle, PackageCheck, FolderTree, Database, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Section1ProjectPlan: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
              Phase 1 · Strategic Foundation
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Project Plan: Retail Sales Forecasting & Business Intelligence
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              An enterprise analytics architecture bridging raw multi-store POS transaction telemetry to statistical forecasting and executive decision-making.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Production Blueprint Ready
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Business Problem & Key Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Problem */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              Business Problem
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Retail enterprises face severe bottom-line erosion due to two opposing inventory inefficiencies:
              <strong className="text-slate-800 font-medium"> stockouts during demand surges</strong> (lost revenue, damaged customer loyalty) and
              <strong className="text-slate-800 font-medium"> excess carrying inventory during lulls</strong> (working capital lockup, markdowns, obsolescence).
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Furthermore, promotional discounts are frequently executed without empirical price elasticity modeling, eroding gross margins without delivering sustainable volume lifts. Legacy manual spreadsheet forecasting fails to capture cross-category seasonality, regional store footfalls, and macroeconomic calendar shifts.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-slate-900">Project Mission:</div>
              <div>• Eliminate demand blindspots with hierarchical time-series forecasting (SARIMA, Prophet, XGBoost).</div>
              <div>• Establish single-source-of-truth SQL analytics and DAX KPIs for executive operations.</div>
              <div>• Transform data science metrics into high-conviction inventory and pricing recommendations.</div>
            </div>
          </div>
        </div>

        {/* Key Questions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            Core Business & Analytical Questions
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-400 text-xs mt-0.5">01</span>
              <div>
                <strong className="text-slate-800 font-medium">Baseline & Seasonality:</strong> What are the primary weekly, monthly, and holiday demand cycles driving revenue across physical stores and categories?
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-400 text-xs mt-0.5">02</span>
              <div>
                <strong className="text-slate-800 font-medium">Promotion Elasticity:</strong> Do promotional discount campaigns expand profit dollars or merely inflate units sold at sub-optimal margins?
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-400 text-xs mt-0.5">03</span>
              <div>
                <strong className="text-slate-800 font-medium">Store & Regional Disparity:</strong> Which stores generate high sales velocity versus high margin retention? Why do certain regions underperform?
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-400 text-xs mt-0.5">04</span>
              <div>
                <strong className="text-slate-800 font-medium">Predictive Accuracy:</strong> Which machine learning or econometric algorithm (Baseline, SARIMA, Prophet, or XGBoost) achieves the lowest MAPE/WAPE across 30, 60, and 90-day horizons?
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-400 text-xs mt-0.5">05</span>
              <div>
                <strong className="text-slate-800 font-medium">Executive Action:</strong> What specific SKU safety stock levels and regional replenishment schedules should operations deploy for next quarter?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables & Folder Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expected Deliverables */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PackageCheck className="w-5 h-5" />
            </div>
            Expected Project Deliverables
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Cleaned Data Asset
              </div>
              <p className="text-slate-500">
                <code className="text-slate-700 font-mono text-[11px]">retail_sales_clean.csv</code> with 22 validated fields, calendar attributes, and zero nulls/negatives.
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Python Pipeline Suite
              </div>
              <p className="text-slate-500">
                Modular scripts for synthetic data simulation, automated cleaning assertions, and machine learning feature extraction.
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                SQL Business Suite
              </div>
              <p className="text-slate-500">
                10 enterprise-grade CTE queries (YoY growth, moving averages, top/declining products, promo ROI, store benchmarks).
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Time-Series Forecast Engine
              </div>
              <p className="text-slate-500">
                Hierarchical benchmark of Naive, SARIMA, Prophet, and XGBoost with rolling-origin cross-validation (MAE, RMSE, MAPE, WAPE).
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Power BI Architecture
              </div>
              <p className="text-slate-500">
                Star schema data model, M-Query parameters, 11 production DAX measures, and 5-page enterprise dashboard specifications.
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Portfolio & Career Package
              </div>
              <p className="text-slate-500">
                Comprehensive GitHub README, quantified resume bullet points, and a 2-minute behavioral interview pitch script.
              </p>
            </div>
          </div>
        </div>

        {/* Folder Structure */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg mb-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <FolderTree className="w-5 h-5" />
            </div>
            Project Directory Layout
          </div>

          <div className="bg-slate-950 text-slate-300 rounded-lg p-3.5 font-mono text-xs overflow-x-auto leading-relaxed flex-1">
            <pre className="text-emerald-400">retail-sales-forecasting-bi/</pre>
            <pre className="text-slate-400">├── data/</pre>
            <pre className="text-slate-400">│   ├── raw/                 # Ingested POS CSV dumps</pre>
            <pre className="text-slate-400">│   └── processed/           # retail_sales_clean.csv</pre>
            <pre className="text-slate-400">├── notebooks/               # Jupyter EDA & model tuning</pre>
            <pre className="text-slate-400">├── src/                     # Production Python modules</pre>
            <pre className="text-slate-400">│   ├── data_generator.py    # 3-year synthetic simulator</pre>
            <pre className="text-slate-400">│   ├── data_cleaning.py     # Pipeline & integrity checks</pre>
            <pre className="text-slate-400">│   ├── eda_visuals.py       # Seaborn & Matplotlib plots</pre>
            <pre className="text-slate-400">│   └── forecasting.py       # SARIMA, Prophet, XGBoost</pre>
            <pre className="text-slate-400">├── sql/                     # PostgreSQL / MySQL analytics</pre>
            <pre className="text-slate-400">│   ├── schema.sql           # Fact & Dimension DDL</pre>
            <pre className="text-slate-400">│   └── analytical_queries.sql</pre>
            <pre className="text-slate-400">├── power_bi/                # Power BI Desktop templates</pre>
            <pre className="text-slate-400">│   ├── dax_measures.txt     # Production DAX library</pre>
            <pre className="text-slate-400">│   └── data_model_specs.md</pre>
            <pre className="text-slate-400">├── forecasts/               # forecast_results.csv</pre>
            <pre className="text-slate-400">├── requirements.txt         # Pinned Python dependencies</pre>
            <pre className="text-slate-400">└── README.md                # Enterprise GitHub showcase</pre>
          </div>
        </div>
      </div>

      {/* Suggested Kaggle Datasets vs Synthetic Generator */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-lg mb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          Data Sourcing: Suggested Kaggle Repositories vs. Built-in Generator
        </div>
        <p className="text-sm text-slate-600 mb-4">
          This project architecture accepts both public benchmarks and the provided multi-attribute synthetic simulator:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="font-semibold text-slate-900 text-sm">Option A: Rossmann Store Sales</div>
            <p className="text-slate-600">
              Over 1,000,000 records across 1,115 drug stores with promotion schedules, school/state holidays, and store assortments.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              kaggle: c/rossmann-store-sales
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="font-semibold text-slate-900 text-sm">Option B: Walmart Recruiting Sales</div>
            <p className="text-slate-600">
              Historical sales across 45 Walmart stores with CPI, unemployment, temperature, fuel price, and markdown events.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              kaggle: c/walmart-recruiting-store-sales-forecasting
            </div>
          </div>

          <div className="bg-white border border-emerald-300 bg-emerald-50/20 rounded-lg p-3.5 space-y-2">
            <div className="font-semibold text-emerald-950 text-sm flex items-center justify-between">
              <span>Option C: Built-in Synthetic Engine</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">Tailored</span>
            </div>
            <p className="text-slate-700">
              Generates the exact required 15 columns with mathematically calibrated yearly trends, holiday lifts (Black Friday/Cyber Monday), weekend surges, and injected anomalies for pipeline testing.
            </p>
            <div className="text-[11px] text-emerald-700 font-medium">
              Ready to run in Section 2 (Browser & Python script).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
