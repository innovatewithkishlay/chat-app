# Toukii — Real-Time Chat & Team Productivity Platform

A MERN + Socket.io chat application that goes beyond messaging: 1-1 and group chat sit alongside per-conversation Kanban boards, shared notes, polls, and scheduled messages, so a team doesn't have to bounce between a chat app and a separate task tool.

## Features

**Messaging**
- 1-1 and group chat with image sharing, replies, edits, reactions, and delete-for-me / delete-for-everyone
- Delivery pipeline with sending → sent → delivered → read states, driven by Socket.io
- Typing indicators, online presence, and optimistic UI on send
- In-chat message search, scoped to the open conversation or group
- Star any message and browse everything you've starred across every chat in one place
- "Last seen" timestamp when a contact is offline, not just an Online/Offline flag
- User blocking and per-conversation "memory" notes (pinned context tied to a message)

**Productivity, scoped to a conversation**
- Kanban boards with drag-and-drop tasks (`@hello-pangea/dnd`)
- Collaborative notes with version history
- Polls with live vote counts
- Scheduled messages, delivered by a background job
- Reminders on individual messages

**Groups & social graph**
- Groups with admin roles, promote/dismiss, and add/remove members
- Friend requests and a talk-request flow for starting new conversations

**Account**
- Email/password auth with rate-limited login and a full forgot/reset password flow (emailed reset link, 30-minute expiry, single use)

**Pro tier** (Razorpay subscription)
- 1-1 voice and video calling over WebRTC, signaled through Socket.io — busy detection, a 45s no-answer timeout, and a brief "call ended" recap screen (with duration) instead of the call just vanishing
- 24-hour disappearing statuses with a viewer list
- Web Push notifications for offline users

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 18 (Vite), Zustand, Tailwind CSS + DaisyUI, GSAP |
| Backend | Node.js, Express, Mongoose |
| Real-time | Socket.io (chat, presence, typing, WebRTC signaling) |
| Data | MongoDB, Redis (status feed caching, login/reset-request rate limiting) |
| Media | Cloudinary |
| Payments | Razorpay, with server-side signature verification |
| Email | Nodemailer (password reset), any SMTP provider |

## Architecture notes

A few decisions that shaped the backend, documented in more detail in [`docs/chat-architecture.md`](docs/chat-architecture.md):

- **Conversations, not user lists.** The sidebar is driven by a `Conversation` document (participants, last message, per-user unread count) rather than a static contact list, so it can be sorted by recency and updated in place over sockets.
- **Room-scoped productivity events.** Kanban/notes/polls broadcast to a Socket.io room keyed by the conversation (or group) id. Clients join that room when they open the relevant panel and leave it when they switch chats, so updates only reach people actually looking at that conversation.
- **Authorization checks live in the controllers.** Every productivity and reminder endpoint verifies the requester is a participant/member of the underlying conversation or group before reading or mutating anything — this was tightened up during a security pass (see below).
- **Payment verification is server-side only.** The client never sets subscription state directly; `/api/payment/verify-payment` recomputes the Razorpay HMAC signature and checks the payment id hasn't already been applied before granting Pro.
- **Calls track "busy" state server-side.** The signaling layer keeps an in-memory map of who's currently on a call so a second incoming call is rejected as busy instead of ringing forever, and a peer's socket disconnecting mid-call ends the session on the other side rather than leaving it hanging.
- **Route-level code splitting.** Everything past the login/signup screen (chat UI, the productivity suite, WebRTC call components) is lazy-loaded, so an unauthenticated visitor's first paint doesn't wait on code they haven't reached yet.
- **ICE servers come from the backend, not a hardcoded frontend list.** `GET /api/video-call/ice-servers` builds the list from env config, so a TURN provider can be added without a frontend deploy — see `TURN_URLS`/`TURN_USERNAME`/`TURN_CREDENTIAL` below.
- **Password reset tokens are never stored in plaintext.** `forgotPassword` generates a random token, emails the raw value, and stores only its SHA-256 hash with a 30-minute expiry; `resetPassword` re-hashes the submitted token to look it up. The endpoint also responds identically whether or not the email is registered, so it can't be used to enumerate accounts.
- **Redis is configured to fail fast, not hang.** By default ioredis queues commands while disconnected and waits for reconnection, which meant a Redis outage silently turned every login/rate-limit check into a multi-second (sometimes much longer) hang instead of degrading gracefully. `enableOfflineQueue: false` plus a bounded `connectTimeout` make a Redis-touching request fail in milliseconds instead, so the app stays responsive if Redis is unreachable.
- **A remote autoplay block doesn't fail silently.** Mobile browsers (Safari especially) often block autoplay of the remote call stream if it's not tightly coupled to a user gesture — the call connects but the other person is silent with no visible error. The call UI explicitly calls `.play()`, catches the rejection, and shows a one-tap "enable audio" prompt instead of leaving the user wondering why they can't hear anything.

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
- No TURN server is configured out of the box, so calls between peers on restrictive/symmetric NATs may fail to connect until `TURN_URLS`/`TURN_USERNAME`/`TURN_CREDENTIAL` are set (see `.env.example`).
- Password reset emails require SMTP credentials; without them the reset link is logged to the server console instead, which is fine for local development but not for a real deployment.
- The single background `setInterval` in `index.js` handles both reminders and scheduled messages; it's fine for a single-instance deployment but would need to move to a proper job queue (e.g. BullMQ) to run safely across multiple server instances.
- The hosted demo runs on a free Render web service, which spins down after a period of inactivity — the first request after idle time pays a cold-start cost (both the API waking up and MongoDB/Redis reconnecting) before the page renders. This is a hosting-tier characteristic, not an application bug; an always-on instance (or a separate static host for the frontend) removes it.

## License

MIT
