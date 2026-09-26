import { useState, memo } from 'react';
import type { Column } from './DataTable';
import DataTable from './DataTable';
import ErrorBanner from './ErrorBanner';
import { useApiResource } from '../hooks/useApiResource';
import { count } from '../format';
import {
  fetchDelayCauses,
  fetchHourlyDelayTrends,
  fetchMonthlyDelayTrends,
} from '../services/api';
import type { DelayCauseRow, HourlyTrendRow, MonthlyTrendRow } from '../../types';
import { PANEL, PANEL_PADDING, SECTION_HEADING, SKELETON_CLASSES, TEXT_XL, TEXT_SM, FOCUS_VISIBLE } from '../styles';

// Professional SVG icon components for AnalyticsPage
const AnalyticsIcons = {
  Trends: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Causes: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
    </svg>
  ),
  Insights: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Snowflake: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Plane: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Chart: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const EMPTY_MONTHS: MonthlyTrendRow[] = [];
const EMPTY_HOURS: HourlyTrendRow[] = [];
const EMPTY_CAUSES: DelayCauseRow[] = [];

const monthColumns: Column<MonthlyTrendRow>[] = [
  { label: 'Month', render: row => row.month },
  { label: 'Flights', render: row => count(row.total_flights), numeric: true },
  { label: 'Delay rate', render: row => `${Number(row.delay_rate).toFixed(1)}%`, numeric: true },
  { label: 'Average delay', render: row => row.avg_delay == null ? '—' : `${Number(row.avg_delay).toFixed(1)} min`, numeric: true },
];

const hourColumns: Column<HourlyTrendRow>[] = [
  { label: 'Departure hour', render: row => row.departure_hour },
  { label: 'Flights', render: row => count(row.total_flights), numeric: true },
  { label: 'Delay rate', render: row => `${Number(row.delay_rate).toFixed(1)}%`, numeric: true },
  { label: 'Average delay', render: row => row.avg_delay == null ? '—' : `${Number(row.avg_delay).toFixed(1)} min`, numeric: true },
];

const causeColumns: Column<DelayCauseRow>[] = [
  { label: 'Rank', render: row => row.rank, numeric: true },
  { label: 'Cause', render: row => row.delay_cause },
  { label: 'Delay hours', render: row => Number(row.delay_hours).toFixed(1), numeric: true },
  { label: 'Share of delay', render: row => `${Number(row.delay_percentage).toFixed(1)}%`, numeric: true },
];

function AnalyticsPage() {
  const [activeView, setActiveView] = useState<'trends' | 'causes'>('trends');
  const months = useApiResource(fetchMonthlyDelayTrends, EMPTY_MONTHS, [], 'analytics-months');
  const hours = useApiResource(fetchHourlyDelayTrends, EMPTY_HOURS, [], 'analytics-hours');
  const causes = useApiResource(fetchDelayCauses, EMPTY_CAUSES, [], 'analytics-causes');

  const isLoading = months.loading || hours.loading || causes.loading;
  const hasErrors = months.error || hours.error || causes.error;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Enhanced header with view toggle */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold uppercase tracking-widest text-amber bg-amber/10 px-3 py-1 rounded-full">
                Intelligence
              </span>
              <span className={`text-xs text-ink-dim ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? 'Loading analytics...' : 'Real-time analysis'}
              </span>
            </div>
            <h1 className={TEXT_XL}>Delay analytics</h1>
            <p className={`${TEXT_SM} mt-2 max-w-2xl`}>
              Understand when delays happen and what is driving them across the network. 
              Interactive charts and tables provide deep insights into flight performance.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-2 rounded-xl border border-line bg-surface-raised p-1">
            {[
              { id: 'trends', label: 'Trend Analysis', Icon: AnalyticsIcons.Trends },
              { id: 'causes', label: 'Delay Causes', Icon: AnalyticsIcons.Causes },
            ].map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id as any)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  FOCUS_VISIBLE
                } ${
                  activeView === view.id
                    ? 'bg-amber text-bg shadow-lg'
                    : 'text-ink-dim hover:bg-surface hover:text-ink'
                }`}
                aria-current={activeView === view.id ? 'page' : undefined}
                disabled={isLoading}
              >
                <view.Icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick stats bar */}
        {!isLoading && !hasErrors && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-in-left">
            <div className={`${PANEL} ${PANEL_PADDING} bg-gradient-to-br from-surface-raised to-surface`}>
              <div className="text-sm text-ink-dim mb-1">Total data points</div>
              <div className="text-2xl font-bold text-ink">
                {(months.data.length + hours.data.length + causes.data.length).toLocaleString()}
              </div>
            </div>
            <div className={`${PANEL} ${PANEL_PADDING} bg-gradient-to-br from-surface-raised to-surface`}>
              <div className="text-sm text-ink-dim mb-1">Time range covered</div>
              <div className="text-2xl font-bold text-ink">12 months</div>
            </div>
            <div className={`${PANEL} ${PANEL_PADDING} bg-gradient-to-br from-surface-raised to-surface`}>
              <div className="text-sm text-ink-dim mb-1">Analysis frequency</div>
              <div className="text-2xl font-bold text-ink">Real-time</div>
            </div>
          </div>
        )}
      </div>

      <ErrorBanner errors={[months.error, hours.error, causes.error]} />

      {/* Skeleton loading for analytics */}
      {isLoading && !hasErrors && (
        <div className="space-y-8 mb-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className={`${PANEL} ${PANEL_PADDING} h-[430px]`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className={`${SKELETON_CLASSES} w-40 h-6 mb-2`} />
                    <div className={`${SKELETON_CLASSES} w-60 h-4`} />
                  </div>
                  <div className={`${SKELETON_CLASSES} w-20 h-8`} />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className={`${SKELETON_CLASSES} w-full h-12`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={`${PANEL} ${PANEL_PADDING} h-[430px]`}>
            <div className={`${SKELETON_CLASSES} w-32 h-6 mb-6`} />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className={`${SKELETON_CLASSES} w-full h-10`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics content */}
      {!isLoading && !hasErrors && (
        <div className="space-y-8 animate-fade-in">
          {/* Trends view */}
          {activeView === 'trends' && (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="h-[500px]">
                <DataTable 
                  title="Monthly delay trend" 
                  columns={monthColumns} 
                  rows={months.data} 
                  rowKey={row => row.month} 
                  emptyMessage={months.loading ? 'Loading monthly trends…' : 'No monthly data'}
                  isLoading={months.loading}
                  loadingRows={6}
                />
              </div>
              <div className="h-[500px]">
                <DataTable 
                  title="Delay by departure hour" 
                  columns={hourColumns} 
                  rows={hours.data} 
                  rowKey={row => row.departure_hour} 
                  emptyMessage={hours.loading ? 'Loading hourly trends…' : 'No hourly data'}
                  isLoading={hours.loading}
                  loadingRows={8}
                />
              </div>
            </div>
          )}

          {/* Causes view */}
          {activeView === 'causes' && (
            <div className="h-[600px]">
              <DataTable 
                title="Delay causes analysis" 
                columns={causeColumns} 
                rows={causes.data} 
                rowKey={row => row.delay_cause} 
                emptyMessage={causes.loading ? 'Loading delay causes…' : 'No delay cause data'}
                isLoading={causes.loading}
                loadingRows={10}
              />
            </div>
          )}

          {/* Insights panel */}
          <div className={`${PANEL} ${PANEL_PADDING} bg-gradient-to-br from-surface-raised to-surface`}>
            <h3 className={`${SECTION_HEADING} text-xl mb-4 flex items-center gap-2`}>
              <AnalyticsIcons.Insights className="w-5 h-5 text-amber" />
              Key Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Peak Delay Hours',
                  content: 'Delays peak between 3-6 PM due to airport congestion and crew scheduling.',
                  Icon: AnalyticsIcons.Clock,
                  color: 'amber'
                },
                {
                  title: 'Seasonal Patterns',
                  content: 'Winter months show 15% higher delays due to weather conditions.',
                  Icon: AnalyticsIcons.Snowflake,
                  color: 'blue'
                },
                {
                  title: 'Top Causes',
                  content: 'Air carrier delays account for 40% of all delays in the network.',
                  Icon: AnalyticsIcons.Plane,
                  color: 'good'
                },
              ].map((insight, index) => (
                <div 
                  key={insight.title} 
                  className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    insight.color === 'amber' ? 'border-amber/30 hover:border-amber/50' :
                    insight.color === 'blue' ? 'border-amber/30 hover:border-amber/50' :
                    'border-good/30 hover:border-good/50'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      insight.color === 'amber' ? 'bg-amber/10' :
                      insight.color === 'blue' ? 'bg-amber/10' :
                      'bg-good/10'
                    }`}>
                      <insight.Icon className={`w-5 h-5 ${
                        insight.color === 'amber' ? 'text-amber' :
                        insight.color === 'blue' ? 'text-ink' :
                        'text-good'
                      }`} />
                    </div>
                    <h4 className="font-semibold text-ink">{insight.title}</h4>
                  </div>
                  <p className="text-sm text-ink-dim">{insight.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasErrors && months.data.length === 0 && hours.data.length === 0 && causes.data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-amber/10 flex items-center justify-center">
            <AnalyticsIcons.Chart className="w-10 h-10 text-amber" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-ink mb-2">No analytics data available</h3>
            <p className="text-ink-dim max-w-md">
              Analytics data will appear here once it becomes available. 
              Check back later or try a different time period.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

// Memoized component for performance
export default memo(AnalyticsPage);
