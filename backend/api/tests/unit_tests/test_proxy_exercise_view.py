import pytest
import requests
from django.urls import reverse
from rest_framework.test import APIClient

# A fake response class to simulate requests.get behavior.
class FakeResponse:
    def __init__(self, data, raise_error=False):
        self.data = data
        self.raise_error = raise_error

    def raise_for_status(self):
        if self.raise_error:
            raise requests.RequestException("Test error")
        return

    def json(self):
        return self.data

@pytest.mark.django_db
def test_proxy_exercises_success(monkeypatch):
    """
    Test proxy_exercises view when external request is successful and filtering based on target works.
    """
    # Define fake data that the external endpoint returns.
    fake_data = [
        {"id": 1, "target": {"Primary": "chest", "Secondary": "arms"}},
        {"id": 2, "target": {"Primary": "back"}},
        {"id": 3, "target": {"Primary": "chest and shoulders"}},
        {"id": 4, "target": None},
        {"id": 5, "target": {"Primary": ""}},
    ]
    
    # Create a fake requests.get that returns FakeResponse with fake_data.
    def fake_get(url, params):
        return FakeResponse(fake_data)

    monkeypatch.setattr(requests, "get", fake_get)

    client = APIClient()
    # Call the proxy_exercises endpoint with a query parameter "muscle" set to "chest".
    url = reverse("proxy_exercises")
    response = client.get(url, data={"muscle": "chest"})
    
    # Verify a 200 OK is returned.
    assert response.status_code == 200
    data = response.json()

    # Expected filtering: only the exercises with a 'target.Primary' that includes "chest".
    # In our fake_data, exercises with id 1 ("chest") and id 3 ("chest and shoulders") match.
    expected_data = [
        {"id": 1, "target": {"Primary": "chest", "Secondary": "arms"}},
        {"id": 3, "target": {"Primary": "chest and shoulders"}}
    ]
    assert data == expected_data

@pytest.mark.django_db
def test_proxy_exercises_error(monkeypatch):
    """
    Test proxy_exercises view when requests.get raises a RequestException.
    It should return a 500 error with an appropriate error message.
    """
    # Create a fake requests.get that always raises an exception.
    def fake_get(url, params):
        raise requests.RequestException("Test error")

    monkeypatch.setattr(requests, "get", fake_get)

    client = APIClient()
    url = reverse("proxy_exercises")
    response = client.get(url, data={"muscle": "chest"})
    
    # Expect a 500 error.
    assert response.status_code == 500
    data = response.json()
    assert "error" in data
    assert "Test error" in data["error"]
