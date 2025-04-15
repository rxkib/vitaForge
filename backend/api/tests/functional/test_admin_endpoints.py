import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_admin_dashboard_access_as_admin():
    """
    Test that an admin user can access the admin dashboard and retrieve a list of users.
    """
    client = APIClient()
    
    # Create admin user.
    admin_user = User.objects.create_user(
        username="admin@example.com",
        email="admin@example.com",
        password="password",
        is_staff=True
    )
    
    # Create some regular users.
    User.objects.create_user(username="user1@example.com", email="user1@example.com", password="password")
    User.objects.create_user(username="user2@example.com", email="user2@example.com", password="password")
    
    client.force_authenticate(user=admin_user)
    dashboard_url = reverse("admin_dashboard")
    response = client.get(dashboard_url)
    
    assert response.status_code == 200, f"Admin dashboard access failed: {response.content}"
    data = response.json()
    # Verify that data contains a "users" key with a list.
    assert "users" in data, "Dashboard response missing 'users' key"
    assert isinstance(data["users"], list)
    # Optionally, check that the list includes at least the users we expect.
    user_ids = [user_data["id"] for user_data in data["users"]]
    assert admin_user.id in user_ids

@pytest.mark.django_db
def test_admin_delete_user_success():
    """
    Test that an admin user can successfully delete a non-admin user.
    """
    client = APIClient()
    
    # Create an admin user.
    admin_user = User.objects.create_user(
        username="admin_del@example.com",
        email="admin_del@example.com",
        password="password",
        is_staff=True
    )
    # Create a regular user who will be deleted.
    user_to_delete = User.objects.create_user(
        username="delete_me@example.com",
        email="delete_me@example.com",
        password="password"
    )
    
    client.force_authenticate(user=admin_user)
    delete_url = reverse("admin_delete_user", kwargs={"user_id": user_to_delete.id})
    response = client.delete(delete_url)
    
    # Expect a 204 No Content response.
    assert response.status_code == 204, f"Admin delete user failed: {response.content}"
    
    # Verify that the user is removed.
    with pytest.raises(User.DoesNotExist):
        User.objects.get(pk=user_to_delete.id)

@pytest.mark.django_db
def test_admin_delete_self_rejected():
    """
    Test that an admin user cannot delete their own account.
    The endpoint should return a 400 error indicating that an admin cannot delete self.
    """
    client = APIClient()
    admin_user = User.objects.create_user(
        username="selfdeladmin@example.com",
        email="selfdeladmin@example.com",
        password="password",
        is_staff=True
    )
    client.force_authenticate(user=admin_user)
    
    delete_url = reverse("admin_delete_user", kwargs={"user_id": admin_user.id})
    response = client.delete(delete_url)
    
    # Expect a 400 error response.
    assert response.status_code == 400, f"Expected 400 when admin deletes self, got {response.status_code}"
    data = response.json()
    assert "error" in data, "Expected error message when admin tries to delete self"
    assert data["error"] == "Admin cannot delete self.", f"Unexpected error message: {data['error']}"

@pytest.mark.django_db
def test_admin_delete_nonexistent_user():
    """
    Test that attempting to delete a user that does not exist returns a 404 error.
    """
    client = APIClient()
    admin_user = User.objects.create_user(
        username="admin_nonexist@example.com",
        email="admin_nonexist@example.com",
        password="password",
        is_staff=True
    )
    client.force_authenticate(user=admin_user)
    
    # Use an arbitrary user ID that is not in the database.
    delete_url = reverse("admin_delete_user", kwargs={"user_id": 99999})
    response = client.delete(delete_url)
    assert response.status_code == 404, f"Expected 404 for non-existent user deletion, got {response.status_code}"
    data = response.json()
    assert "error" in data, "Expected error key in response for non-existent user"
    assert data["error"] == "User not found.", f"Unexpected error message: {data['error']}"

@pytest.mark.django_db
def test_admin_endpoints_denied_for_non_admin():
    """
    Test that non-admin (regular) users cannot access admin endpoints.
    For example, accessing the admin dashboard should be forbidden.
    """
    client = APIClient()
    non_admin = User.objects.create_user(
        username="regular@example.com",
        email="regular@example.com",
        password="password",
        is_staff=False
    )
    client.force_authenticate(user=non_admin)
    
    dashboard_url = reverse("admin_dashboard")
    response = client.get(dashboard_url)
    
    # The expected status code for non-admin access could be 403 (Forbidden) or a redirect.
    # Adjust the expected code if necessary based on your implementation.
    assert response.status_code in [302, 403], f"Non-admin user should not access admin endpoints; got {response.status_code}"
