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
    <form onSubmit={handleNext} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Age</span>
        </label>
        <input
          type="number"
          placeholder="Enter your age"
          className="input input-bordered w-full"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Height (cm)</span>
        </label>
        <input
          type="number"
          placeholder="Enter your height in cm"
          className="input input-bordered w-full"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Weight (kg)</span>
        </label>
        <input
          type="number"
          placeholder="Enter your weight in kg"
          className="input input-bordered w-full"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
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

export default PersonalDetails;
