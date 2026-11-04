import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../auth/session";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

http.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default http;
