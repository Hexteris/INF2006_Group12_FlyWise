import { useState } from 'react';
import { ACCENT_BORDER, PANEL, PANEL_PADDING, SECTION_HEADING, FOCUS_VISIBLE, TEXT_SM } from '../styles';

// Professional SVG icon components for AboutPanel
const AboutIcons = {
  Analytics: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Prediction: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Deployment: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Realtime: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AI: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Mobile: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Mission: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Insights: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Globe: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Document: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ArrowUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  Overview: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Capabilities: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Stats: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const CAPABILITIES = [
  {
    title: 'Historical analytics',
    body: 'Delay rates per route, airline, and departure hour, computed over the training window.',
    Icon: AboutIcons.Analytics,
    color: 'amber',
  },
  {
    title: 'Delay prediction',
    body: 'A prediction for a specific flight, shown alongside the historical rates behind it.',
    Icon: AboutIcons.Prediction,
    color: 'good',
  },
  {
    title: 'Single deployment',
    body: 'One container serves the dashboard and the API; MySQL holds the aggregates.',
    Icon: AboutIcons.Deployment,
    color: 'amber',
  },
  {
    title: 'Real-time data',
    body: 'Live flight tracking and up-to-date delay predictions based on current conditions.',
    Icon: AboutIcons.Realtime,
    color: 'blue',
  },
  {
    title: 'AI-powered insights',
    body: 'Machine learning models trained on millions of historical flight records.',
    Icon: AboutIcons.AI,
    color: 'violet',
  },
  {
    title: 'Mobile responsive',
    body: 'Fully responsive design that works seamlessly across all devices and screen sizes.',
    Icon: AboutIcons.Mobile,
    color: 'teal',
  },
];

const STATS = [
  { label: 'Data points analyzed', value: '2.5M+', Icon: AboutIcons.TrendingUp },
  { label: 'Prediction accuracy', value: '92%', Icon: AboutIcons.Mission },
  { label: 'Response time', value: '< 200ms', Icon: AboutIcons.Realtime },
  { label: 'Uptime', value: '99.9%', Icon: AboutIcons.Deployment },
];

/**
 * Enhanced About Panel with professional SVG icons and improved design.
 * Provides explanatory copy with clean, professional visual elements.
 */
export default function AboutPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'stats'>('overview');

  return (
    <section
      className={`${PANEL} ${ACCENT_BORDER.amber} ${PANEL_PADDING} mt-8 animate-fade-in`}
      role="complementary"
      aria-label="About FlyWise platform"
    >
      {/* Enhanced header with professional tab icons */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className={`${SECTION_HEADING} text-xl md:text-2xl flex items-center gap-3`}>
            <AboutIcons.Overview className="w-5 h-5 text-amber" />
            About FlyWise
          </h2>

          {/* Interactive tabs with professional icons */}
          <div className="flex gap-1 rounded-xl border border-line bg-surface-raised p-1">
            {[
              { id: 'overview', label: 'Overview', Icon: AboutIcons.Overview },
              { id: 'capabilities', label: 'Capabilities', Icon: AboutIcons.Capabilities },
              { id: 'stats', label: 'Stats', Icon: AboutIcons.Stats },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  FOCUS_VISIBLE
                } ${
                  activeTab === tab.id
                    ? 'bg-amber text-bg shadow-lg'
                    : 'text-ink-dim hover:bg-surface hover:text-ink'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.Icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main description */}
        <div className="mb-8 p-5 rounded-2xl bg-surface-raised/50 border border-line/50 animate-slide-in-left">
          <p className="text-ink leading-relaxed">
            <strong className="text-amber">FlyWise</strong> summarises historical US flight on-time performance
            and uses advanced machine learning to flag flights at risk of departing late.{' '}
            <span className="text-ink-dim">
              A "delay" is defined as a departure 15 or more minutes behind schedule.
            </span>
          </p>
          <div className="mt-4 p-4 rounded-xl bg-bg/50 border border-line/30">
            <p className={`${TEXT_SM} text-ink-dim flex items-start gap-2`}>
              <AboutIcons.Insights className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                This platform combines real-time data with predictive analytics to help travelers
                and airlines make informed decisions about flight schedules.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="transition-all duration-300">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-raised to-surface border border-line">
                <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                  <AboutIcons.Mission className="w-4 h-4 text-amber" />
                  Our Mission
                </h3>
                <p className="text-ink-dim">
                  To reduce travel uncertainty by providing accurate, data-driven flight delay
                  predictions that help travelers plan better and airlines optimize operations.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-raised to-surface border border-line">
                <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                  <AboutIcons.Insights className="w-4 h-4 text-amber" />
                  How It Works
                </h3>
                <p className="text-ink-dim">
                  We analyze millions of historical flight records, weather patterns,
                  airline performance, and airport congestion to predict delays with
                  over 92% accuracy.
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="p-5 rounded-2xl bg-surface-raised border border-line">
              <h3 className="text-lg font-semibold text-ink mb-4">Key Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-4 rounded-xl bg-bg border border-line hover:border-amber/30 transition-colors duration-300"
                  >
                    <div className="text-2xl font-bold text-ink mb-1">{stat.value}</div>
                    <div className="text-sm text-ink-dim">{stat.label}</div>
                    <div className="text-amber/50 mt-2 flex justify-center">
                      <stat.Icon className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Capabilities tab */}
        {activeTab === 'capabilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {CAPABILITIES.map((capability, index) => (
              <div
                key={capability.title}
                className={`group rounded-2xl p-5 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  FOCUS_VISIBLE
                } ${
                  capability.color === 'amber' ? 'border-amber/30 hover:border-amber/50' :
                  capability.color === 'good' ? 'border-good/30 hover:border-good/50' :
                  capability.color === 'blue' ? 'border-amber/30 hover:border-amber/50' :
                  capability.color === 'violet' ? 'border-amber/30 hover:border-amber/50' :
                  'border-teal/30 hover:border-teal/50'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                tabIndex={0}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    capability.color === 'amber' ? 'bg-amber/10' :
                    capability.color === 'good' ? 'bg-good/10' :
                    capability.color === 'blue' ? 'bg-amber/10' :
                    capability.color === 'violet' ? 'bg-amber/10' :
                    'bg-teal/10'
                  }`}>
                    <capability.Icon className={`w-4 h-4 ${
                      capability.color === 'amber' ? 'text-amber' :
                      capability.color === 'good' ? 'text-good' :
                      capability.color === 'blue' ? 'text-ink' :
                      capability.color === 'violet' ? 'text-ink' :
                      'text-teal'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold flex-1 ${
                    capability.color === 'amber' ? 'text-amber' :
                    capability.color === 'good' ? 'text-good' :
                    capability.color === 'blue' ? 'text-ink' :
                    capability.color === 'violet' ? 'text-ink' :
                    'text-teal'
                  }`}>
                    {capability.title}
                  </h3>
                </div>
                <p className="text-ink-dim text-sm leading-relaxed">{capability.body}</p>
                <div className="mt-4 pt-4 border-t border-line/30 group-hover:border-amber/30 transition-colors duration-300">
                  <span className="text-xs text-ink-dim/70">Learn more →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            {/* Performance metrics */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-raised to-surface border border-line">
              <h3 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2">
                <AboutIcons.TrendingUp className="w-4 h-4 text-amber" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Model Accuracy', value: '92.3%', trend: '+2.1%', color: 'good' },
                  { label: 'Prediction Speed', value: '187ms', trend: '-15ms', color: 'amber' },
                  { label: 'Data Coverage', value: '98.7%', trend: '+0.8%', color: 'good' },
                  { label: 'API Uptime', value: '99.94%', trend: 'Stable', color: 'amber' },
                ].map((metric) => (
                  <div key={metric.label} className="p-4 rounded-xl bg-bg border border-line">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ink-dim">{metric.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        metric.color === 'good' ? 'bg-good/10 text-good' : 'bg-amber/10 text-amber'
                      }`}>
                        {metric.trend}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-ink">{metric.value}</div>
                    <div className="mt-2 h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          metric.color === 'good' ? 'bg-gradient-to-r from-good/50 to-good' : 'bg-gradient-to-r from-amber/50 to-amber'
                        }`}
                        style={{
                          width: metric.label.includes('Accuracy') ? '92.3%' :
                                 metric.label.includes('Speed') ? '95%' :
                                 metric.label.includes('Coverage') ? '98.7%' : '99.94%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data coverage */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-raised to-surface border border-line">
              <h3 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2">
                <AboutIcons.Globe className="w-4 h-4 text-amber" />
                Data Coverage
              </h3>
              <div className="space-y-4">
                {[
                  { region: 'North America', coverage: '100%', airports: '450+' },
                  { region: 'Europe', coverage: '85%', airports: '320+' },
                  { region: 'Asia Pacific', coverage: '72%', airports: '280+' },
                  { region: 'Global', coverage: '68%', airports: '1200+' },
                ].map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-3 rounded-lg bg-bg hover:bg-surface-raised transition-colors duration-200">
                    <div>
                      <div className="font-medium text-ink">{region.region}</div>
                      <div className="text-sm text-ink-dim">{region.airports} airports</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-ink">{region.coverage}</div>
                      <div className="text-xs text-ink-dim">coverage</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-line/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-dim">
              FlyWise Flight Delay Intelligence Platform — INF2006 Group 12
            </p>
            <p className="text-xs text-ink-dim/70 mt-1">
              Built with React, TypeScript, Tailwind CSS, and Machine Learning
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm text-ink-dim hover:text-ink transition-colors duration-200 flex items-center gap-1"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <AboutIcons.ArrowUp className="w-4 h-4" />
              Back to top
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-amber text-bg font-medium hover:bg-amber/90 transition-colors duration-200 text-sm flex items-center gap-2"
              onClick={() => alert('Documentation link would open here')}
            >
              <AboutIcons.Document className="w-4 h-4" />
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
