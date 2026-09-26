import { useState } from 'react';
import type { FlightSearchRow, DimRow } from '../../types';
import { fetchAirports, searchFlights } from '../services/api';
import { useApiResource } from '../hooks/useApiResource';
import DataTable, { type Column } from './DataTable';
import ErrorBanner from './ErrorBanner';
import { BUTTON_PRIMARY, FIELD_CLASSES, FIELD_LABEL } from '../styles';
import { count } from '../format';

const EMPTY_AIRPORTS: DimRow[] = [];
const EMPTY_FLIGHTS: FlightSearchRow[] = [];

function today(): string {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  return new Date(now.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

const columns: Column<FlightSearchRow>[] = [
  { label: 'Flight', render: row => `${row.airline_code} ${row.flight_number ?? '—'}` },
  { label: 'Route', render: row => `${row.origin} → ${row.destination}` },
  { label: 'Scheduled', render: row => row.scheduled_departure ?? '—' },
  { label: 'Departure delay', render: row => row.departure_delay == null ? '—' : `${row.departure_delay} min`, numeric: true },
  { label: 'Arrival delay', render: row => row.arrival_delay == null ? '—' : `${row.arrival_delay} min`, numeric: true },
  { label: 'Status', render: row => row.cancelled ? 'Cancelled' : row.diverted ? 'Diverted' : 'Operated' },
];

export default function FlightSearchPage() {
  const airports = useApiResource(fetchAirports, EMPTY_AIRPORTS, [], 'airports');
  const [flightDate, setFlightDate] = useState(today);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [rows, setRows] = useState<FlightSearchRow[]>(EMPTY_FLIGHTS);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!origin || !destination || origin === destination) return;

    setLoading(true);
    setError(null);
    try {
      setRows(await searchFlights({ flight_date: flightDate, origin, destination }));
      setSearched(true);
    } catch (cause) {
      setRows(EMPTY_FLIGHTS);
      setError(cause instanceof Error ? cause.message : 'Flight search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber">Operations</p>
        <h2 className="text-3xl font-bold tracking-tight text-ink">Find a flight</h2>
        <p className="mt-2 text-ink-dim">Search the historical schedule and inspect delay outcomes for a route.</p>
      </div>

      <ErrorBanner errors={[airports.error, error]} />

      <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-6 shadow-md md:grid-cols-4 md:items-end">
        <div>
          <label htmlFor="flight-date" className={FIELD_LABEL}>Flight date</label>
          <input id="flight-date" type="date" value={flightDate} onChange={event => setFlightDate(event.target.value)} className={FIELD_CLASSES} required />
        </div>
        <div>
          <label htmlFor="flight-origin" className={FIELD_LABEL}>Origin</label>
          <select id="flight-origin" value={origin} onChange={event => setOrigin(event.target.value)} className={FIELD_CLASSES} disabled={airports.loading} required>
            <option value="">Select airport</option>
            {airports.data.map(airport => <option key={airport.id} value={airport.code}>{airport.code}{airport.cityName ? ` — ${airport.cityName}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="flight-destination" className={FIELD_LABEL}>Destination</label>
          <select id="flight-destination" value={destination} onChange={event => setDestination(event.target.value)} className={FIELD_CLASSES} disabled={airports.loading} required>
            <option value="">Select airport</option>
            {airports.data.map(airport => <option key={airport.id} value={airport.code}>{airport.code}{airport.cityName ? ` — ${airport.cityName}` : ''}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading || airports.loading || origin === destination} className={BUTTON_PRIMARY}>
          {loading ? 'Searching…' : 'Search flights'}
        </button>
      </form>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-xl font-semibold text-ink">Search results</h3>
          <p className="mt-1 text-sm text-ink-dim">{searched ? `${count(rows.length)} flights found` : 'Choose a date and route to begin.'}</p>
        </div>
      </div>
      <div className="h-[560px]">
        <DataTable
          title="Historical flight schedule"
          columns={columns}
          rows={rows}
          rowKey={row => `${row.flight_date}-${row.airline_code}-${row.flight_number}-${row.scheduled_departure}`}
          emptyMessage={searched ? 'No flights match this route and date' : 'No search submitted'}
        />
      </div>
    </main>
  );
}
