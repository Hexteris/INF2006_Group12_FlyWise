-- Flight Search --

SELECT
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
FROM flights f
JOIN airlines a
    ON f.airline_id = a.airline_id
JOIN routes r
    ON f.route_id = r.route_id
JOIN airports ao
    ON r.origin_airport_id = ao.airport_id
JOIN airports ad
    ON r.destination_airport_id = ad.airport_id
WHERE f.flight_date = ?
  AND ao.airport_code = ?
  AND ad.airport_code = ?
ORDER BY f.scheduled_departure;


-- Historical flight details --

SELECT
    f.flight_date,
    a.airline_code,
    f.flight_number,

    ao.airport_code AS origin,
    ad.airport_code AS destination,

    f.scheduled_departure,
    f.actual_departure,
    f.departure_delay,

    f.scheduled_arrival,
    f.actual_arrival,
    f.arrival_delay,

    f.cancelled,
    f.diverted,

    f.scheduled_elapsed_time,
    f.actual_elapsed_time,
    f.air_time,
    f.distance

FROM flights f
JOIN airlines a
    ON f.airline_id = a.airline_id
JOIN routes r
    ON f.route_id = r.route_id
JOIN airports ao
    ON r.origin_airport_id = ao.airport_id
JOIN airports ad
    ON r.destination_airport_id = ad.airport_id

WHERE f.flight_id = ?;