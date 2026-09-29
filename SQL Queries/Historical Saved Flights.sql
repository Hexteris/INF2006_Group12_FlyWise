-- Save Historical Flight --
INSERT INTO saved_flights (user_id, flight_id)
VALUES (?, ?);

-- Get Historical Saved Flights --
SELECT
    sf.saved_flight_id,
    sf.flight_id,
    sf.saved_at,
    f.flight_date,
    a.airline_code,
    f.flight_number,
    ao.airport_code AS origin,
    ad.airport_code AS destination,
    f.scheduled_departure,
    f.scheduled_arrival,
    f.departure_delay,
    f.arrival_delay,
    f.cancelled,
    f.diverted
FROM saved_flights sf
JOIN flights f
    ON sf.flight_id = f.flight_id
JOIN airlines a
    ON f.airline_id = a.airline_id
JOIN routes r
    ON f.route_id = r.route_id
JOIN airports ao
    ON r.origin_airport_id = ao.airport_id
JOIN airports ad
    ON r.destination_airport_id = ad.airport_id
WHERE sf.user_id = ?
ORDER BY sf.saved_at DESC;

-- Check Historical Saved Flight --
SELECT
    saved_flight_id
FROM saved_flights
WHERE saved_flight_id = ?
  AND user_id = ?;


-- Delete Historical Saved Flight --
DELETE FROM saved_flights
WHERE saved_flight_id = ?
  AND user_id = ?;