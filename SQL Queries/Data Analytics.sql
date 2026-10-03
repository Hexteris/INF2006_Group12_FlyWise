-- Airline Dashboard --

SELECT
    a.airline_code,

    COUNT(*) AS total_flights,

    SUM(
        CASE
            WHEN f.arrival_delay > 15 THEN 1
            ELSE 0
        END
    ) AS delayed_flights,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.arrival_delay > 15 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS delay_rate,

    ROUND(
        AVG(
            CASE
                WHEN f.arrival_delay IS NOT NULL
                THEN f.arrival_delay
            END
        ),
        2
    ) AS avg_arrival_delay,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.arrival_delay > 60 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS severe_delay_rate,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.cancelled = 1 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS cancellation_rate

FROM flights f
JOIN airlines a
    ON f.airline_id = a.airline_id

WHERE a.airline_code = ?

GROUP BY a.airline_code;


-- Flight route reliability --

SELECT
    ao.airport_code AS origin,
    ad.airport_code AS destination,

    COUNT(*) AS total_flights,

    ROUND(AVG(f.arrival_delay), 2)
        AS avg_arrival_delay,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.arrival_delay > 15 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS delay_rate,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.arrival_delay > 60 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS severe_delay_rate,

    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.cancelled = 1 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS cancellation_rate

FROM flights f

JOIN routes r
    ON f.route_id = r.route_id

JOIN airports ao
    ON r.origin_airport_id = ao.airport_id

JOIN airports ad
    ON r.destination_airport_id = ad.airport_id

WHERE ao.airport_code = ?
  AND ad.airport_code = ?

GROUP BY
    ao.airport_code,
    ad.airport_code;


-- Airport Analytics --
SELECT
	? AS airport,

	d.total_departures,
	d.avg_departure_delay,
	d.departure_delay_rate,

	ar.total_arrivals,
	ar.avg_arrival_delay,
	ar.arrival_delay_rate,

	c.cancellation_rate

	FROM 
    (
		SELECT
			COUNT(*) AS total_departures,
			ROUND(AVG(f.departure_delay), 2)
				AS avg_departure_delay,
			ROUND(
				100.0 * SUM(
					CASE
						WHEN f.departure_delay > 15 THEN 1
						ELSE 0
					END
				) / COUNT(*),
				2
			) AS departure_delay_rate
		FROM flights f
		JOIN routes r
			ON f.route_id = r.route_id
		JOIN airports ao
			ON r.origin_airport_id = ao.airport_id
		WHERE ao.airport_code = ?
	) d

	CROSS JOIN
	(
		SELECT
			COUNT(*) AS total_arrivals,
			ROUND(AVG(f.arrival_delay), 2)
				AS avg_arrival_delay,
			ROUND(
				100.0 * SUM(
					CASE
						WHEN f.arrival_delay > 15 THEN 1
						ELSE 0
					END
				) / COUNT(*),
				2
			) AS arrival_delay_rate
		FROM flights f
		JOIN routes r
			ON f.route_id = r.route_id
		JOIN airports ad
			ON r.destination_airport_id = ad.airport_id
		WHERE ad.airport_code = ?
	) ar

	CROSS JOIN
	(
		SELECT
			ROUND(
				100.0 * SUM(cancelled) / COUNT(*),
				2
			) AS cancellation_rate
		FROM
		(
			SELECT
				f.flight_id,
				f.cancelled
			FROM flights f
			JOIN routes r
				ON f.route_id = r.route_id
			JOIN airports ao
				ON r.origin_airport_id = ao.airport_id
			WHERE ao.airport_code = ?

			UNION

			SELECT
				f.flight_id,
				f.cancelled
			FROM flights f
			JOIN routes r
				ON f.route_id = r.route_id
			JOIN airports ad
				ON r.destination_airport_id = ad.airport_id
			WHERE ad.airport_code = ?
		) airport_flights
	) c;
    

-- Delay trend by month --
SELECT 
    DATE_FORMAT(f.flight_date, '%b') AS month,
    COUNT(*) AS total_flights,
    ROUND(100.0 * SUM(CASE
                WHEN f.arrival_delay > 15 THEN 1
                ELSE 0
            END) / COUNT(*),
            2) AS delay_rate,
    ROUND(AVG(f.arrival_delay), 2) AS avg_delay
FROM
    flights f
WHERE
    f.cancelled = 0 AND f.diverted = 0
GROUP BY MONTH(f.flight_date) , DATE_FORMAT(f.flight_date, '%b')
ORDER BY MONTH(f.flight_date);


-- Delay trend by hour --
SELECT
    CONCAT(LPAD(departure_hour, 2, '0'), ':00') AS departure_hour,
    total_flights,
    delay_rate,
    avg_delay
FROM hourly_delay_summary
ORDER BY departure_hour;


-- Delay cause analytics --

SELECT
    delay_cause,
    delay_hours,
    delay_percentage
FROM delay_cause_summary
ORDER BY delay_hours DESC;


-- Airline + Route analytics --

SELECT
	a.airline_code,
	ao.airport_code AS origin,
	ad.airport_code AS destination,

	COUNT(*) AS total_flights,

	ROUND(
		AVG(f.arrival_delay),
		2
	) AS avg_delay,

	ROUND(
		100.0 * SUM(
			CASE
				WHEN f.arrival_delay > 15 THEN 1
				ELSE 0
			END
		) / COUNT(*),
		2
	) AS delay_rate,

	ROUND(
		100.0 * SUM(
			CASE
				WHEN f.arrival_delay > 60 THEN 1
				ELSE 0
			END
		) / COUNT(*),
		2
	) AS severe_delay_rate

FROM flights f

JOIN airlines a
	ON f.airline_id = a.airline_id

JOIN routes r
	ON f.route_id = r.route_id

JOIN airports ao
	ON r.origin_airport_id = ao.airport_id

JOIN airports ad
	ON r.destination_airport_id = ad.airport_id

WHERE a.airline_code = ?
  AND ao.airport_code = ?
  AND ad.airport_code = ?

GROUP BY
	a.airline_code,
	ao.airport_code,
	ad.airport_code;