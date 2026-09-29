import { clock, type TripFlight } from '../trip';

const STATUS: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-700',
  active: 'bg-emerald-100 text-emerald-700',
  landed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  delayed: 'bg-amber-100 text-amber-700',
};

interface Props {
  flights: TripFlight[];
  savedKeys: Set<string>;
  selected: string[];
  onToggleSelect: (f: TripFlight) => void;
  onToggleSave: (f: TripFlight) => void;
}

export default function FlightTable({
  flights,
  savedKeys,
  selected,
  onToggleSelect,
  onToggleSave,
}: Props) {
  if (!flights.length)
    return (
      <p className="rounded-xl border border-line bg-surface p-6 text-center text-ink-dim">
        No flights to show. Pick an airport and press “Load flights”.
      </p>
    );

  const th = 'px-3 py-2';

  return (
    <div className="max-h-[520px] overflow-auto rounded-xl border border-line bg-white">
      <table className="w-full text-left text-sm text-slate-900">
        <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-700">
          <tr>
            <th className={th}>Compare</th>
            <th className={th}>Flight</th>
            <th className={th}>Airline</th>
            <th className={th}>Route</th>
            <th className={th}>Date</th>
            <th className={th}>Departs</th>
            <th className={th}>Arrives</th>
            <th className={th}>Status</th>
            <th className={th}>Delay</th>
            <th className={th}>Save</th>
          </tr>
        </thead>

        <tbody>
          {flights.map((f) => (
            <tr
              key={f.key}
              className="border-t border-slate-200 hover:bg-slate-50"
            >
              <td className={th}>
                <input
                  type="checkbox"
                  checked={selected.includes(f.key)}
                  onChange={() => onToggleSelect(f)}
                  className="cursor-pointer accent-sky-500"
                />
              </td>

              <td className={`${th} font-semibold text-slate-900`}>
                {f.number}
              </td>

              <td className={th}>
                {f.airline ?? f.airlineCode}
              </td>

              <td className={th}>
                {f.origin ?? '?'} → {f.destination ?? '?'}
              </td>

              <td className={th}>
                {f.date || '–'}
              </td>

              <td className={th}>
                {clock(f.scheduledDeparture)}
              </td>

              <td className={th}>
                {clock(f.scheduledArrival)}
              </td>

              <td className={th}>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                    STATUS[f.status ?? ''] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {f.status ?? '–'}
                </span>
              </td>

              <td
                className={`${th} ${
                  (f.delay ?? 0) > 15
                    ? 'font-semibold text-bad'
                    : 'text-slate-900'
                }`}
              >
                {f.delay != null ? `${f.delay} min` : '–'}
              </td>

              <td className={th}>
                <button
                  onClick={() => onToggleSave(f)}
                  title="Save flight"
                  className="text-lg text-amber transition-colors hover:text-amber/70"
                >
                  {savedKeys.has(f.key) ? '★' : '☆'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}