import axios from "axios";
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5100/api",
  withCredentials: true,
});
