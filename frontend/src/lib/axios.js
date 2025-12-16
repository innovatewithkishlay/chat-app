import axios from "axios";

const isDev = import.meta.env.MODE === "development" || window.location.hostname === "localhost";
const baseURL = isDev ? "http://localhost:5001/api" : "/api";

console.log("Axios Base URL:", baseURL);

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
});
