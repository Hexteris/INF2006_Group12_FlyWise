import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  Annotation,
} from 'react-simple-maps';

import { AIRPORTS, STATE_LABELS } from '../airports';
import type { TripFlight } from '../trip';

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface Props {
  flights: TripFlight[];
  selectedFlights: TripFlight[];
  selectedAirport: string;
  onSelectAirport: (code: string) => void;
}

export default function UsMap({
  flights,
  selectedFlights,
  selectedAirport,
  onSelectAirport,
}: Props) {
  const pairs = Array.from(
    new Set(
      flights
        .filter(
          (f) =>
            f.origin &&
            f.destination &&
            AIRPORTS[f.origin] &&
            AIRPORTS[f.destination]
        )
        .map((f) => `${f.origin}-${f.destination}`)
    )
  );

  const selectedPairs = new Set(
    selectedFlights
      .filter(
        (f) =>
          f.origin &&
          f.destination &&
          AIRPORTS[f.origin] &&
          AIRPORTS[f.destination]
      )
      .map((f) => `${f.origin}-${f.destination}`)
  );

  const active = new Set(
    pairs.flatMap((p) => p.split('-'))
  );

  if (selectedAirport) {
    active.add(selectedAirport);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-input p-2">
      <ComposableMap
        projection="geoAlbersUsa"
        style={{
          width: '100%',
          height: 'auto',
        }}
      >
        {/* US states */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((g) => (
              <Geography
                key={g.rsmKey}
                geography={g}
                fill="#e0f2fe"
                stroke="#ffffff"
                strokeWidth={0.6}
                style={{
                  default: {
                    outline: 'none',
                  },
                  hover: {
                    fill: '#bae6fd',
                    outline: 'none',
                  },
                  pressed: {
                    outline: 'none',
                  },
                }}
              />
            ))
          }
        </Geographies>

        {/* State abbreviations */}
        {Object.entries(STATE_LABELS).map(([state, coordinates]) => (
          <Annotation
            key={state}
            subject={coordinates}
            dx={0}
            dy={0}
            connectorProps={{
              stroke: 'none',
            }}
          >
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 7,
                fontWeight: 600,
                fill: '#0f172a',
                pointerEvents: 'none',
              }}
            >
              {state}
            </text>
          </Annotation>
        ))}

        {/* Flight routes */}
        {pairs.map((p) => {
          const [origin, destination] = p.split('-')
          const isSelected = selectedPairs.has(p);

          return (
            <Line
              key={p}
              from={AIRPORTS[origin]}
              to={AIRPORTS[destination]}
              stroke={isSelected ? '#FFB020' : '#0284c7'}
              strokeWidth={isSelected ? 2.5 : 1.2} 
              strokeOpacity={isSelected ? 1 : 0.25}
              strokeLinecap="round"
            />
          );
        })}

        {/* Airports */}
        {Object.entries(AIRPORTS).map(([code, coords]) => {
          const isActive = active.has(code);
          const isSelected = code === selectedAirport;

          return (
            <Marker
              key={code}
              coordinates={coords}
              onClick={() => onSelectAirport(code)}
              style={{
                default: {
                  cursor: 'pointer',
                },
              }}
            >
              <circle
                r={isSelected ? 6 : isActive ? 4 : 3}
                fill={
                  isSelected
                    ? '#dc2626'
                    : isActive
                      ? '#0369a1'
                      : '#94a3b8'
                }
              />

              {/* Airport code */}
              {isActive && (
                <text
                  y={-9}
                  textAnchor="middle"
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    fill: '#0f172a',
                  }}
                >
                  {code}
                </text>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      <p className="px-2 pb-1 text-xs text-ink-dim/90">
        Click an airport to select it.{' '}
        {pairs.length
          ? `${pairs.length} route(s) shown.`
          : 'Load flights to see routes.'}
      </p>
    </div>
  );
}