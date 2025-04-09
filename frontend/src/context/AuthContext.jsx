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
      const decoded = decodeToken(storedAccess);

      // If you also want to fetch user details on page reload:
      api
        .get("/api/user/me/")
        .then((res) => {
          const userDetails = res.data;
          const combinedUser = { ...decoded, ...userDetails };

          setAuthState({
            isAuthenticated: true,
            accessToken: storedAccess,
            refreshToken: storedRefresh,
            user: combinedUser,
            loading: false,
          });
        })
        .catch((err) => {
          console.error("Fetch user info error:", err);
          setAuthState((prev) => ({ ...prev, loading: false }));
        });
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
    // 1. Get tokens
    const tokenRes = await api.post("/api/token/", { username, password });
    localStorage.setItem(ACCESS_TOKEN, tokenRes.data.access);
    localStorage.setItem(REFRESH_TOKEN, tokenRes.data.refresh);

    // 2. Decode to get basic claims (like user_id, exp, etc.)
    const decoded = decodeToken(tokenRes.data.access);

    // 3. Fetch additional user info from /api/user/me/
    //    This endpoint should return { email, username, ... }
    const userDetailsRes = await api.get("/api/user/me/");
    const userDetails = userDetailsRes.data;

    // 4. Merge the decoded token data + userDetails
    const combinedUser = {
      ...decoded,
      ...userDetails,
    };

    // 5. Update authState
    setAuthState({
      isAuthenticated: true,
      accessToken: tokenRes.data.access,
      refreshToken: tokenRes.data.refresh,
      user: combinedUser,
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
      loading: false,
    });
  }

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
