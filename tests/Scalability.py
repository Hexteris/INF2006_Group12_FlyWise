import os
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://inf2006-flywise-alb-1672116072.us-east-1.elb.amazonaws.com"
).rstrip("/")

REQUEST_COUNT = 10
MAX_WORKERS = 5


def test_health_endpoint_under_light_concurrency():
    """Check that the API health endpoint handles concurrent requests."""

    def send_health_request():
        start = time.perf_counter()

        response = requests.get(
            f"{BASE_URL}/health",
            timeout=20
        )

        elapsed = time.perf_counter() - start

        assert response.status_code == 200, (
            f"Health check returned HTTP {response.status_code}: "
            f"{response.text[:200]}"
        )

        data = response.json()

        assert data.get("success") is True, (
            f"Health check reported failure: {data}"
        )

        return elapsed

    durations = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(send_health_request)
            for _ in range(REQUEST_COUNT)
        ]

        for future in as_completed(futures):
            durations.append(future.result())

    print(f"Successful requests: {len(durations)}/{REQUEST_COUNT}")
    print(f"Concurrent workers: {MAX_WORKERS}")
    print(f"Average response time: {sum(durations) / len(durations):.3f}s")
    print(f"Maximum response time: {max(durations):.3f}s")

    assert len(durations) == REQUEST_COUNT


def test_flight_search_after_service_recovery():
    """
    Run after restarting the required cloud services.
    Verify that database-backed flight search works again.
    """

    response = requests.get(
        f"{BASE_URL}/flights",
        params={
            "flight_date": "2025-01-20",
            "origin": "JFK",
            "destination": "LAX"
        },
        timeout=30
    )

    assert response.status_code == 200, (
        f"Flight search did not recover: HTTP {response.status_code}: "
        f"{response.text[:300]}"
    )

    flights = response.json()

    assert isinstance(flights, list), (
        "Expected a list of flights after recovery."
    )
    assert len(flights) > 0, (
        "API responded, but no matching flights were returned."
    )