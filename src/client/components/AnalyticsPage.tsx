import { useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchAirlineAnalytics,
  fetchAirlineRouteAnalytics,
  fetchAirportAnalytics,
  fetchDelayCauses,
  fetchHourlyDelayTrends,
  fetchMonthlyDelayTrends,
  fetchRouteAnalytics,
  fetchSummary,
} from '../services/api';
import { useApiResource } from '../hooks/useApiResource';
import { pct, type Dims } from '../trip';
import DimSelect from './DimSelect';
import RowsView, { type Row } from './RowsView';

type Field = 'airline' | 'airport' | 'origin' | 'destination';

const FIELDS: Record<Field, { label: string; dim: keyof Dims }> = {
  airline: { label: 'Airline', dim: 'airlines' },
  airport: { label: 'Airport', dim: 'airports' },
  origin: { label: 'Origin', dim: 'airports' },
  destination: { label: 'Destination', dim: 'airports' },
};

type Vals = Record<Field, string>;

const SECTIONS = [
  {
    id: 'airline',
    title: 'Airline Dashboard',
    fields: ['airline'] as Field[],
    run: (v: Vals) => fetchAirlineAnalytics(v.airline),
  },
  {
    id: 'route',
    title: 'Route Reliability',
    fields: ['origin', 'destination'] as Field[],
    run: (v: Vals) => fetchRouteAnalytics(v.origin, v.destination),
  },
  {
    id: 'airport',
    title: 'Airport Dashboard',
    fields: ['airport'] as Field[],
    run: (v: Vals) => fetchAirportAnalytics(v.airport),
  },
  { id: 'monthly', title: 'Delay by month' },
  { id: 'hourly', title: 'Delay by hour' },
  { id: 'causes', title: 'Delay causes' },
  {
    id: 'airline-route',
    title: 'Airline + Route Analysis',
    fields: ['airline', 'origin', 'destination'] as Field[],
    run: (v: Vals) =>
      fetchAirlineRouteAnalytics(v.airline, v.origin, v.destination),
  },
];

/** Shows loading / error / content for a useApiResource result. */
function Load<T>({
  res,
  children,
}: {
  res: { data: T | null; loading: boolean; error: string | null };
  children: (d: T) => ReactNode;
}) {
  if (res.loading) return <p className="text-ink-dim">Loading…</p>;
  if (res.error) return <p className="text-bad">{res.error}</p>;
  return res.data ? <>{children(res.data)}</> : null;
}

/** Dropdowns + button for the sections whose endpoint needs parameters. */
function QueryPanel({
  fields,
  dims,
  run,
}: {
  fields: Field[];
  dims: Dims | null;
  run: (v: Vals) => Promise<Row[]>;
}) {
  const [vals, setVals] = useState<Vals>({
    airline: '',
    airport: '',
    origin: '',
    destination: '',
  });

  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const go = async () => {
    setLoading(true);
    setError('');

    try {
      setRows(await run(vals));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        {fields.map((f) => (
          <DimSelect
            key={f}
            label={FIELDS[f].label}
            value={vals[f]}
            placeholder="Select…"
            options={dims?.[FIELDS[f].dim] ?? []}
            onChange={(v) => setVals((s) => ({ ...s, [f]: v }))}
          />
        ))}

        <button
          onClick={go}
          disabled={loading || !fields.every((f) => vals[f])}
          className="rounded-lg bg-amber px-4 py-2 font-semibold text-bg hover:bg-amber/90 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Show analytics'}
        </button>
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      {rows && <RowsView rows={rows} />}
    </div>
  );
}

interface Point {
  x: string;
  rate: number;
  avg: number | null;
}

/** Converts trend rows to chart points. Handles delay_rate as a fraction or a percentage. */
function toPoints<
  T extends {
    delay_rate: number;
    avg_delay: number | null;
    total_flights: number;
  },
>(rows: T[], x: (r: T) => string): Point[] {
  const max = Math.max(...rows.map((r) => Number(r.delay_rate) || 0));
  const scale = max <= 1 ? 100 : 1;

  return rows.map((r) => ({
    x: x(r),
    rate: +(Number(r.delay_rate) * scale).toFixed(1),
    avg: r.avg_delay == null ? null : +Number(r.avg_delay).toFixed(1),
  }));
}

/** Shared styling for all Recharts tooltips. */
const TOOLTIP_STYLE = {
  backgroundColor: '#17304F',
  border: '1px solid #24405F',
  borderRadius: '8px',
  color: '#EAF0F6',
};

function TrendChart({ points }: { points: Point[] }) {
  const data = points.map((p) => ({
    x: p.x,
    'Delay rate (%)': p.rate,
    'Avg delay (min)': p.avg,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid
            stroke="#24405F"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="x"
            stroke="#EAF0F6"
            tick={{ fill: '#EAF0F6' }}
          />

          <YAxis
            yAxisId="l"
            stroke="#EAF0F6"
            tick={{ fill: '#EAF0F6' }}
          />

          <YAxis
            yAxisId="r"
            orientation="right"
            stroke="#EAF0F6"
            tick={{ fill: '#EAF0F6' }}
          />

          <Tooltip contentStyle={TOOLTIP_STYLE} />

          <Legend
            wrapperStyle={{
              color: '#EAF0F6',
            }}
          />

          <Bar
            yAxisId="l"
            dataKey="Delay rate (%)"
            fill="#38BDF8"
          />

          <Line
            yAxisId="r"
            dataKey="Avg delay (min)"
            stroke="#E5595F"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage({ dims }: { dims: Dims | null }) {
  const [active, setActive] = useState(SECTIONS[0].id);
  const section = SECTIONS.find((s) => s.id === active)!;

  const summary = useApiResource(fetchSummary, []);
  const monthly = useApiResource(fetchMonthlyDelayTrends, []);
  const hourly = useApiResource(fetchHourlyDelayTrends, []);
  const causes = useApiResource(fetchDelayCauses, []);

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Analytics</h1>

      {summary.data && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            [
              'Flights analysed',
              summary.data.totalFlights.toLocaleString(),
            ],
            ['Delayed', pct(summary.data.avgDelayRate)],
            ['Routes', summary.data.routeCount.toLocaleString()],
            ['Airports', summary.data.airportCount.toLocaleString()],
            ['Airlines', summary.data.airlineCount.toLocaleString()],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-line bg-surface p-3"
            >
              <div className="text-xs uppercase font-semibold text-ink">
                {k}
              </div>

              <div className="text-xl font-bold text-ink">
                {v}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active === s.id
                ? 'border-amber bg-amber text-bg'
                : 'border-line bg-surface-raised text-ink hover:bg-surface hover:border-amber/50'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold text-ink">
          {section.title}
        </h2>

        {'run' in section && section.run && section.fields && (
          <QueryPanel
            key={section.id}
            fields={section.fields}
            dims={dims}
            run={section.run}
          />
        )}

        {active === 'monthly' && (
          <Load res={monthly}>
            {(d) => (
              <TrendChart
                points={toPoints(d, (r) => r.month)}
              />
            )}
          </Load>
        )}

        {active === 'hourly' && (
          <Load res={hourly}>
            {(d) => (
              <TrendChart
                points={toPoints(d, (r) => r.departure_hour)}
              />
            )}
          </Load>
        )}

        {active === 'causes' && (
          <Load res={causes}>
            {(d) => (
              <div className="space-y-4">
                <div className="h-80">
                  <ResponsiveContainer>
                    <BarChart
                      data={d}
                      layout="vertical"
                      margin={{ left: 40 }}
                    >
                      <CartesianGrid
                        stroke="#24405F"
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        type="number"
                        stroke="#EAF0F6"
                        tick={{ fill: '#EAF0F6' }}
                      />

                      <YAxis
                        type="category"
                        dataKey="delay_cause"
                        width={150}
                        stroke="#EAF0F6"
                        tick={{ fill: '#EAF0F6' }}
                      />

                      <Tooltip contentStyle={TOOLTIP_STYLE} />

                      <Bar
                        dataKey="delay_hours"
                        name="Delay hours"
                        fill="#38BDF8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <RowsView rows={d as unknown as Row[]} />
              </div>
            )}
          </Load>
        )}
      </section>
    </>
  );
}