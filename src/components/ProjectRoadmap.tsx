import React from 'react';
import {
  FileText,
  Filter,
  BarChart3,
  Database,
  TrendingUp,
  Lightbulb,
  LayoutDashboard,
  Award,
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface ProjectRoadmapProps {
  currentSection: number;
  onSelectSection: (sec: number) => void;
}

export const ProjectRoadmap: React.FC<ProjectRoadmapProps> = ({
  currentSection,
  onSelectSection
}) => {
  const sections = [
    {
      id: 1,
      title: 'Project Plan & Architecture',
      subtitle: 'Business problem, key questions, deliverables & structure',
      icon: FileText,
      status: 'active',
      badge: 'Delivered'
    },
    {
      id: 2,
      title: 'Data Cleaning & Python Pipeline',
      subtitle: 'Synthetic generation, data hygiene, derived features & CSV export',
      icon: Filter,
      status: 'active',
      badge: 'Delivered'
    },
    {
      id: 3,
      title: 'Exploratory Data Analysis (EDA)',
      subtitle: 'Monthly trends, seasonality heatmaps, top/bottom SKUs, promo lift',
      icon: BarChart3,
      status: 'active',
      badge: 'Delivered'
    },
    {
      id: 4,
      title: 'SQL Enterprise Analytics',
      subtitle: '10 production CTE queries (YoY, moving averages, store benchmarks)',
      icon: Database,
      status: 'active',
      badge: 'Delivered'
    },
    {
      id: 5,
      title: 'Time Series Forecasting Engine',
      subtitle: 'Hierarchical models: SARIMA, Prophet, XGBoost (MAE, RMSE, MAPE, WAPE, MASE)',
      icon: TrendingUp,
      status: 'queued',
      badge: 'Next: "continue"'
    },
    {
      id: 6,
      title: '10 Actionable Business Insights',
      subtitle: 'Insight → Evidence → Strategic recommendation matrix',
      icon: Lightbulb,
      status: 'queued',
      badge: 'Queue'
    },
    {
      id: 7,
      title: 'Power BI Dashboard Architecture',
      subtitle: 'Star schema, Power Query M-steps, 11 DAX measures & 5 report pages',
      icon: LayoutDashboard,
      status: 'queued',
      badge: 'Queue'
    },
    {
      id: 8,
      title: 'Portfolio README & Career Assets',
      subtitle: 'GitHub README, 5-7 quantified resume bullets & 2-min interview script',
      icon: Award,
      status: 'queued',
      badge: 'Queue'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Project Lifecycle Roadmap
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured 8-stage portfolio delivery sequence. Sections 1 & 2 are currently unlocked.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sections 1 & 2 Delivered
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Sections 3–8 Queued
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isCurrent = currentSection === sec.id;
          const isDelivered = sec.id <= 3;

          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                  : isDelivered
                  ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  : 'border-slate-100 bg-slate-50/60 opacity-80 hover:opacity-100 hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : isDelivered
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sec.badge}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                  {sec.id}. {sec.title}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {sec.subtitle}
                </p>
              </div>

              {sec.id > 3 && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Say "continue" to unlock</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
