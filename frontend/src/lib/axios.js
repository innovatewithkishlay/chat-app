import axios from "axios";

const isDev = import.meta.env.MODE === "development" || window.location.hostname === "localhost";
const apiBase = import.meta.env.VITE_API_BASE_URL || (isDev ? "http://localhost:5001" : "");
const baseURL = isDev ? `${apiBase}/api` : (apiBase ? `${apiBase}/api` : "/api");

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
});
