# vitaforge/backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import HealthProfile
from .models import DailyLog
from .models import MealPlan
from .models import Feedback

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)

    class Meta:
        model = User
        # We'll accept "email" from the frontend and then set it as "username" and "email" in the database.
        fields = ["id", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Pop the email field and use it as both username and email.
        email = validated_data.pop("email")
        validated_data["username"] = email
        validated_data["email"] = email  # <--- Ensure email gets saved!
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

class HealthProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthProfile
        fields = [
            "id", "age", "height", "weight", "health_conditions",
            "dietary_preference", "created_at", "user"
        ]
        extra_kwargs = {"user": {"read_only": True}}

    def create(self, validated_data):
        # Remove any legacy keys if present
        for key in ['diabetes', 'hypertension', 'heart_disease', 'high_cholesterol', 'arthritis']:
            validated_data.pop(key, None)
        
        # If health_conditions is provided as a list, join it into a string.
        conditions = validated_data.get("health_conditions")
        if isinstance(conditions, list):
            validated_data["health_conditions"] = ", ".join(conditions)
        return super().create(validated_data)

class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = ["date", "status"]


class MealPlanSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = MealPlan
        fields = ["id", "plan", "daily_targets", "created_at", "user_id"]

    def get_user_id(self, obj):
        return obj.user.id if obj.user else None


# Custom recursive field for nested replies.
class RecursiveField(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data

class FeedbackSerializer(serializers.ModelSerializer):
    # Make sure 'parent' is writable.
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Feedback.objects.all(), allow_null=True, required=False
    )
    replies = RecursiveField(many=True, read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %I:%M %p", read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'message', 'created_at', 'parent', 'replies']