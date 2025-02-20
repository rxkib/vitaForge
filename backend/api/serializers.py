# vitaforge/backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import HealthProfile

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)

    class Meta:
        model = User
        # We'll accept "email" from the frontend and then set it as "username" in the database.
        fields = ["id", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Pop the email field and use it as the username
        email = validated_data.pop("email")
        validated_data["username"] = email
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

class HealthProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthProfile
        fields = [
            "id", "age", "height", "weight", "diabetes",
            "hypertension", "heart_disease", "high_cholesterol", "arthritis",
            "dietary_preference", "created_at", "user"
        ]
        extra_kwargs = {"user": {"read_only": True}}
