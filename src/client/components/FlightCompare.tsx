import { useEffect, useRef, useState } from 'react';
import type { PredictionResult } from '../../types';
import {
  pct,
  predictFlight,
  risk,
  type Dims,
  type TripFlight,
} from '../trip';

type State = PredictionResult | { error: string };

const ok = (s: State | undefined): s is PredictionResult =>
  !!s && 'score' in s;

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-700">
        <span>{label}</span>
        <b className="text-slate-900">
          {value == null ? 'no history' : pct(value)}
        </b>
      </div>

      <div className="mt-1 h-2 rounded bg-slate-200">
        <div
          className={`h-2 rounded ${color}`}
          style={{
            width: `${Math.min(100, (value ?? 0) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  flights: TripFlight[];
  dims: Dims | null;
}

export default function FlightCompare({ flights, dims }: Props) {
  const [results, setResults] = useState<Record<string, State>>({});
  const asked = useRef(new Set<string>());

  // Predict each newly ticked flight once; results are cached by flight key.
  useEffect(() => {
    if (!dims) return;

    flights.forEach((f) => {
      if (asked.current.has(f.key)) return;

      asked.current.add(f.key);

      predictFlight(f)
        .then((r) =>
          setResults((s) => ({
            ...s,
            [f.key]: r,
          }))
        )
        .catch((e: Error) =>
          setResults((s) => ({
            ...s,
            [f.key]: {
              error: e.message,
            },
          }))
        );
    });
  }, [flights, dims]);

  if (flights.length < 2)
    return (
      <p className="rounded-xl border border-line bg-white p-6 text-center text-slate-600">
        Tick 2–4 flights in the table above to compare their delay risk.
      </p>
    );

  const scored = flights.filter((f) => ok(results[f.key]));

  const best =
    scored.length > 1
      ? scored.reduce((a, b) =>
          (results[a.key] as PredictionResult).score <=
          (results[b.key] as PredictionResult).score
            ? a
            : b
        )
      : null;

  return (
    <div className="space-y-3">
      {best && (
        <p className="rounded-md border border-good/30 bg-good/10 p-3 text-sm text-good">
          <b>{best.number}</b> ({best.origin} → {best.destination}) has
          the lowest historical delay risk of the selected flights.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {flights.map((f) => {
          const r = results[f.key];

          return (
            <div
              key={f.key}
              className={`space-y-3 rounded-xl border bg-white p-4 ${
                best === f
                  ? 'border-good ring-1 ring-good'
                  : 'border-line'
              }`}
            >
              <div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{f.number}</span>

                  {best === f && (
                    <span className="text-xs font-semibold text-good">
                      Lowest risk
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  {f.airline ?? f.airlineCode} · {f.origin} →{' '}
                  {f.destination} · {f.date}
                </div>
              </div>

              {!r && (
                <p className="text-sm text-slate-500">
                  Predicting…
                </p>
              )}

              {r && !ok(r) && (
                <p className="text-sm text-bad">
                  {r.error}
                </p>
              )}

              {ok(r) && (
                <>
                  <div
                    className={`text-2xl font-bold ${risk(r.score).text}`}
                  >
                    {pct(r.score)}{' '}
                    <span className="text-sm font-medium">
                      {risk(r.score).label} risk
                    </span>
                  </div>

                  <Bar
                    label="Blended risk"
                    value={r.score}
                    color={risk(r.score).bar}
                  />

                  <Bar
                    label="This route + airline"
                    value={r.historical.routeDelayRate}
                    color="bg-sky-500"
                  />

                  <Bar
                    label="This departure hour"
                    value={r.historical.hourlyDelayRate}
                    color="bg-indigo-500"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}