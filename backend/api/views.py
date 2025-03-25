# backend/api/views.py
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import HealthProfile, DailyLog, FoodItem
from .serializers import UserSerializer, HealthProfileSerializer, DailyLogSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.timezone import now
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET
from django.shortcuts import get_object_or_404
import requests

from .constraints import (
    compute_calorie_target,
    get_diabetic_limits,
    DiabetesConstraints,
    get_hypertension_limits, 
    HypertensionConstraints,
    get_heart_disease_limits,
    HeartDiseaseConstraints,
    get_arthritis_limits,
    ArthritisConstraints,
    get_high_cholesterol_limits,
    HighCholesterolConstraints,
    get_general_limits,
    GeneralConstraints,
    CompositeConstraints
)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
        })


class WeightHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        profile = HealthProfile.objects.get(user=request.user)
        data = profile.weight_history[-7:]
        return Response(data)
    def post(self, request):
        profile = HealthProfile.objects.get(user=request.user)
        new_weight = request.data.get("weight")
        if new_weight is None:
            return Response({"error": "Weight is required"}, status=400)
        entry = {
            "date": now().strftime("%Y-%m-%d"),
            "weight": float(new_weight),
        }
        profile.weight_history.append(entry)
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
        try:
            log = DailyLog.objects.get(user=request.user, date=date_str)
        except DailyLog.DoesNotExist:
            return Response({"error": "No log found for that date."}, status=status.HTTP_404_NOT_FOUND)
        try:
            profile = HealthProfile.objects.get(user=request.user)
        except HealthProfile.DoesNotExist:
            return Response({"error": "No health profile found for the user."}, status=status.HTTP_404_NOT_FOUND)
        weight = next((entry.get("weight") for entry in profile.weight_history if entry.get("date") == date_str), None)
        bmi = weight / ((profile.height / 100) ** 2) if weight is not None and profile.height else None
        data = {
            "date": date_str,
            "status": log.status,
            "weight": weight,
            "bmi": round(bmi, 1) if bmi is not None else None,
        }
        return Response(data, status=status.HTTP_200_OK)


@require_GET
def proxy_exercises(request):
    target = request.GET.get('muscle', '').strip()
    name = request.GET.get('name', '').strip()
    category = request.GET.get('category', '').strip()
    difficulty = request.GET.get('difficulty', '').strip()
    force = request.GET.get('force', '').strip()
    external_url = "http://127.0.0.1:5000/exercises"
    params = {}
    if target:
        params['target'] = target
    if name:
        params['name'] = name
    if category:
        params['category'] = category
    if difficulty:
        params['difficulty'] = difficulty
    if force:
        params['force'] = force
    try:
        response = requests.get(external_url, params=params)
        response.raise_for_status()
        data = response.json()
        if target:
            data = [ex for ex in data if ex.get('target') and ex['target'].get('Primary') and target in ex['target']['Primary']]
        return JsonResponse(data, safe=False)
    except requests.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)


class HealthProfileView(generics.ListCreateAPIView):
    serializer_class = HealthProfileSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return HealthProfile.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        conditions = self.request.data.get("health_conditions", [])
        if "none" in conditions:
            condition_data = {"diabetes": False, "hypertension": False, "heart_disease": False, "high_cholesterol": False, "arthritis": False}
        else:
            condition_data = {
                "diabetes": "diabetes" in conditions,
                "hypertension": "hypertension" in conditions,
                "heart_disease": "heart_disease" in conditions,
                "high_cholesterol": "high_cholesterol" in conditions,
                "arthritis": "arthritis" in conditions,
            }
        profile = serializer.save(user=self.request.user, **condition_data)
        if not profile.weight_history:
            profile.weight_history = []
        profile.weight_history.append({
            "date": now().strftime("%Y-%m-%d"),
            "weight": float(profile.weight),
        })
        profile.save()


class HealthProfileDetail(generics.RetrieveUpdateAPIView):
    serializer_class = HealthProfileSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self):
        return HealthProfile.objects.get(user=self.request.user)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        goal = request.GET.get("goal", "maintain")
        selected_region = request.GET.get("region", None)
        # Allow override via query parameter "condition"
        if request.GET.get("condition"):
            conditions = [request.GET.get("condition").strip().lower()]
        elif HealthProfile.objects.filter(user=request.user).exists():
            profile = HealthProfile.objects.filter(user=request.user).first()
            conditions = [cond.strip().lower() for cond in profile.health_conditions.split(",")] if profile.health_conditions else []
        else:
            conditions = []

        profile = get_object_or_404(HealthProfile, user=request.user)
        age = profile.age
        height_cm = profile.height
        weight_kg = profile.weight

        daily_kcal = compute_calorie_target(age, height_cm, weight_kg, goal)
        diabetic_limits = get_diabetic_limits(daily_kcal)
        hypertension_limits = get_hypertension_limits(daily_kcal)
        heart_disease_limits = get_heart_disease_limits(daily_kcal)
        arthritis_limits = get_arthritis_limits(daily_kcal)
        high_cholesterol_limits = get_high_cholesterol_limits(daily_kcal)
        general_limits = get_general_limits(daily_kcal)

        constraints_list = []
        if "diabetes" in conditions:
            constraints_list.append(DiabetesConstraints(diabetic_limits, meals_per_day=3))
        if "hypertension" in conditions:
            constraints_list.append(HypertensionConstraints(hypertension_limits, meals_per_day=3))
        if "heart_disease" in conditions:
            constraints_list.append(HeartDiseaseConstraints(heart_disease_limits, meals_per_day=3))
        if "arthritis" in conditions:
            constraints_list.append(ArthritisConstraints(arthritis_limits, meals_per_day=3))
        if "high_cholesterol" in conditions:
            constraints_list.append(HighCholesterolConstraints(high_cholesterol_limits, meals_per_day=3))
        # If the user selects "none" or no condition is provided, use general constraints.
        if "none" in conditions or not conditions:
            constraints_list.append(GeneralConstraints(general_limits, meals_per_day=3))
        if not constraints_list:
            class NoConstraints:
                def food_score(self, food):
                    return 0
            constraints_list.append(NoConstraints())

        composite = CompositeConstraints(constraints_list)

        if selected_region:
            all_foods = FoodItem.objects.filter(region__in=[selected_region, "Both"])
        else:
            all_foods = FoodItem.objects.all()

        scored_list = [(food, composite.food_score(food)) for food in all_foods]
        scored_list.sort(key=lambda x: x[1], reverse=True)

        grouped_results = {}
        for food, score in scored_list:
            category = food.tags.split(",")[0].strip() if food.tags else "Uncategorized"
            food_data = {
                "food_id": food.id,
                "name": food.name,
                "score": round(score, 2),
                "protein_g": food.protein_g if food.protein_g is not None else "N/A",
                "total_fat_g": food.total_fat_g if food.total_fat_g is not None else "N/A",
                "carbs": food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or "N/A"),
                "total_free_sugars_g": food.total_free_sugars_g if food.total_free_sugars_g is not None else "N/A",
                "dietary_fibre_g": food.dietary_fibre_g if food.dietary_fibre_g is not None else "N/A",
                "total_saturated_fatty_acids_g": (food.total_saturated_fatty_acids_mg / 1000.0) if food.total_saturated_fatty_acids_mg is not None else "N/A",
                "cholesterol_mg": food.cholesterol_mg if food.cholesterol_mg is not None else "N/A",
                "sodium_mg": food.sodium_mg if food.sodium_mg is not None else "N/A",
                "potassium_mg": food.potassium_mg if food.potassium_mg is not None else "N/A",
                "linoleic_mg": food.linoleic_mg if food.linoleic_mg is not None else "N/A",
                "vitamin_b1_mg": food.vitamin_b1_mg if food.vitamin_b1_mg is not None else "N/A",
                "vitamin_b2_mg": food.vitamin_b2_mg if food.vitamin_b2_mg is not None else "N/A",
                "vitamin_b3_mg": food.vitamin_b3_mg if food.vitamin_b3_mg is not None else "N/A",
                "vitamin_b5_mg": food.vitamin_b5_mg if food.vitamin_b5_mg is not None else "N/A",
                "vitamin_b6_mg": food.vitamin_b6_mg if food.vitamin_b6_mg is not None else "N/A",
                "vitamin_b7_ug": food.vitamin_b7_ug if food.vitamin_b7_ug is not None else "N/A",
                "vitamin_b9_ug": food.vitamin_b9_ug if food.vitamin_b9_ug is not None else "N/A",
                "vitamin_c_mg": food.vitamin_c_mg if food.vitamin_c_mg is not None else "N/A",
                "retinol_ug": food.retinol_ug if food.retinol_ug is not None else "N/A",
                "vitamin_d2_ug": food.vitamin_d2_ug if food.vitamin_d2_ug is not None else "N/A",
                "vitamin_d3_ug": food.vitamin_d3_ug if food.vitamin_d3_ug is not None else "N/A",
                "alpha_tocopherol_eq_mg": food.alpha_tocopherol_eq_mg if food.alpha_tocopherol_eq_mg is not None else "N/A",
                "vitamin_k1_ug": food.vitamin_k1_ug if food.vitamin_k1_ug is not None else "N/A",
                "vitamin_k2_ug": food.vitamin_k2_ug if food.vitamin_k2_ug is not None else "N/A",
                "calcium_mg": food.calcium_mg if food.calcium_mg is not None else "N/A",
                "chromium_mg": food.chromium_mg if food.chromium_mg is not None else "N/A",
                "copper_mg": food.copper_mg if food.copper_mg is not None else "N/A",
                "iron_mg": food.iron_mg if food.iron_mg is not None else "N/A",
                "magnesium_mg": food.magnesium_mg if food.magnesium_mg is not None else "N/A",
                "manganese_mg": food.manganese_mg if food.manganese_mg is not None else "N/A",
                "molybdenum_mg": food.molybdenum_mg if food.molybdenum_mg is not None else "N/A",
                "phophorous_mg": food.phophorous_mg if food.phophorous_mg is not None else "N/A",
                "selenium_ug": food.selenium_ug if food.selenium_ug is not None else "N/A",
                "zinc_mg": food.zinc_mg if food.zinc_mg is not None else "N/A",
                "energy_kj": food.energy_kj if food.energy_kj is not None else "N/A",

            }
            grouped_results.setdefault(category, []).append(food_data)

        return Response({"recommended_foods": grouped_results})
