# Real-Time Productivity Chat Application

## Overview
This isn't just another chat application. It's a comprehensive communication platform designed to bridge the gap between casual messaging and professional collaboration. Built from the ground up to solve the fragmentation between WhatsApp for chats and Trello/Notion for work, this app integrates powerful productivity tools directly into your conversations.

## Why This App Stands Out
Most chat apps stop at text and images. I wanted to push the boundaries of what a "web app" can do without relying on heavy enterprise software.

-   **It’s a Hybrid:** You can video call a friend, move a task on a Kanban board, and edit a shared note—all in the same window.
-   **Premium Experience:** I focused heavily on the "feel" of the app. It uses glassmorphism, smooth GSAP animations, and optimistic UI updates so it feels native, not like a website.
-   **Privacy & Resilience:** Features like "Ghost Mode" and robust connection handling show a depth of engineering often missed in MVPs.

## Key Features: Free vs Pro

We believe in a powerful free tier, but for those who want the ultimate experience, **Pro** takes it to the next level.

### 🌟 Free (The Standard Experience)
Everything you need to connect and collaborate.
*   **Real-time Messaging:** Instant text, images, and emoji reactions with read receipts.
*   **Productivity Suite:**
    *   **Kanban Boards:** Manage tasks with drag-and-drop ease inside any chat.
    *   **Collaborative Notes:** Real-time shared text editors for brainstorming.
    *   **Polls:** Quick consensus gathering for groups.
*   **Scheduled Messages:** Queue messages to be sent later (perfect for cross-timezone teams).
*   **Groups & Friends:** Create unlimited groups and add friends effortlessly.
*   **Smart Notifications:** Web Push notifications that work even when the tab is closed.

### 👑 Pro (The Power User Experience)
Upgrade to unlock the full potential of connection.
*   **Crystal Clear Calls:** Unlimited one-on-one **Voice & Video calling** powered by WebRTC.
*   **Status Updates:** Share your daily moments with friends! Post text, images, or videos that disappear after 24 hours.
*   **Exclusive Badge:** Stand out with a shimmering **Pro Badge** on your profile and in chats.
*   **Priority Support:** (Coming Soon) Get your feature requests heard first.

---

## Tech Stack
I chose the **MERN** stack for its flexibility, paired with **Socket.io** for real-time magic and **Razorpay** for secure payments.

*   **Frontend:** React (Vite), Zustand (State Mgmt), TailwindCSS + DaisyUI.
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB (Data) + Redis (Caching/Performance).
*   **Real-time:** Socket.io (Signaling & Events), WebRTC (Peer-to-Peer streaming).
*   **Storage:** Cloudinary (Images/Videos).
*   **Payments:** Razorpay (Secure subscription handling).

## How to Run Locally

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas URL)
*   Redis (Local or Cloud URL)
*   Cloudinary Account
*   Razorpay Test Account

### Steps
1.  **Clone the repository**
2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    # Create .env with:
    # MONGODB_URI=...
    # JWT_SECRET=...
    # CLOUDINARY_...
    # RAZORPAY_KEY_ID=... & RAZORPAY_KEY_SECRET=...
    # REDIS_URL=...
    npm run dev
    ```
3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    # Create .env with VITE_API_BASE_URL=http://localhost:5001
    npm run dev
    ```
4.  Open your browser to `http://localhost:5173`.

## Architecture Highlights
*   **Optimistic UI:** When you send a message or move a task, the UI updates instantly while the server processes it.
*   **Redis Caching:** Status updates and other high-frequency data are cached for lightning-fast access.
*   **Socket Deduplication:** Custom logic prevents "double message" bugs, ensuring reliable delivery.
*   **Secure Payments:** Full backend validation of Razorpay signatures to prevent fraud.

---
*Built with passion by [Your Name]*
