import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
});

// Always attach the latest token from localStorage.
// This prevents 401s caused by timing between login state updates and requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uas_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

