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


class FoodItem(models.Model):
    # EXACT order matches your Excel columns:
    code = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    region = models.CharField(max_length=255, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)

    # If your Excel has "TRUE"/"FALSE" or 1/0 for Vegan, etc., use BooleanField.
    # If the cell has the word "Vegan"/"Not Vegan," you may need to parse it in the script.
    vegan = models.BooleanField(default=False)
    vegetarian = models.BooleanField(default=False)
    gluten_free = models.BooleanField(default=False)

    protein_g = models.FloatField(blank=True, null=True)
    total_fat_g = models.FloatField(blank=True, null=True)
    dietary_fibre_g = models.FloatField(blank=True, null=True)
    carbs_g = models.FloatField(blank=True, null=True)
    energy_kj = models.FloatField(blank=True, null=True)

    vitamin_b1_mg = models.FloatField(blank=True, null=True)
    vitamin_b2_mg = models.FloatField(blank=True, null=True)
    vitamin_b3_mg = models.FloatField(blank=True, null=True)
    vitamin_b5_mg = models.FloatField(blank=True, null=True)
    vitamin_b6_mg = models.FloatField(blank=True, null=True)
    vitamin_b7_ug = models.FloatField(blank=True, null=True)
    vitamin_b9_ug = models.FloatField(blank=True, null=True)
    vitamin_c_mg = models.FloatField(blank=True, null=True)

    retinol_ug = models.FloatField(blank=True, null=True)
    vitamin_d2_ug = models.FloatField(blank=True, null=True)
    vitamin_d3_ug = models.FloatField(blank=True, null=True)
    alpha_tocopherol_eq_mg = models.FloatField(blank=True, null=True)
    vitamin_k1_ug = models.FloatField(blank=True, null=True)
    vitamin_k2_ug = models.FloatField(blank=True, null=True)

    calcium_mg = models.FloatField(blank=True, null=True)
    chromium_mg = models.FloatField(blank=True, null=True)
    copper_mg = models.FloatField(blank=True, null=True)
    iron_mg = models.FloatField(blank=True, null=True)
    magnesium_mg = models.FloatField(blank=True, null=True)
    manganese_mg = models.FloatField(blank=True, null=True)
    molybdenum_mg = models.FloatField(blank=True, null=True)
    phophorous_mg = models.FloatField(blank=True, null=True)
    potassium_mg = models.FloatField(blank=True, null=True)
    selenium_ug = models.FloatField(blank=True, null=True)
    sodium_mg = models.FloatField(blank=True, null=True)
    zinc_mg = models.FloatField(blank=True, null=True)

    total_available_cho_g = models.FloatField(blank=True, null=True)
    total_free_sugars_g = models.FloatField(blank=True, null=True)
    lactose_content_g = models.FloatField(blank=True, null=True)  # "Lactose content (g/100) [g]"
    linoleic_mg = models.FloatField(blank=True, null=True)

    total_saturated_fatty_acids_mg = models.FloatField(blank=True, null=True)
    total_mono_unsat_fatty_acids_mg = models.FloatField(blank=True, null=True)
    total_poly_unsat_fatty_acids_mg = models.FloatField(blank=True, null=True)
    cholesterol_mg = models.FloatField(blank=True, null=True)

    histidine_g = models.FloatField(blank=True, null=True)
    isoleucine_g = models.FloatField(blank=True, null=True)
    leucine_g = models.FloatField(blank=True, null=True)  # spelled as "Luecine" in your list
    lysine_g = models.FloatField(blank=True, null=True)
    methionine_g = models.FloatField(blank=True, null=True)
    cysteine_g = models.FloatField(blank=True, null=True)
    phenylalanine_g = models.FloatField(blank=True, null=True)
    threonine_g = models.FloatField(blank=True, null=True)
    tryptophan_g = models.FloatField(blank=True, null=True)
    valine_g = models.FloatField(blank=True, null=True)

    total_saturated_fatty_acids_percent = models.FloatField(blank=True, null=True)
    total_mono_unsat_fatty_acids_percent = models.FloatField(blank=True, null=True)
    total_poly_unsat_fatty_acids_percent = models.FloatField(blank=True, null=True)

    def __str__(self):
        return self.name or "Unnamed Food"
    


class MealPlan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='meal_plan')
    plan = models.JSONField(help_text="Mapping of food names to portion sizes")
    daily_targets = models.JSONField(help_text="Daily nutritional targets used for the plan")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Meal Plan for {self.user.username} created at {self.created_at}"