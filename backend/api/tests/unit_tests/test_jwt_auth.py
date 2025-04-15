import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_jwt_authentication_flow():
    client = APIClient()
    # Create a test user.
    user = User.objects.create_user(username="jwtuser@example.com", email="jwtuser@example.com", password="password")
    
    # Obtain JWT token via the token-obtain-pair endpoint (ensure the URL name matches your setup).
    token_url = reverse("token_obtain_pair")
    response = client.post(token_url, {"username": "jwtuser@example.com", "password": "password"}, format="json")
    assert response.status_code == 200
    tokens = response.json()
    access_token = tokens["access"]
    refresh_token = tokens["refresh"]

    # Use the access token to authenticate a protected endpoint.
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    user_me_url = reverse("user_me")
    response = client.get(user_me_url)
    assert response.status_code == 200

    # Test token refresh.
    refresh_url = reverse("token_refresh")
    response = client.post(refresh_url, {"refresh": refresh_token}, format="json")
    assert response.status_code == 200
    new_access_token = response.json()["access"]
    assert new_access_token != access_token
