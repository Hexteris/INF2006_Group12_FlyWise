import { useMemo, useState } from 'react';
import { fetchLiveFlights } from '../services/api';
import {
  applyFilters,
  fromLive,
  type Dims,
  type LiveFilters,
  type TripFlight,
} from '../trip';
import UsMap from './USMap';
import FilterPanel from './FilterPanel';
import FlightTable from './FlightTable';
import FlightCompare from './FlightCompare';

interface Props {
  dims: Dims | null;
  flights: TripFlight[];
  onResults: (f: TripFlight[]) => void;
  saved: TripFlight[];
  onToggleSave: (f: TripFlight) => void;
}

export default function LiveFlightsPage({
  dims,
  flights,
  onResults,
  saved,
  onToggleSave,
}: Props) {
  const [filters, setFilters] = useState<LiveFilters>({
    airport: '',
    direction: 'Departure',
    flightNumber: '',
    airline: '',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const visible = useMemo(() => applyFilters(flights, filters), [flights, filters]);
  const savedKeys = useMemo(() => new Set(saved.map((s) => s.key)), [saved]);
  const compared = useMemo(
    () => flights.filter((f) => selected.includes(f.key)),
    [flights, selected]
  );

  const load = async () => {
    if (!filters.airport) {
      setError('Choose an airport (or click one on the map) first.');
      return;
    }
    setLoading(true);
    setError('');
    setSelected([]);
    try {
      const rows = await fetchLiveFlights(filters.airport, filters.direction);
      const mapped = rows.map(fromLive);

      mapped.sort((a, b) => {
        const dateA = `${a.date ?? ''} ${a.scheduledDeparture ?? ''}`;
        const dateB = `${b.date ?? ''} ${b.scheduledDeparture ?? ''}`;

        return dateA.localeCompare(dateB);
      });
      onResults(rows.map(fromLive));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (f: TripFlight) =>
    setSelected((s) =>
      s.includes(f.key)
        ? s.filter((k) => k !== f.key)
        : s.length < 4
          ? [...s, f.key]
          : s
    );

  return (
    <>
      <section>
        <h1 className="text-2xl font-bold">US Domestic Flights</h1>
        <p className="text-ink-dim/80">
          Search upcoming flights by airport, then compare delay risk before you decide.
        </p>
      </section>

      <UsMap
        flights={visible}
        selectedFlights={compared}
        selectedAirport={filters.airport}
        onSelectAirport={(code) => setFilters((f) => ({ ...f, airport: code }))}
      />

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        dims={dims}
        loading={loading}
        onLoad={load}
      />

      {error && <div className="rounded-md border border-bad/30 bg-bad/10 p-3 text-sm text-bad">{error}</div>}

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold text-ink">
          Flights ({visible.length}
          {visible.length !== flights.length
            ? ` of ${flights.length}`
            : ''}
          )
        </h2>

        <FlightTable
          flights={visible}
          savedKeys={savedKeys}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSave={onToggleSave}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold text-ink">
          Compare delay risk
        </h2>

        <FlightCompare
          flights={compared}
          dims={dims}
        />
      </section>
    </>
  );
}