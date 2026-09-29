import { useState } from 'react';
import type { HistoryRow } from '../../types';
import {
  fetchAirlineAnalytics,
  fetchAirlineRouteAnalytics,
  fetchHistory,
  fetchRouteAnalytics,
} from '../services/api';
import { clock, type Dims } from '../trip';
import DimSelect from './DimSelect';
import RowsView, { type Row } from './RowsView';

export default function HistoricalSearch({
  dims,
}: {
  dims: Dims | null;
}) {
  const [airline, setAirline] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [stats, setStats] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    setLoading(true);
    setError('');

    // Summary stats only when the combination matches an existing analytics endpoint.
    const route = origin && destination;

    const statsCall: Promise<Row[]> =
      airline && route
        ? fetchAirlineRouteAnalytics(
            airline,
            origin,
            destination
          )
        : route && !airline
          ? fetchRouteAnalytics(origin, destination)
          : airline && !origin && !destination
            ? fetchAirlineAnalytics(airline)
            : Promise.resolve([]);

    try {
      const [history, summary] = await Promise.all([
        fetchHistory({
          airline,
          origin,
          destination,
          limit: 200,
        }),
        statsCall.catch(() => [] as Row[]),
      ]);

      setRows(history);
      setStats(summary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const th =
    'px-3 py-2';

  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
      {/* Section heading */}
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Historical Flight Search
        </h2>

        <p className="text-sm text-ink-dim">
          Browse past flights for an airline, a route, or both
          (latest 200).
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <DimSelect
          label="Airline"
          value={airline}
          options={dims?.airlines ?? []}
          onChange={setAirline}
        />

        <DimSelect
          label="Origin"
          value={origin}
          options={dims?.airports ?? []}
          onChange={setOrigin}
        />

        <DimSelect
          label="Destination"
          value={destination}
          options={dims?.airports ?? []}
          onChange={setDestination}
        />

        <button
          onClick={search}
          disabled={
            loading ||
            (!airline && !origin && !destination)
          }
          className="rounded-md bg-amber px-4 py-2 font-semibold text-bg transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search history'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-bad">
          {error}
        </p>
      )}

      {/* Summary */}
      {stats.length > 0 && (
        <RowsView rows={stats} />
      )}

      {/* Results */}
      {rows &&
        (rows.length === 0 ? (
          <p className="text-sm text-ink-dim">
            No past flights found.
          </p>
        ) : (
          <div className="max-h-[480px] overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-raised text-xs uppercase text-ink">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Flight</th>
                  <th className={th}>Route</th>
                  <th className={th}>Sched. dep</th>
                  <th className={th}>Dep delay</th>
                  <th className={th}>Arr delay</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.flight_id}
                    className="border-t border-line text-ink hover:bg-surface-raised"
                  >
                    <td className={th}>
                      {String(r.flight_date).slice(0, 10)}
                    </td>

                    <td className={`${th} font-semibold`}>
                      {r.airline_code}
                      {r.flight_number ?? ''}
                    </td>

                    <td className={th}>
                      {r.origin} → {r.destination}
                    </td>

                    <td className={th}>
                      {clock(r.scheduled_departure)}
                    </td>

                    <td
                      className={`${th} ${
                        (r.departure_delay ?? 0) > 15
                          ? 'text-bad font-semibold'
                          : 'text-ink'
                      }`}
                    >
                      {r.departure_delay ?? '–'}
                    </td>

                    <td
                      className={`${th} ${
                        (r.arrival_delay ?? 0) > 15
                          ? 'text-bad font-semibold'
                          : 'text-ink'
                      }`}
                    >
                      {r.arrival_delay ?? '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}