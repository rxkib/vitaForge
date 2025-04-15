import pytest
import requests
from django.urls import reverse
from rest_framework.test import APIClient

# Define a fake response class to simulate requests.get.
class FakeResponse:
    def __init__(self, json_data, status_code=200, raise_error=False):
        self.json_data = json_data
        self.status_code = status_code
        self.raise_error = raise_error

    def raise_for_status(self):
        if self.raise_error:
            raise requests.RequestException("Simulated network error")
        # Otherwise, do nothing.

    def json(self):
        return self.json_data

@pytest.mark.django_db
def test_proxy_exercises_success(monkeypatch):
    """
    Test the proxy_exercises endpoint:
      - When a valid 'muscle' query parameter is provided (e.g. "Chest"),
        simulate an external response and verify that only exercises
        matching the target criteria are returned.
    """
    client = APIClient()
    
    # Dummy external data returned by the muscle API.
    fake_exercises = [
        {"id": 1, "target": {"Primary": "Chest", "Secondary": "Shoulders"}, "name": "Push-Up"},
        {"id": 2, "target": {"Primary": "Legs"}, "name": "Squat"},
        {"id": 3, "target": {"Primary": "Chest"}, "name": "Bench Press"},
        {"id": 4, "target": {"Primary": "Back"}, "name": "Pull-Up"},
    ]
    
    # Fake requests.get function that returns our dummy data.
    def fake_get(url, params):
        # You can assert that the URL and parameters match expected values.
        # For this test, we return a fake response regardless.
        return FakeResponse(fake_exercises)
    
    # Override requests.get with our fake version.
    monkeypatch.setattr(requests, "get", fake_get)
    
    # Build the URL using reverse (the URL name is "proxy_exercises").
    url = reverse("proxy_exercises")
    # Query with muscle set to "Chest". Other query parameters can be added similarly.
    response = client.get(url, data={"muscle": "Chest"})
    
    # Assert the response is OK.
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    # The proxy_exercises view filters the exercises:
    # It checks for each exercise if 'target' exists and if target['Primary'] contains the queried muscle.
    # In our fake data, IDs 1 and 3 have 'target' with "Chest" as primary.
    expected = [
        {"id": 1, "target": {"Primary": "Chest", "Secondary": "Shoulders"}, "name": "Push-Up"},
        {"id": 3, "target": {"Primary": "Chest"}, "name": "Bench Press"},
    ]
    assert data == expected, f"Expected filtered data {expected}, got {data}"

@pytest.mark.django_db
def test_proxy_exercises_error(monkeypatch):
    """
    Test the proxy_exercises endpoint error scenario:
      - Simulate a network or external API error, and ensure the endpoint returns a 500 error with an error message.
    """
    client = APIClient()
    
    # Define a fake requests.get that always raises an exception.
    def fake_get(url, params):
        raise requests.RequestException("Simulated network error")
    
    monkeypatch.setattr(requests, "get", fake_get)
    
    url = reverse("proxy_exercises")
    response = client.get(url, data={"muscle": "Chest"})
    
    # Expect a 500 error.
    assert response.status_code == 500, f"Expected 500, got {response.status_code}"
    data = response.json()
    assert "error" in data, "Expected error key in response"
    assert "Simulated network error" in data["error"], f"Unexpected error message: {data['error']}"
