# vitaforge/backend/api/views.py
from django.contrib.auth.models import User
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import HealthProfile
from .serializers import UserSerializer, HealthProfileSerializer

class HealthProfileView(generics.ListCreateAPIView):
    """
    List (if exists) or create a new HealthProfile for the authenticated user.
    """
    serializer_class = HealthProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HealthProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        conditions = self.request.data.get("health_conditions", [])
        # If "none" is selected, override conditions: all conditions become False.
        if "none" in conditions:
            condition_data = {
                "diabetes": False,
                "hypertension": False,
                "heart_disease": False,
                "high_cholesterol": False,
                "arthritis": False,
            }
        else:
            condition_data = {
                "diabetes": "diabetes" in conditions,
                "hypertension": "hypertension" in conditions,
                "heart_disease": "heart_disease" in conditions,
                "high_cholesterol": "high_cholesterol" in conditions,
                "arthritis": "arthritis" in conditions,
            }
        serializer.save(user=self.request.user, **condition_data)

class HealthProfileDetail(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the HealthProfile of the authenticated user.
    """
    serializer_class = HealthProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return HealthProfile.objects.get(user=self.request.user)

class CreateUserView(generics.CreateAPIView):
    """
    Endpoint for user registration.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
