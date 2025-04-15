import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_signup_login_authenticated_access():
    """
    Functional test for the complete authentication pipeline:
      1. Sign up (POST /user/register/)
      2. Login (POST /token/) to obtain JWT tokens
      3. Access a protected endpoint (GET /user/me/) using the access token.
    """
    client = APIClient()

    # ----- Step 1: User Signup -----
    register_url = reverse("register")
    signup_data = {
        "email": "testuser@example.com",
        "password": "TestPassword123"
    }
    response = client.post(register_url, data=signup_data, format="json")
    # Expect 200 OK or 201 Created.
    assert response.status_code in [200, 201], f"Registration failed: {response.content}"
    
    # Verify that the user was created
    assert User.objects.filter(email=signup_data["email"]).exists(), "User not created in DB"

    # ----- Step 2: User Login to Obtain JWT Tokens -----
    token_url = reverse("token_obtain_pair")
    # NOTE: Our serializer uses email as both username and email.
    login_data = {
        "username": signup_data["email"],
        "password": signup_data["password"]
    }
    response = client.post(token_url, data=login_data, format="json")
    assert response.status_code == 200, f"Login failed: {response.content}"
    tokens = response.json()
    assert "access" in tokens, "Access token not returned"
    assert "refresh" in tokens, "Refresh token not returned"
    access_token = tokens["access"]

    # ----- Step 3: Authenticated Access to Protected Endpoint -----
    me_url = reverse("user_me")
    # Set the Authorization header using the JWT token.
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    response = client.get(me_url)
    assert response.status_code == 200, f"Authenticated access failed: {response.content}"
    
    user_data = response.json()
    # Verify that the returned user details match the signup data.
    # Expect that the username and email are both equal to the registered email.
    assert user_data["username"] == signup_data["email"], "Username does not match"
    assert user_data["email"] == signup_data["email"], "Email does not match"
