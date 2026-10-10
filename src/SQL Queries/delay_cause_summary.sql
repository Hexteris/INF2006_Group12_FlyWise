CREATE TABLE IF NOT EXISTS delay_cause_summary (
    delay_cause VARCHAR(64) PRIMARY KEY,
    delay_hours DECIMAL(14, 2) NOT NULL,
    delay_percentage DECIMAL(6, 2) NOT NULL
);

DELETE FROM delay_cause_summary;

INSERT INTO delay_cause_summary (
    delay_cause,
    delay_hours,
    delay_percentage
)
SELECT
    delay_cause,
    ROUND(cause_minutes / 60, 2) AS delay_hours,
    ROUND(100.0 * cause_minutes / NULLIF(total_minutes, 0), 2)
        AS delay_percentage
FROM (
    SELECT
        delay_cause,
        SUM(delay_minutes) AS cause_minutes,
        SUM(SUM(delay_minutes)) OVER () AS total_minutes
    FROM (
        SELECT 'Carrier' AS delay_cause, COALESCE(carrier_delay, 0) AS delay_minutes
        FROM flights
        UNION ALL
        SELECT 'Weather', COALESCE(weather_delay, 0)
        FROM flights
        UNION ALL
        SELECT 'National Airspace System', COALESCE(nas_delay, 0)
        FROM flights
        UNION ALL
        SELECT 'Security', COALESCE(security_delay, 0)
        FROM flights
        UNION ALL
        SELECT 'Late Aircraft', COALESCE(late_aircraft_delay, 0)
        FROM flights
    ) AS cause_minutes_by_flight
    WHERE delay_minutes > 0
    GROUP BY delay_cause
) AS cause_totals;
