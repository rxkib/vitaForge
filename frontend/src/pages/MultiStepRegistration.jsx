// src/pages/MultiStepRegistration.jsx
import React, { useState } from "react";
import BasicInfo from "../components/registration/BasicInfo";
import PersonalDetails from "../components/registration/PersonalDetails";
import DietaryPreference from "../components/registration/DietaryPreference";
import HealthConditions from "../components/registration/HealthConditions";
import { useNavigate } from "react-router-dom";
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
    healthConditions: [], // array to allow multiple selections
  });
  const navigate = useNavigate();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const updateFormData = (newData) => {
    setFormData((prevData) => ({ ...prevData, ...newData }));
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Register the user
      const userRes = await api.post("/api/user/register/", {
        email: formData.email, // backend uses email as username
        password: formData.password,
      });
      console.log("User registered:", userRes.data);

      // Step 2: Log the user in to obtain JWT tokens
      const loginRes = await api.post("/api/token/", {
        username: formData.email,
        password: formData.password,
      });
      localStorage.setItem(ACCESS_TOKEN, loginRes.data.access);
      localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh);

      // Now Axios will attach the token via the interceptor.

      // Step 3: Create the Health Profile
      await api.post("/api/health-profile/", {
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        // If you want to keep the fitness_goal optional, you can send it or omit it.
        dietary_preference: formData.dietaryPreference,
        // Pass the health conditions array; backend's perform_create will map it to booleans.
        health_conditions: formData.healthConditions,
      });

      // Step 4: Redirect to Home page
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Registration failed: " +
          (error.response?.data?.detail || error.message)
      );
    }
  };

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
}

export default MultiStepRegistration;
