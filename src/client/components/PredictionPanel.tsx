import type { PredictionResult } from '../../types';
import { percent } from '../format';
import { ACCENT_BORDER, PANEL, PANEL_PADDING, SECTION_HEADING } from '../styles';

interface PredictionPanelProps {
  result: PredictionResult | null;
  error: string | null;
  isLoading: boolean;
}

/** Renders a historical rate, distinguishing "no history" from a rate of zero. */
function rate(value: number | null): string {
  return value === null ? 'No history for this combination' : percent(value);
}

/**
 * Shows the model's verdict together with the historical rates behind it, so the
 * number is auditable rather than something the user has to take on faith.
 */
export default function PredictionPanel({ result, error, isLoading }: PredictionPanelProps) {
  const delayed = result?.label === 'DELAYED';
  const accent = error ? ACCENT_BORDER.rose : delayed ? ACCENT_BORDER.rose : ACCENT_BORDER.teal;

  return (
    <section className={`${PANEL} ${result || error ? accent : ACCENT_BORDER.slate} ${PANEL_PADDING}`}>
      <div className="mb-6 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-ink-dim"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
        <h2 className={`${SECTION_HEADING} text-xl`}>Prediction result</h2>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 p-4 text-bad">
          {error}
        </p>
      )}

      {!error && isLoading && (
        <div className="flex flex-col items-center gap-3 py-12 text-ink-dim">
          <svg className="h-8 w-8 animate-spin text-amber" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p>Predicting…</p>
        </div>
      )}

      {!error && !isLoading && !result && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-bg py-12 text-center text-ink-dim">
          <svg className="h-8 w-8 text-ink-dim/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
            />
          </svg>
          <p>Submit a flight to see a prediction.</p>
        </div>
      )}

      {!error && !isLoading && result && (
        <div className="space-y-5">
          <div
            className={`rounded-xl border-2 p-5 bg-bg ${delayed ? 'border-bad/50' : 'border-good/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-dim">Prediction</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                  delayed ? 'bg-bad/15 text-bad' : 'bg-good/15 text-good'
                }`}
              >
                {delayed ? 'Delayed' : 'On time'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-dim">Confidence</span>
              <span className="tabular-nums font-mono font-semibold text-ink">{percent(result.score, 0)}</span>
            </div>
            <p className="mt-3 text-xs font-mono text-ink-dim/70">Model: {result.modelVersion}</p>
          </div>

          <div className="rounded-lg bg-bg p-4 text-sm text-ink-dim">
            <p className="mb-2 font-medium text-ink-dim">Historical evidence</p>
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt>Delay rate on this route and airline</dt>
                <dd className="tabular-nums font-mono font-medium text-ink">{rate(result.historical.routeDelayRate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Delay rate at this airport and hour</dt>
                <dd className="tabular-nums font-mono font-medium text-ink">{rate(result.historical.hourlyDelayRate)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
