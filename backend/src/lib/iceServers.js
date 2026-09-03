// Builds the WebRTC ICE server list from environment config, so a TURN
// provider (Twilio Network Traversal, Metered.ca, a self-hosted coturn, etc.)
// can be plugged in without touching frontend code. Falls back to public
// STUN-only servers when no TURN credentials are configured - STUN alone is
// enough for most calls, but two peers behind symmetric NATs (common on
// mobile networks/corporate wifi) need a TURN relay to connect at all.
const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export function getIceServers() {
  const iceServers = [...STUN_SERVERS];

  const turnUrls = (process.env.TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (turnUrls.length && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    iceServers.push({
      urls: turnUrls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }

  return iceServers;
}
