// src/App.jsx
import React, { useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import MultiStepRegistration from "./pages/MultiStepRegistration";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, AuthContext } from "./context/AuthContext";

function Logout() {
  const { logout } = useContext(AuthContext);
  useEffect(() => {
    logout();
  }, [logout]);
  return <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Splash screen route */}
          <Route path="/" element={<SplashScreen />} />

          {/* Home route is now at /home */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<MultiStepRegistration />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
