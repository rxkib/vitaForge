// src/api.js

import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// Create an axios instance for the Fitness App API.
// Ensure that your environment variable VITE_API_URL is set to your backend's base URL,
// for example: VITE_API_URL=https://your-backend.herokuapp.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to attach the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle responses and errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: You can check if the response status is 401 (Unauthorized)
    // and handle token refresh or user logout accordingly.
    // if (error.response && error.response.status === 401) {
    //   // Handle token expiration here (e.g., trigger refresh token logic)
    // }
    return Promise.reject(error);
  }
);

export default api;
