// src/components/registration/HealthConditions.jsx
import React, { useState } from "react";

function HealthConditions({
  formData,
  updateFormData,
  prevStep,
  handleSubmit,
}) {
  const [conditions, setConditions] = useState(formData.healthConditions || []);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    // If the "none" option is toggled:
    if (value === "none") {
      if (checked) {
        // When "none" is selected, clear all other conditions.
        setConditions(["none"]);
      } else {
        // If "none" is unchecked, simply remove it.
        setConditions(conditions.filter((item) => item !== "none"));
      }
    } else {
      // For any other condition:
      let updatedConditions = [];
      if (checked) {
        // Add the condition, but also remove "none" if it was selected.
        updatedConditions = [
          ...conditions.filter((item) => item !== "none"),
          value,
        ];
      } else {
        // Remove the condition
        updatedConditions = conditions.filter((item) => item !== value);
      }
      setConditions(updatedConditions);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateFormData({ healthConditions: conditions });
    handleSubmit();
  };

  return (
    <form onSubmit={onSubmit} className="form-container">
      <h1>Select Health Conditions</h1>
      <div>
        <label>
          <input
            type="checkbox"
            value="diabetes"
            onChange={handleCheckboxChange}
          />
          Diabetes (Type 1 & 2)
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            value="hypertension"
            onChange={handleCheckboxChange}
          />
          Hypertension
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            value="heart_disease"
            onChange={handleCheckboxChange}
          />
          Heart Disease
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            value="high_cholesterol"
            onChange={handleCheckboxChange}
          />
          High Cholesterol
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            value="arthritis"
            onChange={handleCheckboxChange}
          />
          Arthritis
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" value="none" onChange={handleCheckboxChange} />
          None
        </label>
      </div>
      <div>
        <button type="button" onClick={prevStep}>
          Back
        </button>
        <button type="submit">Complete Registration</button>
      </div>
    </form>
  );
}

export default HealthConditions;
