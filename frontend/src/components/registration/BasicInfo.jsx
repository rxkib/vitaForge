// src/components/registration/BasicInfo.jsx
import React, { useState } from "react";

function BasicInfo({ formData, updateFormData, nextStep }) {
  const [localEmail, setLocalEmail] = useState(formData.email);
  const [localPassword, setLocalPassword] = useState(formData.password);

  const handleNext = (e) => {
    e.preventDefault();
    updateFormData({ email: localEmail, password: localPassword });
    nextStep();
  };

  return (
    <form onSubmit={handleNext} className="form-container">
      <h1>Register for Fitness App</h1>
      <input
        className="form-input"
        type="email"
        value={localEmail}
        onChange={(e) => setLocalEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        className="form-input"
        type="password"
        value={localPassword}
        onChange={(e) => setLocalPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button className="form-button" type="submit">
        Next
      </button>
    </form>
  );
}

export default BasicInfo;
