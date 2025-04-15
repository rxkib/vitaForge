import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_token_refresh_success():
    """
    Functional test for token refresh flow:
    1. Obtain access and refresh tokens using the login endpoint.
    2. Use the refresh token to request a new access token.
    3. Verify that the new access token is valid and different from the original.
    """
    client = APIClient()
    
    # Create a test user.
    user = User.objects.create_user(
        username="refreshuser@example.com",
        email="refreshuser@example.com",
        password="password"
    )
    
    # Login to obtain tokens.
    token_url = reverse("token_obtain_pair")
    login_data = {
        "username": "refreshuser@example.com",
        "password": "password"
    }
    response = client.post(token_url, data=login_data, format="json")
    assert response.status_code == 200, f"Login failed: {response.content}"
    
    tokens = response.json()
    assert "access" in tokens, "Access token not returned"
    assert "refresh" in tokens, "Refresh token not returned"
    
    original_access = tokens["access"]
    refresh_token = tokens["refresh"]
    
    # Use the refresh token to obtain a new access token.
    refresh_url = reverse("token_refresh")
    response = client.post(refresh_url, data={"refresh": refresh_token}, format="json")
    assert response.status_code == 200, f"Token refresh failed: {response.content}"
    new_tokens = response.json()
    assert "access" in new_tokens, "New access token not returned"
    
    new_access = new_tokens["access"]
    assert new_access != original_access, "New access token should be different from original"
    
    # Optionally, check that the new access token can be used to access a protected endpoint.
    user_me_url = reverse("user_me")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access}")
    response = client.get(user_me_url)
    assert response.status_code == 200, "New access token is not valid"

@pytest.mark.django_db
def test_token_refresh_invalid_token():
    """
    Test that refreshing with an invalid refresh token returns a 401 error.
    """
    client = APIClient()
    refresh_url = reverse("token_refresh")
    
    # Use an invalid refresh token
    invalid_refresh = "invalidtoken123"
    response = client.post(refresh_url, data={"refresh": invalid_refresh}, format="json")
    # Expected status code can be 401 or 400 depending on configuration.
    assert response.status_code in [400, 401], f"Expected 400 or 401 error, got {response.status_code}"
    error_data = response.json()
    # Check that error information is included.
    assert "detail" in error_data or "error" in error_data, f"Expected error message, got: {error_data}"
