import { useId, useState, useCallback, memo, useEffect } from 'react';
import type { DimRow, PredictionRequest } from '../../types';
import DimSelect from './DimSelect';
import { 
  ACCENT_BORDER, 
  BUTTON_PRIMARY, 
  FIELD_CLASSES, 
  FIELD_LABEL, 
  PANEL, 
  PANEL_PADDING, 
  SECTION_HEADING, 
  NOTIFICATION_ERROR, 
  NOTIFICATION_INFO, 
  LOADING_SPINNER, 
  GRID_FORM, 
  FOCUS_VISIBLE 
} from '../styles';

interface PredictionFormProps {
  airports: DimRow[];
  airlines: DimRow[];
  onSubmit: (request: PredictionRequest) => void;
  isLoading?: boolean;
  disabled?: boolean;
  predictionInProgress?: boolean;
}

/** Today in YYYY-MM-DD, in the user's own timezone. */
function today(): string {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  return new Date(now.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Default departure time: 8:00 AM */
const DEFAULT_DEPARTURE_TIME = '08:00';

function PredictionForm({
  airports,
  airlines,
  onSubmit,
  isLoading = false,
  disabled = false,
  predictionInProgress = false,
}: PredictionFormProps) {
  const [originAirportId, setOriginAirportId] = useState<number>();
  const [destAirportId, setDestAirportId] = useState<number>();
  const [airlineId, setAirlineId] = useState<number>();
  const [departureTime, setDepartureTime] = useState(DEFAULT_DEPARTURE_TIME);
  const [flightDate, setFlightDate] = useState(today);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const timeId = useId();
  const dateId = useId();
  const formId = useId();

  const sameAirport = originAirportId !== undefined && originAirportId === destAirportId;
  const isFormValid = originAirportId !== undefined && destAirportId !== undefined && airlineId !== undefined && !sameAirport;
  const isSubmitting = isLoading || predictionInProgress;

  // Clear errors when form becomes valid
  useEffect(() => {
    if (isFormValid && formErrors.length > 0) {
      setFormErrors([]);
    }
  }, [isFormValid, formErrors.length]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitted(true);

    const errors: string[] = [];

    if (originAirportId === undefined) errors.push('Origin airport is required');
    if (destAirportId === undefined) errors.push('Destination airport is required');
    if (airlineId === undefined) errors.push('Airline is required');
    if (sameAirport) errors.push('Origin and destination must be different airports');

    if (errors.length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorElement = document.querySelector('[role="alert"]');
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormErrors([]);
    onSubmit({
      originAirportId: originAirportId!,
      destAirportId: destAirportId!,
      airlineId: airlineId!,
      scheduledDepartureTime: departureTime.replace(':', ''),
      flightDate,
    });
  }, [originAirportId, destAirportId, airlineId, sameAirport, departureTime, flightDate, onSubmit]);

  const handleClearForm = useCallback(() => {
    setOriginAirportId(undefined);
    setDestAirportId(undefined);
    setAirlineId(undefined);
    setDepartureTime(DEFAULT_DEPARTURE_TIME);
    setFlightDate(today);
    setFormErrors([]);
    setIsSubmitted(false);
  }, []);

  const getFieldError = useCallback((field: string) => {
    if (!isSubmitted) return null;
    return formErrors.find(error => error.toLowerCase().includes(field.toLowerCase()));
  }, [formErrors, isSubmitted]);

  return (
    <section 
      className={`${PANEL} ${ACCENT_BORDER.blue} ${PANEL_PADDING} transition-all duration-300 hover:shadow-xl relative`}
      role="form"
      aria-label="Flight delay prediction form"
    >
      {/* Enhanced header with status indicator */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="h-7 w-7 text-amber transition-transform duration-300 hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 6v6l4 2"
              />
            </svg>
            {predictionInProgress && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h2 className={`${SECTION_HEADING} text-xl md:text-2xl flex items-center gap-2`}>
              Flight delay prediction
              {predictionInProgress && (
                <span className="text-xs font-normal bg-amber/20 text-amber px-2 py-1 rounded-full animate-pulse">
                  Predicting...
                </span>
              )}
            </h2>
            <p className="text-sm text-ink-dim mt-1">
              Predict flight delays based on historical data and conditions
            </p>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearForm}
            className="text-sm text-ink-dim hover:text-ink transition-colors duration-200 px-3 py-2 rounded-lg border border-line hover:border-ink-dim/40"
            disabled={isSubmitting || disabled}
            aria-label="Clear form"
          >
            Clear form
          </button>
        </div>
      </div>

      <form 
        id={formId} 
        onSubmit={handleSubmit} 
        className="space-y-6"
        noValidate
        aria-busy={isSubmitting}
      >
        {/* Form fields grid */}
        <div className={GRID_FORM}>
          <DimSelect
            label="Origin airport"
            placeholder="Select origin"
            options={airports}
            value={originAirportId}
            onChange={setOriginAirportId}
            required
            disabled={disabled || isSubmitting}
            isLoading={isLoading}
            description="Select the departure airport"
            aria-invalid={!!getFieldError('origin')}
          />

          <DimSelect
            label="Destination airport"
            placeholder="Select destination"
            options={airports}
            value={destAirportId}
            onChange={setDestAirportId}
            required
            disabled={disabled || isSubmitting}
            isLoading={isLoading}
            description="Select the arrival airport"
            aria-invalid={!!getFieldError('destination')}
          />

          <DimSelect
            label="Airline"
            placeholder="Select airline"
            options={airlines}
            value={airlineId}
            onChange={setAirlineId}
            required
            disabled={disabled || isSubmitting}
            isLoading={isLoading}
            description="Select the airline operating the flight"
            aria-invalid={!!getFieldError('airline')}
          />

          <div>
            <label htmlFor={timeId} className={FIELD_LABEL}>
              Scheduled departure time
            </label>
            <div className="relative">
              <input
                id={timeId}
                type="time"
                required
                disabled={disabled || isSubmitting}
                value={departureTime}
                onChange={event => setDepartureTime(event.target.value)}
                className={`${FIELD_CLASSES} pl-10`}
                aria-describedby={`${timeId}-description`}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-dim"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p id={`${timeId}-description`} className="text-xs text-ink-dim mt-1.5">
              24-hour format. Most delays occur during peak hours (7-9 AM, 4-7 PM)
            </p>
          </div>

          <div>
            <label htmlFor={dateId} className={FIELD_LABEL}>
              Flight date
            </label>
            <div className="relative">
              <input
                id={dateId}
                type="date"
                required
                disabled={disabled || isSubmitting}
                value={flightDate}
                onChange={event => setFlightDate(event.target.value)}
                className={`${FIELD_CLASSES} pl-10`}
                min={today()}
                aria-describedby={`${dateId}-description`}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-dim"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p id={`${dateId}-description`} className="text-xs text-ink-dim mt-1.5">
              Select a future date for prediction
            </p>
          </div>
        </div>

        {/* Form status and errors */}
        <div className="space-y-4">
          {/* Same airport error */}
          {sameAirport && (
            <div role="alert" className={NOTIFICATION_ERROR}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Origin and destination must be different airports.</span>
              </div>
            </div>
          )}

          {/* Form validation errors */}
          {formErrors.length > 0 && (
            <div role="alert" className={NOTIFICATION_ERROR}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Form validation success */}
          {isFormValid && !isSubmitting && (
            <div className={NOTIFICATION_INFO}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>All fields are valid. Ready to predict!</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit button with enhanced loading state */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting || disabled}
          className={`${BUTTON_PRIMARY} relative overflow-hidden group ${FOCUS_VISIBLE}`}
          aria-label={isSubmitting ? "Predicting flight delay..." : "Get delay prediction"}
        >
          {/* Animated background effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-amber/20 to-good/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {/* Button content */}
          <span className="relative flex items-center justify-center gap-3">
            {isSubmitting ? (
              <>
                <div className={LOADING_SPINNER} aria-hidden="true" />
                <span className="animate-pulse">Predicting flight delay...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Get delay prediction</span>
              </>
            )}
          </span>

          {/* Disabled state indicator */}
          {!isFormValid && !isSubmitting && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-ink-dim rounded-full flex items-center justify-center">
              <span className="text-xs text-bg">!</span>
            </span>
          )}
        </button>
      </form>

      {/* Loading overlay */}
      {(isSubmitting || isLoading) && (
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <div className={LOADING_SPINNER + " w-12 h-12 border-4 mx-auto"} />
            <div>
              <p className="text-xl font-semibold text-ink mb-2">Analyzing flight data...</p>
              <p className="text-ink-dim max-w-md">
                Processing historical patterns, weather conditions, and airline performance
              </p>
            </div>
            <div className="w-64 h-2 bg-surface-raised rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-amber to-good animate-pulse rounded-full w-3/4" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(PredictionForm, (prevProps, nextProps) => {
  return (
    prevProps.airports === nextProps.airports &&
    prevProps.airlines === nextProps.airlines &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.predictionInProgress === nextProps.predictionInProgress
  );
});
