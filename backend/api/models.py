# backend/api/models.py

from django.db import models
from django.contrib.auth.models import User

class HealthProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='health_profile'
    )
    age = models.PositiveIntegerField()
    height = models.FloatField(help_text="Height in centimeters")
    weight = models.FloatField(help_text="Weight in kilograms")

    # Store multiple conditions as a comma-separated string
    health_conditions = models.TextField(
        null=True, blank=True, 
        help_text="Comma-separated list of health conditions, e.g., diabetes, hypertension"
    )

    DIET_CHOICES = [
        ('vegan', 'Vegan'),
        ('gluten_free', 'Gluten Free'),
        ('vegetarian', 'Vegetarian'),
        ('non_vegetarian', 'Non-Vegetarian'),
    ]
    dietary_preference = models.CharField(
        max_length=20, choices=DIET_CHOICES, default='non_vegetarian'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # NEW FIELD FOR WEIGHT HISTORY
    weight_history = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Health Profile"
    

class DailyLog(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),  # Green tick
        ('missed', 'Missed'),        # Red cross
        ('none', 'None')             # Default state
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='none')

    class Meta:
        unique_together = ('user', 'date')  # One log per day

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.status}"
