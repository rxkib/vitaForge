// src/pages/Register.jsx
import React from "react";
import AuthForm from "../components/AuthForm";

function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <AuthForm route="/api/user/register/" method="register" />
        </div>
      </div>
    </div>
  );
}

export default Register;
