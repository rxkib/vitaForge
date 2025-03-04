# vitaforge/backend/api/views.py
from django.contrib.auth.models import User
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import HealthProfile
from .serializers import UserSerializer, HealthProfileSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.timezone import now



class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            # Add other fields as needed
        })
    

class WeightHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Returns the last 7 entries (or all, based on your preference) of the user's weight history.
        """
        profile = HealthProfile.objects.get(user=request.user)
        # Return entire history, or slice the last 7
        data = profile.weight_history[-7:]
        return Response(data)

    def post(self, request):
        """
        Adds a new weight entry (weight + date) to the user's profile history.
        """
        profile = HealthProfile.objects.get(user=request.user)
        new_weight = request.data.get("weight")
        if new_weight is None:
            return Response({"error": "Weight is required"}, status=400)

        entry = {
            "date": now().strftime("%Y-%m-%d"),
            "weight": float(new_weight),
        }
        updated_history = profile.weight_history
        updated_history.append(entry)
        profile.weight_history = updated_history

        # Update the dedicated weight field so BMI can be computed easily
        profile.weight = float(new_weight)
        profile.save()

        return Response(profile.weight_history[-7:])




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

        # 1) Create the HealthProfile
        profile = serializer.save(user=self.request.user, **condition_data)

        # 2) Append initial weight to weight_history if it's not empty already.
        #    Make sure profile.weight is actually set by your serializer.
        if not profile.weight_history:  # or if len(profile.weight_history) == 0
            profile.weight_history = []

        # Add the initial entry (date + weight)
        profile.weight_history.append({
            "date": now().strftime("%Y-%m-%d"),
            "weight": float(profile.weight),
        })
        profile.save()  # re-save to persist the updated history


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
