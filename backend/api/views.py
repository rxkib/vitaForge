# vitaforge/backend/api/views.py
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import HealthProfile
from .serializers import UserSerializer, HealthProfileSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.timezone import now
from .models import DailyLog
from .serializers import DailyLogSerializer


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


class DailyLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = DailyLog.objects.filter(user=request.user)
        serializer = DailyLogSerializer(logs, many=True)
        return Response(serializer.data)

    def post(self, request):
        date = request.data.get("date")
        status_val = request.data.get("status")
        if not date or status_val not in ['completed', 'missed', 'none']:
            return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)
        log, created = DailyLog.objects.update_or_create(
            user=request.user,
            date=date,
            defaults={"status": status_val}
        )
        return Response({
            "message": "Log updated", 
            "log": DailyLogSerializer(log).data
        })


class DailyLogRecapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, date_str):
        """
        Retrieve the daily log recap for a specific date (YYYY-MM-DD).
        Returns:
          - status from DailyLog,
          - weight from HealthProfile.weight_history (if available),
          - computed BMI using the user's height.
        """
        # Retrieve the daily log for the given date
        try:
            log = DailyLog.objects.get(user=request.user, date=date_str)
        except DailyLog.DoesNotExist:
            return Response({"error": "No log found for that date."}, status=status.HTTP_404_NOT_FOUND)
        
        # Retrieve the user's HealthProfile for weight and height data
        try:
            profile = HealthProfile.objects.get(user=request.user)
        except HealthProfile.DoesNotExist:
            return Response({"error": "No health profile found for the user."}, status=status.HTTP_404_NOT_FOUND)
        
        # Attempt to find the weight entry for the specified date
        weight = None
        for entry in profile.weight_history:
            if entry.get("date") == date_str:
                weight = entry.get("weight")
                break

        # Compute BMI if weight exists and height is valid
        bmi = None
        if weight is not None and profile.height:
            bmi = weight / ((profile.height / 100) ** 2)
        
        data = {
            "date": date_str,
            "status": log.status,
            "weight": weight,
            "bmi": round(bmi, 1) if bmi is not None else None,
        }
        return Response(data, status=status.HTTP_200_OK)



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
