import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_admin_dashboard_view_success():
    """
    Test that AdminDashboardView returns a list of users for an authenticated admin.
    """
    client = APIClient()
    # Create a couple of regular users.
    user1 = User.objects.create_user(username="user1@example.com", email="user1@example.com", password="password")
    user2 = User.objects.create_user(username="user2@example.com", email="user2@example.com", password="password")
    
    # Create an admin user.
    admin = User.objects.create_user(username="admin@example.com", email="admin@example.com", password="password", is_staff=True)
    client.force_authenticate(user=admin)
    
    url = reverse("admin_dashboard")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    # Check that the response returns a dictionary with a key "users" containing a list.
    assert "users" in data
    users_list = data["users"]
    assert isinstance(users_list, list)
    # Verify that each user object in the list has the expected fields.
    for user_data in users_list:
        assert "id" in user_data
        assert "username" in user_data
        assert "email" in user_data
        assert "is_staff" in user_data
        assert "is_superuser" in user_data
    
    # Check that the created users' ids appear in the returned list.
    returned_ids = [u["id"] for u in users_list]
    assert user1.id in returned_ids
    assert user2.id in returned_ids
    assert admin.id in returned_ids

@pytest.mark.django_db
def test_delete_user_view_success():
    """
    Test that an admin can successfully delete a non-admin user.
    """
    client = APIClient()
    # Create an admin user and a regular user (to be deleted).
    admin = User.objects.create_user(username="admin_del@example.com", email="admin_del@example.com", password="password", is_staff=True)
    user_to_delete = User.objects.create_user(username="todelete@example.com", email="todelete@example.com", password="password")
    client.force_authenticate(user=admin)
    
    url = reverse("admin_delete_user", kwargs={"user_id": user_to_delete.id})
    response = client.delete(url)
    # Expect a 204 NO CONTENT response for a successful deletion.
    assert response.status_code == 204
    # Confirm that the user is deleted.
    with pytest.raises(User.DoesNotExist):
        User.objects.get(pk=user_to_delete.id)

@pytest.mark.django_db
def test_delete_user_view_admin_cannot_delete_self():
    """
    Test that an admin cannot delete their own account.
    """
    client = APIClient()
    admin = User.objects.create_user(username="selfdeladmin@example.com", email="selfdeladmin@example.com", password="password", is_staff=True)
    client.force_authenticate(user=admin)
    
    url = reverse("admin_delete_user", kwargs={"user_id": admin.id})
    response = client.delete(url)
    # Expect a 400 error since an admin cannot delete self.
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"] == "Admin cannot delete self."

@pytest.mark.django_db
def test_delete_user_view_nonexistent_user():
    """
    Test that attempting to delete a user that does not exist returns a 404 error.
    """
    client = APIClient()
    admin = User.objects.create_user(username="admin_nonexist@example.com", email="admin_nonexist@example.com", password="password", is_staff=True)
    client.force_authenticate(user=admin)
    
    # Use an arbitrary user id that is not in the database.
    url = reverse("admin_delete_user", kwargs={"user_id": 99999})
    response = client.delete(url)
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"] == "User not found."
