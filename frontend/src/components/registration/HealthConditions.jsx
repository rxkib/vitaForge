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
    if (value === "none") {
      if (checked) {
        setConditions(["none"]);
      } else {
        setConditions(conditions.filter((item) => item !== "none"));
      }
    } else {
      let updatedConditions = [];
      if (checked) {
        updatedConditions = [
          ...conditions.filter((item) => item !== "none"),
          value,
        ];
      } else {
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
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-center">
        Select Health Conditions
      </h2>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">Diabetes (Type 1 & 2)</span>
          <input
            type="checkbox"
            value="diabetes"
            className="checkbox checkbox-primary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">Hypertension</span>
          <input
            type="checkbox"
            value="hypertension"
            className="checkbox checkbox-primary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">Heart Disease</span>
          <input
            type="checkbox"
            value="heart_disease"
            className="checkbox checkbox-primary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">High Cholesterol</span>
          <input
            type="checkbox"
            value="high_cholesterol"
            className="checkbox checkbox-primary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">Arthritis</span>
          <input
            type="checkbox"
            value="arthritis"
            className="checkbox checkbox-primary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text">None</span>
          <input
            type="checkbox"
            value="none"
            className="checkbox checkbox-secondary"
            onChange={handleCheckboxChange}
          />
        </label>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-secondary">
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Complete Registration
        </button>
      </div>
    </form>
  );
}

export default HealthConditions;
