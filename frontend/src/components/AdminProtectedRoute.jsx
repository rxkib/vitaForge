// src/components/AdminProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function AdminProtectedRoute({ children }) {
  const { authState } = useContext(AuthContext);

  if (authState.loading) {
    return <div>Loading...</div>;
  }

  // Check if user is authenticated and is an admin (is_staff)
  if (!authState.isAuthenticated || !authState.user?.is_staff) {
    // If not admin, redirect to a normal user page or login
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
