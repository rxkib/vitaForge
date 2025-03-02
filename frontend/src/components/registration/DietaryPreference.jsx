// src/components/registration/DietaryPreference.jsx
import React, { useState } from "react";

function DietaryPreference({ formData, updateFormData, nextStep, prevStep }) {
  const [diet, setDiet] = useState(formData.dietaryPreference);

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({ dietaryPreference: diet });
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <h2 className="text-xl font-bold text-center">Dietary Preference</h2>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Select your dietary preference</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
          required
        >
          <option value="">Select...</option>
          <option value="vegan">Vegan</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="gluten_free">Gluten-Free</option>
          <option value="non_vegetarian">Non-Vegetarian</option>
        </select>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Next
        </button>
      </div>
    </form>
  );
}

export default DietaryPreference;
