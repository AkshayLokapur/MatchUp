// src/api/axiosInstance.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const role = localStorage.getItem("current_role"); // 'user' or 'owner'
  let token = null;

  if (role === "owner") {
    token = localStorage.getItem("owner_token");
  } else {
    token = localStorage.getItem("token");
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
