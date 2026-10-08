CREATE TABLE IF NOT EXISTS monthly_delay_summary (
    month_num TINYINT PRIMARY KEY,
    month_name CHAR(3) NOT NULL,
    total_flights INT NOT NULL,
    delay_rate DECIMAL(6,2) NOT NULL,
    avg_delay DECIMAL(10,2) NOT NULL
);

DELETE FROM monthly_delay_summary;

INSERT INTO monthly_delay_summary (
    month_num,
    month_name,
    total_flights,
    delay_rate,
    avg_delay
)
SELECT
    MONTH(f.flight_date) AS month_num,
    DATE_FORMAT(f.flight_date, '%b') AS month_name,
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
GROUP BY MONTH(f.flight_date), DATE_FORMAT(f.flight_date, '%b')
ORDER BY month_num;
