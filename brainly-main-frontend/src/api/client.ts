import axios from "axios";
import { BACKEND_URL } from "../config";

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
});

// Automatically attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Global response interceptor: redirect to /signin on expired or invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.message?.includes("token")) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/signin" && window.location.pathname !== "/signup") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

