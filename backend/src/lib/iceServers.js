// Builds the WebRTC ICE server list a client should use to set up a call.
// Two ways to configure a TURN relay (needed for calls between peers who
// can't reach each other directly - e.g. two phones on different mobile
// carriers, which is the common case that fails with STUN alone):
//
// 1. Metered.ca (METERED_DOMAIN + METERED_API_KEY) - their API returns a
//    short-lived, ready-to-use ICE server list (STUN + TURN) on every call,
//    so it's fetched here and cached briefly rather than hit on every
//    request.
// 2. A static TURN provider (TURN_URLS/TURN_USERNAME/TURN_CREDENTIAL) - for
//    Twilio, a self-hosted coturn, or anything else with fixed credentials.
//
// Falls back to public STUN-only servers if neither is configured - fine
// for most calls, but peers behind symmetric NATs need a real TURN relay.
const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

const METERED_CACHE_TTL_MS = 60 * 60 * 1000; // Metered's credentials are valid far longer than this; refresh hourly to stay safe.
let meteredCache = { servers: null, fetchedAt: 0 };

async function getMeteredIceServers() {
  const { METERED_DOMAIN, METERED_API_KEY } = process.env;
  if (!METERED_DOMAIN || !METERED_API_KEY) return null;

  const isFresh = meteredCache.servers && Date.now() - meteredCache.fetchedAt < METERED_CACHE_TTL_MS;
  if (isFresh) return meteredCache.servers;

  try {
    const res = await fetch(
      `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
    );
    if (!res.ok) throw new Error(`Metered API responded ${res.status}`);

    const servers = await res.json();
    if (!Array.isArray(servers) || !servers.length) throw new Error("Empty ICE server list");

    meteredCache = { servers, fetchedAt: Date.now() };
    return servers;
  } catch (error) {
    console.error("Failed to fetch Metered ICE servers, falling back:", error.message);
    return meteredCache.servers || null; // serve a stale cache over nothing, if we have one
  }
}

function getStaticTurnServer() {
  const turnUrls = (process.env.TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!turnUrls.length || !process.env.TURN_USERNAME || !process.env.TURN_CREDENTIAL) return null;

  return {
    urls: turnUrls,
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL,
  };
}

export async function getIceServers() {
  const meteredServers = await getMeteredIceServers();
  if (meteredServers) return meteredServers;

  const iceServers = [...STUN_SERVERS];
  const staticTurn = getStaticTurnServer();
  if (staticTurn) iceServers.push(staticTurn);

  return iceServers;
}
