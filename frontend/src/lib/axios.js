import axios from "axios";

const isDev = import.meta.env.MODE === "development" || window.location.hostname === "localhost";
const baseURL = isDev
    ? "http://localhost:5001/api"
    : (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : "/api");

console.log("Axios Base URL:", baseURL);

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
});
