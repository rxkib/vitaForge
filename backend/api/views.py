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
        # Prevent creation if the user already has a profile.
        if HealthProfile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError("Health profile already exists for this user.")
        serializer.save(user=self.request.user)

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
