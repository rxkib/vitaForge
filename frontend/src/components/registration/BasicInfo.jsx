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
    <form onSubmit={handleNext} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          className="input input-bordered w-full"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Password</span>
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          className="input input-bordered w-full"
          value={localPassword}
          onChange={(e) => setLocalPassword(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          Next
        </button>
      </div>
    </form>
  );
}

export default BasicInfo;
