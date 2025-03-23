// src/api.js
import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    // Endpoints that should be publicly accessible
    // (no token needed or might cause errors if token is invalid).
    const openEndpoints = ["/api/user/register/", "/api/token/"];

    // Check if the request URL includes any of these open endpoints
    if (openEndpoints.some((endpoint) => config.url.includes(endpoint))) {
      // Skip attaching token for these endpoints
      return config;
    }

    // Otherwise, attach token if it exists
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: handle 401 or other global errors here if needed
    return Promise.reject(error);
  }
);

export default api;
