-- DROPDOWNS FOR AIRPORTS, AIRLINES & AIRPORT ROUTES --

-- Airlines --
 SELECT
    airline_id,
    airline_code
FROM airlines
ORDER BY airline_code;

-- Airports --
SELECT
    airport_id,
    airport_code,
    city_name,
    state
FROM airports
ORDER BY airport_code;

-- Routes --
SELECT
    r.route_id,
    ao.airport_code AS origin,
    ad.airport_code AS destination
FROM routes r
JOIN airports ao
    ON r.origin_airport_id = ao.airport_id
JOIN airports ad
    ON r.destination_airport_id = ad.airport_id
WHERE ao.airport_code = ?
ORDER BY ad.airport_code;
