// src/api.js
import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: apiBaseUrl,
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
