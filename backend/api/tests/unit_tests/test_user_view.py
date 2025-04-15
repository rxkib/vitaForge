import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_user_me_get():
    """
    Test GET for the UserMeView endpoint to ensure that an authenticated user's details 
    are correctly returned.
    """
    client = APIClient()

    # Create a test user.
    user = User.objects.create_user(
        username="test@example.com",
        password="password",
        email="test@example.com"
    )

    # Use force_authenticate to bypass actual login.
    client.force_authenticate(user=user)

    # Call the endpoint (ensure your urls.py maps "user_me" correctly).
    url = reverse("user_me")
    response = client.get(url)

    # Assert that we get a 200 OK response.
    assert response.status_code == 200

    # Verify that the response includes the correct user details.
    data = response.json()
    assert data["username"] == user.username
    assert data["email"] == user.email
    # Optionally, add asserts for is_staff and is_superuser if needed.

@pytest.mark.django_db
def test_user_me_delete():
    """
    Test DELETE for the UserMeView endpoint to ensure that the authenticated user's 
    account is correctly removed.
    """
    client = APIClient()

    # Create a test user.
    user = User.objects.create_user(
        username="delete@example.com",
        password="password",
        email="delete@example.com"
    )

    # Authenticate the test user.
    client.force_authenticate(user=user)

    # Call the DELETE endpoint.
    url = reverse("user_me")
    response = client.delete(url)

    # Assert that the response status is 204 NO CONTENT.
    assert response.status_code == 204

    # Optionally, verify that the JSON response contains a message.
    data = response.data
    assert "message" in data
    assert data["message"] == "User account deleted successfully."

    # Confirm that the user is actually deleted from the database.
    assert not User.objects.filter(email="delete@example.com").exists()

@pytest.mark.django_db
def test_create_user_view():
    """
    Test the CreateUserView endpoint for user registration.
    When valid registration data is provided, a new user should be created.
    """
    client = APIClient()

    # Ensure the URL name "register" matches the CreateUserView in your urls.py.
    url = reverse("register")
    data = {
        "email": "newuser@example.com",
        "password": "newpassword"
    }
    response = client.post(url, data=data, format="json")
    
    # Depending on your view implementation, expect a 200 or 201 status code.
    assert response.status_code in [200, 201]
    
    # Verify that a new user is created with the specified email.
    user = User.objects.get(email="newuser@example.com")
    # According to your serializer, email is used as both username and email.
    assert user.username == "newuser@example.com"
