// src/api.js
import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

// Always use a _relative_ base so Vite can proxy /api → 127.0.0.1:8000
const api = axios.create({
  baseURL: "",   // <— empty means “same origin” → Vite proxy
});

api.interceptors.request.use((config) => {
  // open endpoints
  const open = ["/api/user/register/", "/api/token/"];
  if (open.some((e) => config.url?.startsWith(e))) {
    return config;
  }
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
