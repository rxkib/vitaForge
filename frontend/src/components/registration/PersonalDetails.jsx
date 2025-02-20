// src/components/registration/PersonalDetails.jsx
import React, { useState } from "react";

function PersonalDetails({ formData, updateFormData, nextStep, prevStep }) {
  const [age, setAge] = useState(formData.age);
  const [height, setHeight] = useState(formData.height);
  const [weight, setWeight] = useState(formData.weight);

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({ age, height, weight });
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="form-container">
      <h1>Personal Details</h1>
      <input
        className="form-input"
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Age"
        required
      />
      <input
        className="form-input"
        type="number"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
        placeholder="Height (cm)"
        required
      />
      <input
        className="form-input"
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Weight (kg)"
        required
      />
      <div>
        <button type="button" onClick={prevStep}>
          Back
        </button>
        <button type="submit">Next</button>
      </div>
    </form>
  );
}

export default PersonalDetails;
