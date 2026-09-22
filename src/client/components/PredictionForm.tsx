import { useId, useState } from 'react';
import type { DimRow, PredictionRequest } from '../../types';
import DimSelect from './DimSelect';
import { ACCENT_BORDER, BUTTON_PRIMARY, FIELD_CLASSES, FIELD_LABEL, PANEL, PANEL_PADDING, SECTION_HEADING } from '../styles';

interface PredictionFormProps {
  airports: DimRow[];
  airlines: DimRow[];
  onSubmit: (request: PredictionRequest) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/** Today in YYYY-MM-DD, in the user's own timezone. */
function today(): string {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  return new Date(now.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export default function PredictionForm({
  airports,
  airlines,
  onSubmit,
  isLoading = false,
  disabled = false,
}: PredictionFormProps) {
  const [originAirportId, setOriginAirportId] = useState<number>();
  const [destAirportId, setDestAirportId] = useState<number>();
  const [airlineId, setAirlineId] = useState<number>();
  // Held as "HH:MM" to match <input type="time">, converted to the API's HHMM
  // on submit. The previous free-text HHMM field accepted values like "9999".
  const [departureTime, setDepartureTime] = useState('08:00');
  const [flightDate, setFlightDate] = useState(today);

  const timeId = useId();
  const dateId = useId();

  const sameAirport =
    originAirportId !== undefined && originAirportId === destAirportId;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Native `required` on the selects blocks an empty submit; this guard is
    // what proves the ids are defined to TypeScript.
    if (originAirportId === undefined || destAirportId === undefined || airlineId === undefined) {
      return;
    }
    if (sameAirport) return;

    onSubmit({
      originAirportId,
      destAirportId,
      airlineId,
      scheduledDepartureTime: departureTime.replace(':', ''),
      flightDate,
    });
  };

  return (
    <section className={`${PANEL} ${ACCENT_BORDER.blue} ${PANEL_PADDING}`}>
      <div className="mb-6 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-amber"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 6v6l4 2"
          />
        </svg>
        <h2 className={`${SECTION_HEADING} text-xl`}>Flight delay prediction</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DimSelect
            label="Origin airport"
            placeholder="Select origin"
            options={airports}
            value={originAirportId}
            onChange={setOriginAirportId}
            required
            disabled={disabled}
          />
          <DimSelect
            label="Destination airport"
            placeholder="Select destination"
            options={airports}
            value={destAirportId}
            onChange={setDestAirportId}
            required
            disabled={disabled}
          />
          <DimSelect
            label="Airline"
            placeholder="Select airline"
            options={airlines}
            value={airlineId}
            onChange={setAirlineId}
            required
            disabled={disabled}
          />

          <div>
            <label htmlFor={timeId} className={FIELD_LABEL}>
              Scheduled departure
            </label>
            <input
              id={timeId}
              type="time"
              required
              disabled={disabled}
              value={departureTime}
              onChange={event => setDepartureTime(event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>

          <div>
            <label htmlFor={dateId} className={FIELD_LABEL}>
              Flight date
            </label>
            <input
              id={dateId}
              type="date"
              required
              disabled={disabled}
              value={flightDate}
              onChange={event => setFlightDate(event.target.value)}
              className={FIELD_CLASSES}
            />
          </div>
        </div>

        {sameAirport && (
          <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
            Origin and destination must be different airports.
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || disabled || sameAirport}
          className={`mt-8 w-full ${BUTTON_PRIMARY}`}
        >
          {isLoading ? 'Predicting…' : 'Get delay prediction'}
        </button>
      </form>
    </section>
  );
}
