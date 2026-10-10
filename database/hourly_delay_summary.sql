CREATE TABLE IF NOT EXISTS hourly_delay_summary (
    departure_hour TINYINT PRIMARY KEY,
    total_flights INT NOT NULL,
    delay_rate DECIMAL(6,2) NOT NULL,
    avg_delay DECIMAL(10,2) NOT NULL
);

DELETE FROM hourly_delay_summary;

INSERT INTO hourly_delay_summary (
    departure_hour,
    total_flights,
    delay_rate,
    avg_delay
)
SELECT
    HOUR(f.scheduled_departure) AS departure_hour,
    COUNT(*) AS total_flights,
    ROUND(
        100.0 * SUM(
            CASE
                WHEN f.arrival_delay > 15 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS delay_rate,
    ROUND(AVG(f.arrival_delay), 2) AS avg_delay
FROM flights f
WHERE f.cancelled = 0
  AND f.diverted = 0
GROUP BY HOUR(f.scheduled_departure)
ORDER BY departure_hour;
