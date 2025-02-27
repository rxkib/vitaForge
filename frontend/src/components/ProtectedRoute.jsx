// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { authState } = useContext(AuthContext);

  // While the app is determining if a user is authenticated (loading = true),
  // show a loading indicator.
  if (authState.loading) {
    return <div>Verifying your fitness profile...</div>;
  }

  // If the user is authenticated, render the protected content (children).
  // Otherwise, redirect to the login page.
  return authState.isAuthenticated ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
