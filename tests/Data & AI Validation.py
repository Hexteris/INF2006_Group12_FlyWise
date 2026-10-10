import os
import math
import requests
import pytest
from datetime import date

BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://inf2006-flywise-alb-1672116072.us-east-1.elb.amazonaws.com"
).rstrip("/")

TEST_DATE = "2025-01-20"

PREDICTION_PAYLOAD = {
    "airlineCode": "AA",
    "origin": "JFK",
    "destination": "LAX",
    "scheduledDeparture": "2025-01-20T08:00:00",
    "scheduledArrival": "2025-01-20T14:30:00",
    "flightDate": TEST_DATE
}


def test_flight_data_quality():
    """Verify flight records match the requested date and route."""

    response = requests.get(
        f"{BASE_URL}/flights",
        params={
            "flight_date": TEST_DATE,
            "origin": "JFK",
            "destination": "LAX"
        },
        timeout=30
    )

    assert response.status_code == 200, (
        f"Flight search failed: HTTP {response.status_code}: "
        f"{response.text[:300]}"
    )

    flights = response.json()

    assert isinstance(flights, list)
    assert len(flights) > 0, "No matching flights were returned."

    for flight in flights:
        assert isinstance(flight, dict)

        flight_date = flight.get("flight_date")
        origin = flight.get("origin")
        destination = flight.get("destination", flight.get("dest"))

        assert flight_date is not None
        assert origin is not None
        assert destination is not None

        if isinstance(flight_date, date):
            flight_date = flight_date.isoformat()

        assert str(flight_date)[:10] == TEST_DATE
        assert origin == "JFK"
        assert destination == "LAX"

        for field in ("dep_delay", "arr_delay", "distance"):
            value = flight.get(field)

            if value is not None:
                number = float(value)
                assert math.isfinite(number), (
                    f"{field} contains an invalid numeric value."
                )


def test_prediction_output_is_valid():
    """Verify the XGBoost API returns a valid probability and label."""

    response = requests.post(
        f"{BASE_URL}/predict",
        json=PREDICTION_PAYLOAD,
        timeout=60
    )

    assert response.status_code == 200, (
        f"Prediction failed: HTTP {response.status_code}: "
        f"{response.text[:500]}"
    )

    result = response.json()

    assert result.get("success") is True, (
        f"Prediction API reported failure: {result}"
    )

    prediction = result.get("data")

    assert isinstance(prediction, dict)
    assert "score" in prediction
    assert "label" in prediction

    score = prediction["score"]

    assert isinstance(score, (int, float))
    assert math.isfinite(score)
    assert 0 <= score <= 1, (
        f"Probability is outside the valid range: {score}"
    )

    expected_label = "DELAYED" if score >= 0.5 else "ON_TIME"

    assert prediction["label"] == expected_label, (
        "Prediction label does not match the 0.5 threshold."
    )

    assert prediction.get("modelVersion"), (
        "Model version is missing."
    )

    historical = prediction.get("historical")
    assert isinstance(historical, dict)

    for field in ("routeDelayRate", "hourlyDelayRate"):
        value = historical.get(field)

        if value is not None:
            assert math.isfinite(float(value)), (
                f"{field} is not a finite numeric value."
            )


@pytest.mark.parametrize(
    "payload",
    [
        {
            **PREDICTION_PAYLOAD,
            "flightDate": "not-a-date"
        },
        {
            **PREDICTION_PAYLOAD,
            "scheduledDeparture": "2025-01-20T14:30:00",
            "scheduledArrival": "2025-01-20T08:00:00"
        },
        {
            **PREDICTION_PAYLOAD,
            "origin": "ZZZ"
        }
    ],
    ids=[
        "invalid-flight-date",
        "invalid-schedule",
        "unknown-origin-airport"
    ]
)
def test_prediction_rejects_invalid_inputs(payload):
    """Verify invalid prediction inputs are rejected."""

    response = requests.post(
        f"{BASE_URL}/predict",
        json=payload,
        timeout=30
    )

    assert response.status_code == 422, (
        f"Expected HTTP 422 for invalid input, "
        f"received HTTP {response.status_code}: "
        f"{response.text[:300]}"
    )