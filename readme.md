# Toukii — Real-Time Chat & Team Productivity Platform

A MERN + Socket.io chat application that goes beyond messaging: 1-1 and group chat sit alongside per-conversation Kanban boards, shared notes, polls, and scheduled messages, so a team doesn't have to bounce between a chat app and a separate task tool.

## Features

**Messaging**
- 1-1 and group chat with image sharing, replies, edits, reactions, and delete-for-me / delete-for-everyone
- Delivery pipeline with sending → sent → delivered → read states, driven by Socket.io
- Typing indicators, online presence, and optimistic UI on send
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

**Pro tier** (Razorpay subscription)
- 1-1 voice and video calling over WebRTC, signaled through Socket.io
- 24-hour disappearing statuses with a viewer list
- Web Push notifications for offline users

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 18 (Vite), Zustand, Tailwind CSS + DaisyUI, GSAP |
| Backend | Node.js, Express, Mongoose |
| Real-time | Socket.io (chat, presence, typing, WebRTC signaling) |
| Data | MongoDB, Redis (caching / ephemeral state) |
| Media | Cloudinary |
| Payments | Razorpay, with server-side signature verification |

## Architecture notes

A few decisions that shaped the backend, documented in more detail in [`docs/chat-architecture.md`](docs/chat-architecture.md):

- **Conversations, not user lists.** The sidebar is driven by a `Conversation` document (participants, last message, per-user unread count) rather than a static contact list, so it can be sorted by recency and updated in place over sockets.
- **Room-scoped productivity events.** Kanban/notes/polls broadcast to a Socket.io room keyed by the conversation (or group) id. Clients join that room when they open the relevant panel and leave it when they switch chats, so updates only reach people actually looking at that conversation.
- **Authorization checks live in the controllers.** Every productivity and reminder endpoint verifies the requester is a participant/member of the underlying conversation or group before reading or mutating anything — this was tightened up during a security pass (see below).
- **Payment verification is server-side only.** The client never sets subscription state directly; `/api/payment/verify-payment` recomputes the Razorpay HMAC signature and checks the payment id hasn't already been applied before granting Pro.

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

The frontend runs on `http://localhost:5173` by default and expects the backend at `http://localhost:5001`.

## Known limitations

- No automated test suite yet — changes are currently verified manually and with `npm run lint`.
- WebRTC calls use public STUN servers only; there's no TURN fallback, so calls between peers on restrictive NATs may fail to connect.
- The single background `setInterval` in `index.js` handles both reminders and scheduled messages; it's fine for a single-instance deployment but would need to move to a proper job queue (e.g. BullMQ) to run safely across multiple server instances.

## License

MIT
