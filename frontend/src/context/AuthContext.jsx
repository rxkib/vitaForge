import React, { createContext, useState, useEffect } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: true, // initially loading
  });

  // Load tokens from localStorage when the app starts
  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_TOKEN);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN);

    if (storedAccess && storedRefresh) {
      const decoded = decodeToken(storedAccess); // decode the token
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: true,
        accessToken: storedAccess,
        refreshToken: storedRefresh,
        user: decoded, // store the decoded claims
        loading: false,
      }));
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Helper function to decode token and get user info if needed
  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  };

  // Login function
  const login = async (username, password) => {
    const res = await api.post("/api/token/", { username, password });
    localStorage.setItem(ACCESS_TOKEN, res.data.access);
    localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

    const decoded = decodeToken(res.data.access);

    setAuthState({
      isAuthenticated: true,
      accessToken: res.data.access,
      refreshToken: res.data.refresh,
      user: decoded, // or fetch user details from your backend if needed
    });
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setAuthState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  };

  // Refresh token logic
  const refreshAccessToken = async () => {
    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: authState.refreshToken,
      });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      setAuthState((prev) => ({
        ...prev,
        accessToken: res.data.access,
        user: decodeToken(res.data.access),
      }));
    } catch (error) {
      console.error("Token refresh error:", error);
      logout(); // force logout if refresh fails
    }
  };

  const value = {
    authState,
    setAuthState,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
