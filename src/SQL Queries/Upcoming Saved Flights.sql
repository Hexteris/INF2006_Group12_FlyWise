-- Save upcoming flights --
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

-- Get upcoming saved flights --
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

-- Check upcoming saved flights before deleting --
SELECT upcoming_saved_flight_id
FROM upcoming_saved_flights
WHERE upcoming_saved_flight_id = ?
  AND user_id = ?

-- Delete upcoming saved flight --
DELETE FROM upcoming_saved_flights
WHERE upcoming_saved_flight_id = ?
  AND user_id = ?