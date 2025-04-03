# vitaforge/backend/api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserMeView, DailyLogView, DailyLogRecapView, proxy_exercises, WeightHistoryView, CreateUserView, HealthProfileView, HealthProfileDetail, RecommendationView, MealPlanOptimizationView
from .views import SavedMealPlanView

urlpatterns = [
    # Registration
    path("user/register/", CreateUserView.as_view(), name="register"),

    # Auth Token (login) and Refresh
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("user/me/", UserMeView.as_view(), name="user_me"),

    # HealthProfile endpoints
    path("health-profile/", HealthProfileView.as_view(), name="healthprofile-create-list"),
    path("health-profile/detail/", HealthProfileDetail.as_view(), name="healthprofile-detail"),

    # NEW weight history endpoint
    path("health-profile/weight/", WeightHistoryView.as_view(), name="weight_history"),
    path("daily-log/", DailyLogView.as_view(), name="daily-log"),
    path("daily-log/<str:date_str>/recap/", DailyLogRecapView.as_view(), name="daily-log-recap"),
    path('proxy/exercises/', proxy_exercises, name='proxy_exercises'),
    path("recommendations/", RecommendationView.as_view(), name="recommendations"),
    #ML
    path("meal-plan-optimization/", MealPlanOptimizationView.as_view(), name="meal_plan_optimization"),
    path("meal-plan/", SavedMealPlanView.as_view(), name="saved_meal_plan"),
    
]
