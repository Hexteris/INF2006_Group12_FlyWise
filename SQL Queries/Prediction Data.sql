-- Prediction Data --

SELECT
	a.airline_code,

	ao.airport_code AS origin,
	ad.airport_code AS destination,

	COUNT(*) AS historical_flights,

	AVG(f.departure_delay)
		AS avg_departure_delay,

	AVG(f.arrival_delay)
		AS avg_arrival_delay,

	ROUND(
		100.0 * AVG(
			CASE
				WHEN f.arrival_delay > 15 THEN 1
				ELSE 0
			END
		),
		2
	) AS historical_delay_rate,

	ROUND(
		100.0 * AVG(
			CASE
				WHEN f.arrival_delay > 60 THEN 1
				ELSE 0
			END
		),
		2
	) AS historical_severe_delay_rate

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