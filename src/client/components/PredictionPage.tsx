import { useState } from 'react';
import type { PredictionResult, User } from '../../types';
import { clock, pct, predictFlight, risk, type Dims, type TripFlight } from '../trip';
import HistoricalSearch from './HistoricalSearch';

interface Props {
  dims: Dims | null;
  searched: TripFlight[];
  saved: TripFlight[];
  user: User | null;
  onToggleSave: (f: TripFlight) => void;
  onLogin: () => void;
}

function Rate({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-dim">{label}</span>
      <b className="text-ink">{v == null ? 'no history' : pct(v)}</b>
    </div>
  );
}

export default function PredictionPage({
  dims,
  searched,
  saved,
  user,
  onToggleSave,
  onLogin,
}: Props) {
  const [source, setSource] = useState<'saved' | 'searched'>(
    searched.length ? 'searched' : 'saved'
  );
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<TripFlight | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const full = source === 'saved' ? saved : searched;
  const list = full.filter((f) => f.number.toUpperCase().includes(q.trim().toUpperCase()));
  const isSaved = (f: TripFlight) => saved.some((s) => s.key === f.key);

  const predict = async (f: TripFlight) => {
    if (!dims) return;
    setPicked(f);
    setResult(null);
    setError('');
    setLoading(true);
    try {
      setResult(await predictFlight(f, dims.airports, dims.airlines));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Prediction</h1>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">Predict a future flight’s delay</h2>
            <p className="text-sm text-ink-dim">
              Pick a flight you searched or saved. Risk is based on historical delay rates for
              the route, airline and departure hour.
            </p>
          </div>
          <div className="flex rounded-md border border-line text-sm">
            {(['saved', 'searched'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  source === s ? 'bg-amber text-bg' : 'text-ink hover:bg-surface-raised'
                }`}
              >
                {s} ({s === 'saved' ? saved.length : searched.length})
              </button>
            ))}
          </div>
        </div>

        {source === 'saved' && !user ? (
          <p className="rounded-md border border-line bg-surface-raised p-4 text-center text-sm text-ink">
            <button onClick={onLogin} className="font-medium text-amber underline">
              Log in
            </button>{' '}
            to see your saved flights.
          </p>
        ) : full.length === 0 ? (
          <p className="rounded-md bg-surface-raised p-4 text-center text-sm text-ink-dim">
            {source === 'saved'
              ? 'No saved flights yet. Star flights on the Live Flights page.'
              : 'No searched flights yet. Load some on the Live Flights page.'}
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by flight number…"
                className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
              <div className="max-h-96 space-y-2 overflow-auto">
                {list.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => predict(f)}
                    className={`flex w-full items-center justify-between rounded-lg border border-line bg-surface-raised p-3 text-left text-ink transition-colors hover:border-amber/50 hover:bg-surface ${
                      picked?.key === f.key ? 'border-amber bg-surface' : ''
                    }`}
                  >
                    <span>
                      <b>{f.number}</b> · {f.airline ?? f.airlineCode}
                      <br />
                      <span className="text-xs text-ink-dim">
                        {f.origin} → {f.destination} · {f.date} · {clock(f.scheduledDeparture)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-amber">Predict →</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-line bg-surface-raised p-4">
              {!picked && (
                <p className="text-sm text-ink-dim">Select a flight to see its delay risk.</p>
              )}
              {loading && <p className="text-sm text-ink-dim">Predicting…</p>}
              {error && <p className="text-sm text-bad">{error}</p>}
              {picked && result && (
                <>
                  <div className="font-semibold text-ink">
                    {picked.number} · {picked.origin} → {picked.destination}
                  </div>
                  <div className={`text-3xl font-bold ${risk(result.score).text}`}>
                    {pct(result.score)}
                  </div>
                  <div className="text-sm">
                    {risk(result.score).label} delay risk{' '}
                    <span className="text-ink-dim">
                      ({result.label === 'DELAYED' ? 'likely delayed' : 'likely on time'})
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-line pt-2">
                    <Rate label="Route + airline history" v={result.historical.routeDelayRate} />
                    <Rate label="Departure-hour history" v={result.historical.hourlyDelayRate} />
                  </div>
                  <div className="text-xs text-ink-dim">Model: {result.modelVersion}</div>
                  <button
                    onClick={() => onToggleSave(picked)}
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-amber/50 hover:bg-surface-raised"
                  >
                    {isSaved(picked) ? '★ Saved' : '☆ Save flight'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <HistoricalSearch dims={dims} />
    </>
  );
}