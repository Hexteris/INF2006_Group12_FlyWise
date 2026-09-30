-- Summary --
SELECT COUNT(*) AS totalFlights,
       COALESCE(SUM(departure_del15), 0) AS totalDelayed,
       COALESCE(AVG(departure_del15), 0) AS avgDelayRate,
       COUNT(DISTINCT f.route_id) AS routeCount,
       COUNT(DISTINCT r.origin_airport_id) AS airportCount,
       COUNT(DISTINCT airline_id) AS airlineCount
FROM flights f
JOIN routes r ON r.route_id = f.route_id

-- Airline Performance --
SELECT
    a.airline_code AS airlineCode,
    ao.airport_code AS originCode,
    ao.city_name AS originCity,
    ad.airport_code AS destCode,
    COUNT(*) AS flightCount,
    COALESCE(SUM(f.departure_del15), 0) AS delayedCount,
    COALESCE(AVG(f.departure_del15), 0) AS delayRate
FROM flights f
JOIN airlines a
    ON a.airline_id = f.airline_id
JOIN routes r
    ON r.route_id = f.route_id
JOIN airports ao
    ON ao.airport_id = r.origin_airport_id
JOIN airports ad
    ON ad.airport_id = r.destination_airport_id
{filters}
GROUP BY
    a.airline_code,
    ao.airport_code,
    ao.city_name,
    ad.airport_code
ORDER BY flightCount DESC
LIMIT {limit}

-- Airport Congestion --
SELECT
    ao.airport_code AS airportCode,
    ao.city_name AS airportCity,
    HOUR(f.scheduled_departure) AS depHour,
    COUNT(*) AS flightCount,
    COALESCE(SUM(f.departure_del15), 0) AS delayedCount,
    COALESCE(AVG(f.departure_del15), 0) AS delayRate
FROM flights f
JOIN routes r
    ON r.route_id = f.route_id
JOIN airports ao
    ON ao.airport_id = r.origin_airport_id
{filters}
GROUP BY
    ao.airport_code,
    ao.city_name,
    HOUR(f.scheduled_departure)
ORDER BY flightCount DESC
LIMIT {limit}