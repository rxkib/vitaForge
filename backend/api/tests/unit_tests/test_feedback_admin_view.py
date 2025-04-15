import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.utils import timezone

from api.models import Feedback, MealPlan

User = get_user_model()

# --- FeedbackView Tests ---

@pytest.mark.django_db
def test_feedback_view_get_and_post():
    """
    Test the FeedbackView endpoint:
    - GET: Should return only top-level feedback (where parent is null)
    - POST: Creating a new feedback stores it with the authenticated user.
    """
    client = APIClient()
    user = User.objects.create_user(username="feedbackuser@example.com",
                                    email="feedbackuser@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a top-level feedback and a reply feedback.
    top_feedback = Feedback.objects.create(user=user, message="Top level feedback")
    reply_feedback = Feedback.objects.create(user=user, message="Reply feedback", parent=top_feedback)
    
    # GET: The view should return only top-level feedback in a wrapped dictionary.
    url = reverse("feedback")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert "feedbacks" in data
    feedbacks = data["feedbacks"]
    # The top-level feedback should be included.
    assert any(fb["id"] == top_feedback.id for fb in feedbacks)
    # The reply feedback should not be included.
    assert not any(fb["id"] == reply_feedback.id for fb in feedbacks)
    
    # POST: Create new top-level feedback.
    post_data = {"message": "New feedback message"}
    response = client.post(url, data=post_data, format="json")
    # Depending on your implementation, expect status 200 or 201.
    assert response.status_code in [200, 201]
    resp_data = response.json()
    # Verify that the feedback message is correctly returned.
    assert resp_data["message"] == "New feedback message"
    # Verify it is stored in the database.
    assert Feedback.objects.filter(user=user, message="New feedback message", parent__isnull=True).exists()


@pytest.mark.django_db
def test_feedback_detail_view_get_and_delete():
    """
    Test the FeedbackDetailView endpoint for retrieving and deleting a feedback.
    """
    client = APIClient()
    user = User.objects.create_user(username="feedbackdetail@example.com",
                                    email="feedbackdetail@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a top-level feedback.
    feedback_obj = Feedback.objects.create(user=user, message="Feedback to delete")
    
    # GET the feedback detail.
    detail_url = reverse("feedback-detail", kwargs={"pk": feedback_obj.id})
    response = client.get(detail_url)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == feedback_obj.id
    assert data["message"] == feedback_obj.message
    
    # DELETE the feedback.
    response = client.delete(detail_url)
    # Depending on your view, status may be 200 or 204.
    assert response.status_code in [200, 204]
    # Verify that the feedback is deleted from the database.
    with pytest.raises(Feedback.DoesNotExist):
        Feedback.objects.get(id=feedback_obj.id)


# --- AdminMealPlanView Tests ---

@pytest.mark.django_db
def test_admin_meal_plan_view_permission():
    """
    Test the AdminMealPlanView endpoint:
    - Non-admin users should not have access (returning a 403 or redirect).
    - Admin users (is_staff True) can access the endpoint and receive a list of meal plans.
    """
    client = APIClient()
    
    # Create two regular users and their MealPlans.
    user1 = User.objects.create_user(username="user1@example.com",
                                     email="user1@example.com", password="password")
    user2 = User.objects.create_user(username="user2@example.com",
                                     email="user2@example.com", password="password")
    
    MealPlan.objects.create(
        user=user1,
        plan={"Food A": 100.0},
        daily_targets={"calories": 2000, "protein": 100, "fat": 70, "carbs": 250, "fiber": 30}
    )
    MealPlan.objects.create(
        user=user2,
        plan={"Food B": 150.0},
        daily_targets={"calories": 2100, "protein": 110, "fat": 80, "carbs": 260, "fiber": 35}
    )
    
    # Non-admin user access: Create a normal user.
    non_admin = User.objects.create_user(username="nonadmin@example.com",
                                         email="nonadmin@example.com", password="password")
    client.force_authenticate(user=non_admin)
    admin_url = reverse("admin_meal_plans")
    response = client.get(admin_url)
    # Expect non-admin access to fail (403 Forbidden or a redirect).
    assert response.status_code in [302, 403]
    
    # Now test admin user access.
    admin_user = User.objects.create_user(username="admin@example.com",
                                          email="admin@example.com", password="password", is_staff=True)
    client.force_authenticate(user=admin_user)
    response = client.get(admin_url)
    assert response.status_code == 200
    data = response.json()
    # The view returns a list of meal plans.
    assert isinstance(data, list)
    # There should be at least two meal plans.
    assert len(data) >= 2
