import { memo, useEffect, useState } from 'react';
import type { PredictionResult } from '../../types';
import { percent } from '../format';
import { 
  ACCENT_BORDER, 
  PANEL, 
  PANEL_PADDING, 
  SECTION_HEADING, 
  NOTIFICATION_ERROR, 
  NOTIFICATION_INFO, 
  LOADING_SPINNER,
  FOCUS_VISIBLE,
  TEXT_MD 
} from '../styles';

interface PredictionPanelProps {
  result: PredictionResult | null;
  error: string | null;
  isLoading: boolean;
}

/** Renders a historical rate, distinguishing "no history" from a rate of zero. */
function rate(value: number | null): string {
  return value === null ? 'No history for this combination' : percent(value);
}

/** Generates a detailed explanation for the prediction result */
function generateExplanation(result: PredictionResult): string {
  const delayed = result.label === 'DELAYED';
  const confidence = result.score;
  
  if (delayed) {
    if (confidence > 0.8) {
      return "High likelihood of delay based on strong historical patterns.";
    } else if (confidence > 0.6) {
      return "Moderate likelihood of delay. Consider checking alternatives.";
    } else {
      return "Slight possibility of delay. Monitor flight status.";
    }
  } else {
    if (confidence > 0.8) {
      return "Excellent on-time probability based on historical performance.";
    } else if (confidence > 0.6) {
      return "Good on-time probability. Minor delays possible.";
    } else {
      return "Fair on-time probability. Allow extra time for connections.";
    }
  }
}

/** Generates recommendation based on prediction */
function generateRecommendation(result: PredictionResult): string {
  const delayed = result.label === 'DELAYED';
  
  if (delayed) {
    if (result.score > 0.7) {
      return "Consider booking a later flight or alternative airline.";
    } else {
      return "Allow extra time at the airport and check flight status.";
    }
  } else {
    if (result.score > 0.7) {
      return "Proceed as planned with confidence.";
    } else {
      return "Plan for normal travel with minor buffer time.";
    }
  }
}

function PredictionPanel({ result, error, isLoading }: PredictionPanelProps) {
  const delayed = result?.label === 'DELAYED';
  const [animateResult, setAnimateResult] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const accent = error ? ACCENT_BORDER.rose : delayed ? ACCENT_BORDER.rose : ACCENT_BORDER.teal;
  const hasResult = !error && !isLoading && result;

  // Trigger animation when result changes
  useEffect(() => {
    if (hasResult) {
      setAnimateResult(true);
      const timer = setTimeout(() => setAnimateResult(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasResult]);

  // Reset showDetails when result changes
  useEffect(() => {
    setShowDetails(false);
  }, [result]);

  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  return (
    <section 
      className={`${PANEL} ${result || error ? accent : ACCENT_BORDER.slate} ${PANEL_PADDING} transition-all duration-500 hover:shadow-xl relative`}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {/* Enhanced header with status indicator */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="h-7 w-7 text-ink-dim transition-transform duration-300 hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            {hasResult && (
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${delayed ? 'bg-bad animate-ping' : 'bg-good animate-ping'}`} />
            )}
          </div>
          <div>
            <h2 className={`${SECTION_HEADING} text-xl md:text-2xl flex items-center gap-2`}>
              Prediction result
              {isLoading && (
                <span className="text-xs font-normal bg-amber/20 text-amber px-2 py-1 rounded-full animate-pulse">
                  Analyzing...
                </span>
              )}
            </h2>
            <p className="text-sm text-ink-dim mt-1">
              {hasResult ? "Model prediction with confidence score" : "Results will appear here"}
            </p>
          </div>
        </div>

        {/* Details toggle */}
        {hasResult && (
          <button
            type="button"
            onClick={toggleDetails}
            className="text-sm text-ink-dim hover:text-ink transition-colors duration-200 px-3 py-2 rounded-lg border border-line hover:border-ink-dim/40 flex items-center gap-2"
            aria-expanded={showDetails}
            aria-controls="prediction-details"
          >
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
            <span aria-hidden="true">{showDetails ? '↑' : '↓'}</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className={NOTIFICATION_ERROR + " animate-fade-in"}>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-semibold">Prediction failed</p>
              <p className="mt-1">{error}</p>
              <p className="text-xs mt-2 opacity-80">Please try again with different parameters</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!error && isLoading && (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center animate-fade-in">
          <div className="relative">
            <div className={LOADING_SPINNER + " w-16 h-16 border-4"} />
            <div className="absolute inset-0 border-4 border-transparent border-t-amber/20 rounded-full animate-ping" />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-semibold text-ink">Analyzing flight data...</p>
            <p className="text-ink-dim max-w-sm">
              Processing historical patterns, weather conditions, and airline performance
            </p>
            <div className="w-64 h-2 bg-surface-raised rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-amber to-good animate-progress rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && !isLoading && !result && (
        <div 
          className="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-line bg-surface-raised/50 p-12 text-center animate-fade-in"
          aria-label="No prediction yet"
        >
          <div className="relative">
            <svg 
              className="w-20 h-20 text-ink-dim/40" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-br from-amber/10 to-good/10 rounded-full blur-lg" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-ink">No prediction yet</h3>
            <p className="text-ink-dim max-w-sm">
              Submit a flight using the prediction form to see delay probability and historical evidence.
            </p>
          </div>
          <div className={NOTIFICATION_INFO + " text-left max-w-sm"}>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Tip: Select different airports, airlines, and times for varied predictions</p>
            </div>
          </div>
        </div>
      )}

      {/* Result state */}
      {!error && !isLoading && result && (
        <div className={`space-y-6 animate-fade-in ${animateResult ? 'scale-[1.02]' : 'scale-100'} transition-transform duration-300`}>
          {/* Main prediction card */}
          <div
            className={`rounded-2xl border-3 p-6 ${FOCUS_VISIBLE} transition-all duration-300 hover:shadow-lg ${
              delayed ? 'border-bad/60 bg-bad/5' : 'border-good/60 bg-good/5'
            }`}
            tabIndex={0}
            aria-label={`Prediction: ${delayed ? 'Delayed' : 'On time'} with ${percent(result.score, 0)} confidence`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-ink-dim uppercase tracking-wider mb-1">Prediction</h3>
                <p className={`text-2xl md:text-3xl font-bold ${delayed ? 'text-bad' : 'text-good'} flex items-center gap-2`}>
                  {delayed ? 'Likely Delayed' : 'Likely On Time'}
                  <span 
                    className={`text-base px-2 py-1 rounded-full ${delayed ? 'bg-bad/20' : 'bg-good/20'} animate-pulse`}
                    aria-hidden="true"
                  >
                    {delayed ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </p>
              </div>
              
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className="text-right">
                  <h4 className="text-sm font-semibold text-ink-dim">Confidence score</h4>
                  <div className={`text-3xl md:text-4xl font-bold font-mono tabular-nums ${delayed ? 'text-bad' : 'text-good'}`}>
                    {percent(result.score, 0)}
                  </div>
                </div>
                
                {/* Confidence meter */}
                <div className="w-48 h-3 bg-surface-raised rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${delayed ? 'bg-gradient-to-r from-bad/50 to-bad' : 'bg-gradient-to-r from-good/50 to-good'}`}
                    style={{ width: `${result.score * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-6 p-4 rounded-xl bg-surface/50 border border-line/50">
              <p className="text-sm text-ink-dim mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Explanation
              </p>
              <p className="text-ink">{generateExplanation(result)}</p>
            </div>

            {/* Quick recommendation */}
            <div className="mt-4 p-4 rounded-xl bg-surface/50 border border-line/50">
              <p className="text-sm text-ink-dim mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recommendation
              </p>
              <p className="text-ink">{generateRecommendation(result)}</p>
            </div>

            {/* Model info */}
            <div className="mt-4 text-xs text-ink-dim/70 font-mono">
              <span>Model version: {result.modelVersion}</span>
            </div>
          </div>

          {/* Historical evidence - collapsible */}
          <div 
            id="prediction-details"
            className={`space-y-4 transition-all duration-300 overflow-hidden ${showDetails ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            aria-hidden={!showDetails}
          >
            <div className="rounded-xl bg-surface p-5 border border-line">
              <h4 className={`${TEXT_MD} mb-4 flex items-center gap-2`}>
                <svg className="w-5 h-5 text-ink-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Historical evidence
              </h4>
              
              <dl className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg bg-surface-raised/50 hover:bg-surface-raised transition-colors duration-200">
                  <dt className="text-sm text-ink-dim flex-1">
                    Delay rate on this route and airline
                  </dt>
                  <dd className="tabular-nums font-mono font-semibold text-ink text-lg">
                    {rate(result.historical.routeDelayRate)}
                  </dd>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg bg-surface-raised/50 hover:bg-surface-raised transition-colors duration-200">
                  <dt className="text-sm text-ink-dim flex-1">
                    Delay rate at this airport and hour
                  </dt>
                  <dd className="tabular-nums font-mono font-semibold text-ink text-lg">
                    {rate(result.historical.hourlyDelayRate)}
                  </dd>
                </div>
              </dl>

              {/* Additional insights */}
              <div className="mt-6 pt-5 border-t border-line/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-ink-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-ink-dim">Insights</p>
                </div>
                <ul className="space-y-2 text-sm text-ink">
                  <li className="flex items-start gap-2">
                    <span className="text-ink-dim mt-0.5">•</span>
                    <span>Based on historical flight data analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ink-dim mt-0.5">•</span>
                    <span>Considers seasonal patterns and time of day factors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ink-dim mt-0.5">•</span>
                    <span>Updated with latest airline performance metrics</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="flex-1 min-w-[120px] px-4 py-3 rounded-lg bg-surface border border-line text-ink font-medium hover:bg-surface-raised transition-colors duration-200 text-center"
                onClick={toggleDetails}
              >
                Close details
              </button>
              <button
                type="button"
                className="flex-1 min-w-[120px] px-4 py-3 rounded-lg bg-amber text-bg font-medium hover:bg-amber/90 transition-colors duration-200 text-center"
                onClick={() => {
                  // In a real app, this would trigger a new prediction
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                New prediction
              </button>
            </div>
          </div>

          {/* Show details button when collapsed */}
          {!showDetails && (
            <button
              type="button"
              onClick={toggleDetails}
              className="w-full py-3 rounded-lg border-2 border-dashed border-line text-ink-dim hover:text-ink hover:border-ink-dim/60 transition-all duration-200 text-center flex items-center justify-center gap-2"
              aria-expanded={showDetails}
              aria-controls="prediction-details"
            >
              <span>Show historical evidence and details</span>
              <span aria-hidden="true">↓</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(PredictionPanel, (prevProps, nextProps) => {
  return (
    prevProps.result === nextProps.result &&
    prevProps.error === nextProps.error &&
    prevProps.isLoading === nextProps.isLoading
  );
});
