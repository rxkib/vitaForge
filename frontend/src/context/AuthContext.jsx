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

  // Helper to decode JWT
  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  };

  // Logout function (clears tokens + state)
  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setAuthState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
    });
  };

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_TOKEN);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN);

    if (storedAccess && storedRefresh) {
      const decoded = decodeToken(storedAccess);

      api
        .get("/api/user/me/")
        .then((res) => {
          const userDetails = res.data;
          setAuthState({
            isAuthenticated: true,
            accessToken: storedAccess,
            refreshToken: storedRefresh,
            user: { ...decoded, ...userDetails },
            loading: false,
          });
        })
        .catch((err) => {
          console.error("Fetch user info error:", err);
          // **NEW**: on any failure, force logout to clear invalid tokens
          logout();
        });
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    const tokenRes = await api.post("/api/token/", { username, password });
    localStorage.setItem(ACCESS_TOKEN, tokenRes.data.access);
    localStorage.setItem(REFRESH_TOKEN, tokenRes.data.refresh);

    const decoded = decodeToken(tokenRes.data.access);
    const userDetailsRes = await api.get("/api/user/me/");
    setAuthState({
      isAuthenticated: true,
      accessToken: tokenRes.data.access,
      refreshToken: tokenRes.data.refresh,
      user: { ...decoded, ...userDetailsRes.data },
      loading: false,
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

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
