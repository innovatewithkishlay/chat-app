import { axiosInstance } from "./axios";

const FALLBACK_ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
];

let cachedIceServers = null;

// Fetches the ICE server list (STUN + TURN, if the backend has TURN
// credentials configured) once per session and caches it. Falls back to
// public STUN servers if the request fails for any reason, so a call can
// still be attempted.
export async function getIceServers() {
    if (cachedIceServers) return cachedIceServers;

    try {
        const res = await axiosInstance.get("/video-call/ice-servers");
        cachedIceServers = res.data.iceServers?.length ? res.data.iceServers : FALLBACK_ICE_SERVERS;
    } catch {
        cachedIceServers = FALLBACK_ICE_SERVERS;
    }

    return cachedIceServers;
}
