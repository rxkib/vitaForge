# vitaforge/backend/api/models.py
from django.db import models
from django.contrib.auth.models import User

class HealthProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='health_profile')
    age = models.PositiveIntegerField()
    height = models.FloatField(help_text="Height in centimeters")
    weight = models.FloatField(help_text="Weight in kilograms")
   #fitness_goal = models.CharField(max_length=100, help_text="e.g., lose weight, gain muscle")
    diabetes = models.BooleanField(default=False)
    hypertension = models.BooleanField(default=False)
    heart_disease = models.BooleanField(default=False)
    high_cholesterol = models.BooleanField(default=False)
    arthritis = models.BooleanField(default=False)
    DIET_CHOICES = [
        ('vegan', 'Vegan'),
        ('gluten_free', 'Gluten Free'),
        ('vegetarian', 'Vegetarian'),
        ('non_vegetarian', 'Non-Vegetarian'),
    ]
    dietary_preference = models.CharField(max_length=20, choices=DIET_CHOICES, default='non_vegetarian')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Health Profile"
