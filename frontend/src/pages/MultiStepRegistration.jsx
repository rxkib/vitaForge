// src/pages/MultiStepRegistration.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BasicInfo from "../components/registration/BasicInfo";
import PersonalDetails from "../components/registration/PersonalDetails";
import DietaryPreference from "../components/registration/DietaryPreference";
import HealthConditions from "../components/registration/HealthConditions";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function MultiStepRegistration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    age: "",
    height: "",
    weight: "",
    dietaryPreference: "",
    healthConditions: [],
  });
  const navigate = useNavigate();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  const updateFormData = (newData) =>
    setFormData((prev) => ({ ...prev, ...newData }));

  const handleSubmit = async () => {
    try {
      // Register the user
      const userRes = await api.post("/api/user/register/", {
        email: formData.email,
        password: formData.password,
      });
      console.log("User registered:", userRes.data);

      // Log the user in to get tokens
      const loginRes = await api.post("/api/token/", {
        username: formData.email,
        password: formData.password,
      });
      localStorage.setItem(ACCESS_TOKEN, loginRes.data.access);
      localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh);

      // Create the Health Profile
      await api.post("/api/health-profile/", {
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        dietary_preference: formData.dietaryPreference,
        health_conditions: formData.healthConditions,
      });

      // Redirect to Home page
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Registration failed: " +
          (error.response?.data?.detail || error.message)
      );
    }
  };

  // Render the current step component
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <BasicInfo
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <PersonalDetails
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <DietaryPreference
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <HealthConditions
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-3xl font-bold text-center mb-6">
            Register for Fitness App
          </h2>

          {/* Steps indicator */}
          <ul className="steps mb-6">
            <li className={`step ${step >= 1 ? "step-primary" : ""}`}>
              Account
            </li>
            <li className={`step ${step >= 2 ? "step-primary" : ""}`}>
              Personal
            </li>
            <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Diet</li>
            <li className={`step ${step >= 4 ? "step-primary" : ""}`}>
              Health
            </li>
          </ul>

          {renderStep()}
        </div>
      </div>
    </div>
  );
}

export default MultiStepRegistration;
