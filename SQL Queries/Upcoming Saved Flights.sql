-- Save Upcoming Flight --
INSERT INTO upcoming_saved_flights (
    user_id,
    flight_number,
    airline_code,
    origin,
    destination,
    flight_date,
    scheduled_departure,
    scheduled_arrival,
    flight_status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

-- Get Upcoming Saved Flights --
SELECT
    upcoming_saved_flight_id,
    flight_number,
    airline_code,
    origin,
    destination,
    flight_date,
    scheduled_departure,
    scheduled_arrival,
    flight_status,
    saved_at
FROM upcoming_saved_flights
WHERE user_id = ?
ORDER BY flight_date ASC, scheduled_departure ASC

-- Check Upcoming Saved Flight --
SELECT upcoming_saved_flight_id
FROM upcoming_saved_flights
WHERE upcoming_saved_flight_id = ?
  AND user_id = ?

-- Delete Upcoming Saved Flight --
DELETE FROM upcoming_saved_flights
WHERE upcoming_saved_flight_id = ?
  AND user_id = ?