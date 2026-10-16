import axios from "axios";

const isDev = import.meta.env.MODE === "development" || window.location.hostname === "localhost";
const apiBase = import.meta.env.VITE_API_BASE_URL || (isDev ? "http://localhost:5001" : "");
const baseURL = isDev ? `${apiBase}/api` : (apiBase ? `${apiBase}/api` : "/api");

export const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
});

// error.response is undefined for network failures and timeouts (e.g. while
// the Render instance is still cold-starting), so reading
// error.response.data.message directly throws inside the catch block and the
// user never sees any feedback.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    if (error?.response?.data?.message) return error.response.data.message;
    if (!error?.response) return "Can't reach the server. Check your connection and try again.";
    return fallback;
}
