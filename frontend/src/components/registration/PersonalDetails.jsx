import React, { useState } from "react";

function PersonalDetails({ formData, updateFormData, nextStep, prevStep }) {
  const [age, setAge] = useState(formData.age ?? "");
  const [height, setHeight] = useState(formData.height ?? "");
  const [weight, setWeight] = useState(formData.weight ?? "");
  const [errors, setErrors] = useState({ age: "", height: "", weight: "" });

  const handleNext = (e) => {
    e.preventDefault();
    const newErrors = {};
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      newErrors.age = "Age must be at least 18.";
    }
    const heightNum = parseFloat(height);
    if (isNaN(heightNum)) {
      newErrors.height = "Height is required.";
    } else if (heightNum < 100) {
      newErrors.height = "Height must be at least 100 cm.";
    } else if (heightNum > 250) {
      newErrors.height = "Height cannot exceed 250 cm.";
    }
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
      newErrors.weight = "Weight is required.";
    } else if (weightNum < 20) {
      newErrors.weight = "Weight must be at least 20 kg.";
    } else if (weightNum > 300) {
      newErrors.weight = "Weight cannot exceed 300 kg.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({ age: "", height: "", weight: "" });
    updateFormData({ age: ageNum, height: heightNum, weight: weightNum });
    nextStep();
  };

  const handleAgeChange = (e) => {
    setAge(e.target.value);
    if (errors.age) setErrors((prev) => ({ ...prev, age: "" }));
  };

  const handleHeightChange = (e) => {
    setHeight(e.target.value);
    if (errors.height) setErrors((prev) => ({ ...prev, height: "" }));
  };

  const handleWeightChange = (e) => {
    setWeight(e.target.value);
    if (errors.weight) setErrors((prev) => ({ ...prev, weight: "" }));
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
          className={`input input-bordered w-full ${errors.age ? "input-error" : ""}`}
          value={age}
          onChange={handleAgeChange}
          required
        />
        {errors.age && <p className="text-error text-sm mt-1">{errors.age}</p>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Height (cm)</span>
        </label>
        <input
          type="number"
          placeholder="Enter your height in cm"
          className={`input input-bordered w-full ${errors.height ? "input-error" : ""}`}
          value={height}
          onChange={handleHeightChange}
          required
        />
        {errors.height && <p className="text-error text-sm mt-1">{errors.height}</p>}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Weight (kg)</span>
        </label>
        <input
          type="number"
          placeholder="Enter your weight in kg"
          className={`input input-bordered w-full ${errors.weight ? "input-error" : ""}`}
          value={weight}
          onChange={handleWeightChange}
          required
        />
        {errors.weight && <p className="text-error text-sm mt-1">{errors.weight}</p>}
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