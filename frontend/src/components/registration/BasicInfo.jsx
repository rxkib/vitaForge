// src/components/registration/BasicInfo.jsx
import React, { useState } from "react";

export default function BasicInfo({
  formData,
  updateFormData,
  nextStep,
  regErrors = {},
  clearErrors = () => {},
}) {
  const [email, setEmail] = useState(formData.email);
  const [password, setPassword] = useState(formData.password);

  const onSubmit = (e) => {
    e.preventDefault();
    if (regErrors.email) return; // block progression while there’s an email error
    updateFormData({ email, password });
    nextStep();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          className={`input input-bordered w-full ${
            regErrors.email ? "input-error" : ""
          }`}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // only clear the backend error when the user actually types
            if (regErrors.email) {
              clearErrors();
            }
          }}
          required
        />
        {regErrors.email && (
          <p className="text-error text-sm mt-1">{regErrors.email[0]}</p>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Password</span>
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          className="input input-bordered w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!!regErrors.email}
        >
          Next
        </button>
      </div>
    </form>
  );
}
