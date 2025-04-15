import pytest
from django.contrib.auth.models import AnonymousUser, User
from rest_framework.test import APIRequestFactory
from api.admin_views import AdminPermission

@pytest.fixture
def admin_user(db):
    # Create an admin user with is_staff True.
    return User.objects.create_user(username="admin", email="admin@example.com", password="password", is_staff=True)

@pytest.fixture
def regular_user(db):
    # Create a regular user (non-admin)
    return User.objects.create_user(username="user", email="user@example.com", password="password", is_staff=False)

@pytest.fixture
def request_factory():
    return APIRequestFactory()

def test_admin_permission_allows_admin(request_factory, admin_user):
    permission = AdminPermission()
    # Create a dummy GET request.
    request = request_factory.get("/dummy-url/")
    request.user = admin_user
    # Since admin_user.is_staff is True, permission.has_permission should return True.
    assert permission.has_permission(request, None) is True

def test_admin_permission_rejects_regular_user(request_factory, regular_user):
    permission = AdminPermission()
    request = request_factory.get("/dummy-url/")
    request.user = regular_user
    # Regular user should not pass the admin check.
    assert permission.has_permission(request, None) is False

def test_admin_permission_rejects_anonymous(request_factory):
    permission = AdminPermission()
    request = request_factory.get("/dummy-url/")
    request.user = AnonymousUser()
    # Anonymous users should always be rejected.
    assert permission.has_permission(request, None) is False
