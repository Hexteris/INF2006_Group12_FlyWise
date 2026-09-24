import { useState } from 'react';
import type { Column } from './DataTable';
import DataTable from './DataTable';
import ErrorBanner from './ErrorBanner';
import { useApiResource } from '../hooks/useApiResource';
import { fetchAirports, fetchLiveFlights } from '../services/api';
import type { DimRow, LiveFlightRow } from '../../types';
import { BUTTON_PRIMARY, FIELD_CLASSES, FIELD_LABEL } from '../styles';

const EMPTY_AIRPORTS: DimRow[] = [];
const EMPTY_FLIGHTS: LiveFlightRow[] = [];

type Direction = 'Departure' | 'Arrival';

function displayTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const columns: Column<LiveFlightRow>[] = [
  { label: 'Flight', render: row => `${row.airlineCode ?? ''} ${row.number ?? '—'}`.trim() },
  { label: 'Status', render: row => row.status ?? 'Unknown' },
  { label: 'Airport', render: row => row.airport ?? '—' },
  { label: 'Scheduled', render: row => displayTime(row.scheduledTime) },
  { label: 'Updated', render: row => displayTime(row.revisedTime) },
  { label: 'Terminal / gate', render: row => [row.terminal, row.gate].filter(Boolean).join(' / ') || '—' },
  { label: 'Aircraft', render: row => row.aircraft ?? '—' },
];

export default function LiveFlightsPage() {
  const airports = useApiResource(fetchAirports, EMPTY_AIRPORTS, [], 'airports');
  const [airport, setAirport] = useState('');
  const [direction, setDirection] = useState<Direction>('Departure');
  const [rows, setRows] = useState<LiveFlightRow[]>(EMPTY_FLIGHTS);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadFlights = async () => {
    if (!airport) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchLiveFlights(airport, direction));
      setSearched(true);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (cause) {
      setRows(EMPTY_FLIGHTS);
      setError(cause instanceof Error ? cause.message : 'Live flight request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber">Live operations</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Live flights</h2>
            <p className="mt-2 text-ink-dim">Current and upcoming airport movements from Aviationstack.</p>
          </div>
          <span className="rounded-full border border-good/30 bg-good/10 px-3 py-1 text-xs font-semibold text-good">Live feed</span>
        </div>
      </div>

      <ErrorBanner errors={[airports.error, error]} />

      <form
        onSubmit={event => { event.preventDefault(); void loadFlights(); }}
        className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-6 shadow-md md:grid-cols-[1fr_180px_auto] md:items-end"
      >
        <div>
          <label htmlFor="live-airport" className={FIELD_LABEL}>Airport</label>
          <select id="live-airport" value={airport} onChange={event => setAirport(event.target.value)} className={FIELD_CLASSES} disabled={airports.loading} required>
            <option value="">Select airport</option>
            {airports.data.map(item => <option key={item.id} value={item.code}>{item.code}{item.cityName ? ` — ${item.cityName}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="live-direction" className={FIELD_LABEL}>Movement</label>
          <select id="live-direction" value={direction} onChange={event => setDirection(event.target.value as Direction)} className={FIELD_CLASSES}>
            <option value="Departure">Departures</option>
            <option value="Arrival">Arrivals</option>
          </select>
        </div>
        <button type="submit" disabled={loading || airports.loading} className={BUTTON_PRIMARY}>
          {loading ? 'Refreshing…' : 'Load live flights'}
        </button>
      </form>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-xl font-semibold text-ink">Airport movements</h3>
          <p className="mt-1 text-sm text-ink-dim">{searched ? `${rows.length} movements returned${lastRefreshed ? ` · updated ${lastRefreshed}` : ''}` : 'Choose an airport to load the live feed.'}</p>
        </div>
      </div>
      <div className="h-[560px]">
        <DataTable title="Live flight board" columns={columns} rows={rows} rowKey={row => `${row.number}-${row.scheduledTime}-${row.airport}`} emptyMessage={searched ? 'No live flights were returned for this airport' : 'No live feed loaded'} />
      </div>
    </main>
  );
}
