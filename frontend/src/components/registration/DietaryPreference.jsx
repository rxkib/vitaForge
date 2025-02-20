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
    <form onSubmit={handleNext} className="form-container">
      <h1>Dietary Preference</h1>
      <select
        className="form-input"
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
      <div>
        <button type="button" onClick={prevStep}>
          Back
        </button>
        <button type="submit">Next</button>
      </div>
    </form>
  );
}

export default DietaryPreference;
