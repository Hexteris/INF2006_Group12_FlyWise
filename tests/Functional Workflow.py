import os
import requests
from datetime import date

BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://inf2006-flywise-alb-1672116072.us-east-1.elb.amazonaws.com"
).rstrip("/")

def test_flight_search_workflow():
    """Verify that a flight search returns matching flight records."""

    # Step 1: Submit a flight search.
    search_params = {
        "flight_date": "2025-01-20",
        "origin": "JFK",
        "destination": "LAX"
    }

    response = requests.get(
        f"{BASE_URL}/flights",
        params=search_params,
        timeout=30
    )

    # Step 2: Verify that the search succeeds.
    assert response.status_code == 200, (
        f"Flight search failed: {response.status_code}; "
        f"{response.text[:500]}"
    )

    # Step 3: Verify the response format.
    flights = response.json()

    assert isinstance(flights, list), (
        "Expected the API to return a list of flights."
    )

    # The test data should contain at least one matching flight.
    assert len(flights) > 0, (
        "No flights returned for the test search. "
        "Verify the dataset and search parameters."
    )

    # Step 4: Verify that each returned record matches
    # the requested date and route.
    for flight in flights:
        assert isinstance(flight, dict)

        flight_date = flight.get("flight_date")
        origin = flight.get("origin")
        destination = flight.get(
            "destination",
            flight.get("dest")
        )

        assert flight_date is not None, (
            "Flight record is missing flight_date."
        )
        assert origin is not None, (
            "Flight record is missing origin."
        )
        assert destination is not None, (
            "Flight record is missing destination/dest."
        )

        # Support date values returned as strings.
        if isinstance(flight_date, date):
            flight_date = flight_date.isoformat()

        assert str(flight_date)[:10] == "2025-01-20"
        assert origin == "JFK"
        assert destination == "LAX"