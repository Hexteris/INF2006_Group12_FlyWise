import os
import requests

BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://inf2006-flywise-alb-1672116072.us-east-1.elb.amazonaws.com"
).rstrip("/")

def test_protected_endpoint_rejects_missing_token():
    """Unauthenticated requests should not access /me."""

    response = requests.get(
        f"{BASE_URL}/me",
        timeout=30
    )

    assert response.status_code in (401, 403), (
        f"Expected 401 or 403 without a token, "
        f"received {response.status_code}: "
        f"{response.text[:300]}"
    )


def test_protected_endpoint_rejects_invalid_token():
    """An invalid JWT should not grant access to /me."""

    response = requests.get(
        f"{BASE_URL}/me",
        headers={
            "Authorization": "Bearer invalid.token.value"
        },
        timeout=30
    )

    assert response.status_code in (401, 403), (
        f"Expected 401 or 403 with an invalid token, "
        f"received {response.status_code}: "
        f"{response.text[:300]}"
    )