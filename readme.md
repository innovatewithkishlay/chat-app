# Toukii

A real-time chat app built on the MERN stack, with Socket.io handling everything live — messages, typing, presence, WebRTC signaling for calls. The pitch is simple: most teams end up juggling a chat app for conversation and a separate tool for tasks. Toukii puts a lightweight Kanban board, shared notes, and polls directly inside each conversation, scoped to that chat, so the context never leaves the thread.

Live demo: https://touki.onrender.com (runs on Render's free tier — see [Known limitations](#known-limitations) for what that means for first-load time).

## Features

### Messaging
- 1-1 and group chat, with image sharing, swipe-to-reply, and double-click-to-reply
- Edit sent messages (15-minute window) and delete for yourself or for everyone
- Emoji reactions
- Four-stage delivery ticks — sending, sent, delivered, read — updated live over sockets
- Typing indicators and online presence, with a "last seen" timestamp once someone goes offline
- Search inside a conversation, with results highlighted and click-to-jump
- Star any message and pull up everything you've starred across every chat in one place
- A timeline scrubber for jumping to a date in a long conversation
- Per-conversation "memory" — pin a note against a specific message for later context
- Block/unblock users
- Mood status (e.g. "Focused", "Busy") shown next to your name, with an optional auto-expiry

### Groups
- Create groups, manage admins (promote/dismiss), add or remove members
- Edit group name, description, and avatar
- System messages for group events (member added, admin change, etc.)
- Leave a group cleanly, or have an admin remove you

### Friends
- Send/accept/reject talk requests to start a new conversation
- Search users by username

### Productivity, scoped to whichever chat you're in
- Kanban board with drag-and-drop tasks (built on `@hello-pangea/dnd`), auto-created per conversation
- Shared notes with version history
- Polls with live vote percentages
- Schedule a message to send later — a background job delivers it
- Set a reminder on any individual message

### Calls (Pro)
- 1-1 voice and video calling over WebRTC, signaled through Socket.io
- Busy detection — a second incoming call is rejected instead of ringing into nothing
- 45-second no-answer timeout instead of "Calling..." forever
- A brief "call ended" recap screen with duration, instead of the call view just disappearing
- Handles the mobile autoplay block some browsers apply to the remote stream — you get a one-tap "enable audio" prompt instead of silence with no explanation
- TURN relay support for callers behind restrictive/symmetric NATs (the common case for two phones on different mobile carriers), via Metered.ca or any static TURN provider — see `.env.example`
- Call history log

### Status (Pro)
- 24-hour disappearing text/image/video statuses
- Viewer list, with a short engagement timer before a view counts

### Account
- Email/password auth (signup restricted to a small allowlist of email domains)
- Login is rate-limited — 5 failed attempts locks it for 15 minutes
- Forgot/reset password: emailed link, 30-minute expiry, single use, and the endpoint responds the same way whether or not the email is registered so it can't be used to check who has an account
- Web Push notifications for offline users

### Pro subscription
- Razorpay checkout, with the payment signature re-verified server-side and checked against replay before granting access
- Daily image/video upload caps that scale by plan

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 18 (Vite), Zustand, Tailwind CSS + DaisyUI, GSAP |
| Backend | Node.js, Express, Mongoose |
| Real-time | Socket.io (chat, presence, typing, WebRTC signaling) |
| Data | MongoDB, Redis (status feed caching, login/reset-request rate limiting) |
| Media | Cloudinary |
| Payments | Razorpay |
| Email | Nodemailer over Gmail SMTP |

## A few implementation details worth knowing

The sidebar isn't driven by a plain user list — it's built on a `Conversation` document that tracks participants, the last message, and a per-user unread count, which is what lets it re-sort by recency and update in place as sockets fire. Kanban/notes/poll updates work the same way: each one broadcasts to a Socket.io room keyed by the conversation (or group) id, and clients join that room only while they have the relevant panel open, so updates don't get pushed to people who aren't looking at that conversation.

Every productivity and reminder endpoint checks that the requester is actually a participant of the conversation or group before it'll read or touch anything — that wasn't always true, and got tightened up during a security pass over the whole controller layer. The Razorpay flow got the same scrutiny: the client never sets subscription state directly, and `/api/payment/verify-payment` recomputes the HMAC signature itself and checks the payment id hasn't already been applied, so a captured request can't be replayed to keep extending Pro for free.

On the call side, the signaling layer keeps an in-memory map of who's currently on a call, which is how a second incoming call gets rejected as busy instead of just ringing forever with nobody able to explain why. If a peer's socket drops mid-call, the other side gets told the call ended rather than being left staring at a frozen stream. ICE servers are served from the backend (`GET /api/video-call/ice-servers`) instead of being hardcoded on the frontend, so a TURN provider can be wired in through env vars alone, no redeploy needed — `getIceServers()` fetches Metered.ca's short-lived TURN credentials on demand (cached for an hour) when `METERED_DOMAIN`/`METERED_API_KEY` are set, or falls back to a static TURN provider, or STUN-only if neither is configured.

Also worth calling out: the socket layer tracks each connected user by socket id, and on a flaky connection (any phone locking its screen or switching networks) the client reconnects with a new socket well before the server notices the old one died. The disconnect handler for that stale socket only tears down state if it's still the one on record for that user — otherwise a late stale disconnect would wipe out a connection that had already been correctly replaced, silently cutting the user off from live messages and presence updates until they manually reopened a chat.

Password reset tokens are never stored as plaintext — `forgotPassword` generates a random token, emails the raw value, and only keeps its SHA-256 hash server-side with a 30-minute expiry; `resetPassword` re-hashes whatever's submitted to look it up. Redis is configured with `enableOfflineQueue: false` and a bounded connect timeout, which matters more than it sounds like: without it, a Redis outage doesn't just disable rate limiting, it makes every login request queue silently and hang for a long time instead of failing fast. And the whole app past the login screen — the chat UI, the WebRTC call components, the productivity suite — is code-split, so an unauthenticated visitor's first paint doesn't wait on JavaScript they haven't reached yet.

More detail on the sidebar/conversation design specifically is in [`docs/chat-architecture.md`](docs/chat-architecture.md).

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or hosted)
- A Cloudinary account (image/video uploads)
- A Razorpay test account (Pro subscriptions)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB/Redis/Cloudinary/Razorpay/JWT values
npm run generate:vapid-keys   # optional, for push notifications — paste output into .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to the backend URL
npm run dev
```

The frontend runs on `http://localhost:5173` by default and calls the backend at whatever `VITE_API_BASE_URL` is set to (falls back to `http://localhost:5001` if unset) — make sure it matches the `PORT` your backend is actually running on.

## Known limitations

- No automated test suite yet — changes are currently verified manually and with `npm run lint`.
- No TURN server is configured out of the box, so calls between peers on restrictive/symmetric NATs may fail to connect until `METERED_DOMAIN`/`METERED_API_KEY` (or a static `TURN_URLS`/`TURN_USERNAME`/`TURN_CREDENTIAL`) are set.
- Password reset emails require `GMAIL_USER`/`GMAIL_APP_PASSWORD` (a Gmail App Password, not the account password); without them the reset link is logged to the server console instead, which is fine for local development but not for a real deployment. Gmail SMTP also caps daily send volume, which is fine at demo scale but not for production traffic.
- The single background `setInterval` in `index.js` handles both reminders and scheduled messages; fine for a single-instance deployment, but would need to move to a proper job queue (e.g. BullMQ) to run safely across multiple server instances.
- The hosted demo runs on a free Render web service, which spins down after a period of inactivity — the first request after idle time pays a cold-start cost (the API waking up, then MongoDB/Redis reconnecting) before the page renders. That's a hosting-tier characteristic, not an application bug; an always-on instance (or hosting the frontend separately as a static site) removes it.

## License

MIT
