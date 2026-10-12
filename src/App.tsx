import React, { useState } from 'react';
import { Section1ProjectPlan } from './components/Section1ProjectPlan';
import { Section2DataCleaning } from './components/Section2DataCleaning';
import { Section3EDA } from './components/Section3EDA';
import { Section4SQL } from './components/Section4SQL';
import { ProjectRoadmap } from './components/ProjectRoadmap';
import {
  BarChart2,
  FileText,
  Filter,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Database,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<number>(4);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                Retail Sales Forecasting & Business Intelligence
              </div>
              <div className="text-[11px] text-slate-500">
                End-to-End Enterprise Analytics, Econometric Forecasting & Power BI Platform
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Python · pandas · Seaborn · SQL · Prophet · XGBoost · Power BI
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Delivery Progress Notice */}
        <div className="bg-emerald-950 text-emerald-100 rounded-xl p-4 sm:p-5 border border-emerald-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">
                  Active Delivery: Section 4 (SQL Enterprise Analytics) Delivered
                </div>
                <div className="text-xs text-emerald-200/80 mt-0.5">
                  10 Production CTE & Window Queries, Star Schema DDL, Output Previews, and Dual Dialect Support (Postgres/MySQL) delivered below. Reply with <strong className="text-white font-bold">"continue"</strong> to proceed to Section 5 (Time Series Forecasting)!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <button
                onClick={() => setActiveSection(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 1
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                1. Plan
              </button>
              <button
                onClick={() => setActiveSection(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 2
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                2. Cleaning
              </button>
              <button
                onClick={() => setActiveSection(3)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 3
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                3. EDA
              </button>
              <button
                onClick={() => setActiveSection(4)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 4
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                4. SQL Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Section View */}
        {activeSection === 1 && <Section1ProjectPlan />}
        {activeSection === 2 && <Section2DataCleaning />}
        {activeSection === 3 && <Section3EDA />}
        {activeSection === 4 && <Section4SQL />}
        {activeSection > 4 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                Section {activeSection} is Prepared & Queued
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reply with <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-900 font-bold">continue</code> to proceed to this section with full econometric forecasting models and code.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveSection(4)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Return to Active Section 4 (SQL)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8-Stage Lifecycle Roadmap */}
        <ProjectRoadmap
          currentSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Retail Sales Forecasting & Business Intelligence Portfolio Architecture
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Clean Architecture</span>
            <span>·</span>
            <span>Zero-Pill Discipline</span>
            <span>·</span>
            <span>Full-Stack Data Science</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
