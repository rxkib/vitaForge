// src/pages/SplashScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import logo from "../assets/logo.png";

function SplashScreen() {
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger fade in
    setFadeIn(true);
    const timer = setTimeout(() => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-base-200 transition-opacity duration-1000 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Your logo */}
      <img src={logo} alt="VitaForge Logo" className="w-64 h-64" />
    </div>
  );
}

export default SplashScreen;
