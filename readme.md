# 🚀 Real-Time Productivity & Chat Application

## Overview
This isn't just another chat application. It's a comprehensive communication platform designed to bridge the gap between casual messaging and professional collaboration. Built to solve the fragmentation between WhatsApp for chats and Trello/Notion for work, this app integrates powerful productivity tools directly into your conversations.

## ✨ Core Features

### 💬 Messaging Experience
*   **Real-time Messaging:** Instant text and image sharing.
*   **WhatsApp-Style Message Ticks:** 4-tier real-time message status tracking (Sending, Sent, Delivered, Read) with optimistic UI updates.
*   **Live Typing Indicators:** WhatsApp-style typing indicators with intelligent debounce and zero UI flickering.
*   **Swipe-to-Reply:** Native-feeling touch swipe gestures on mobile and desktop to instantly reply to specific messages.
*   **User Blocking & Privacy:** Robust privacy settings allowing users to block/unblock others, preventing unwanted communications.

### 💼 Productivity Suite
*   **Kanban Boards:** Manage tasks with drag-and-drop ease inside any chat.
*   **Collaborative Notes:** Real-time shared text editors for brainstorming.
*   **Polls:** Quick consensus gathering for groups with real-time percentage updates.
*   **Scheduled Messages:** Queue messages to be sent later using automated scheduling.

### 🌐 Connectivity
*   **Groups & Friends:** Create unlimited groups, manage admins, and add friends effortlessly.
*   **Smart Notifications:** Web Push notifications that work even when the tab is closed.
*   **Online/Offline Presence:** See who is currently active in real-time.

---

## 💎 Free vs Pro Tiers

### 🌟 Free (The Standard Experience)
Everything you need to connect and collaborate.
*   Unlimited text and image messages
*   Groups and Friends system
*   Kanban boards, Notes, and Polls
*   Dark/Light/Custom Theme selection (SaaS-styled UI)

### 👑 Pro (The Power User Experience)
*Requires a Razorpay subscription.*
*   **Crystal Clear Calls:** Unlimited one-on-one **Voice & Video calling** powered by WebRTC.
*   **Status Updates (Stories):** Share 24-hour disappearing text/image/video statuses. Includes a real-time viewers list tracking exactly who viewed your status (with a built-in 2-second engagement timer).
*   **Exclusive Badge:** Stand out with a shimmering **Pro Badge** on your profile and in chats.
*   **Advanced Features:** Priority support and more to come.

---

## 🛠️ Tech Stack
Built utilizing the **MERN** stack for absolute flexibility, paired with **Socket.io** for real-time magic, and **Razorpay** for secure payments.

*   **Frontend:** React (Vite), Zustand (State Management), TailwindCSS + DaisyUI, GSAP (Animations).
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB (Data) + Redis (Caching/Performance).
*   **Real-time:** Socket.io (Signaling, Ticks, Typing, Presence), WebRTC (Peer-to-Peer video/audio streaming).
*   **Storage:** Cloudinary (Images/Videos).
*   **Payments:** Razorpay (Secure subscription handling and webhook validation).

---

## 🚀 How to Run Locally

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
    # CLOUDINARY_CLOUD_NAME=...
    # CLOUDINARY_API_KEY=...
    # CLOUDINARY_API_SECRET=...
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

---

## 🏗️ Architecture Highlights
*   **Optimistic UI:** When you send a message, move a task, or update a setting, the UI updates instantly while the server processes it in the background for a native app feel.
*   **Responsive Mobile Layouts:** Specifically engineered to avoid browser address bar overlaps using dynamic viewport sizing (`dvh`) and scrollable portal menus.
*   **Redis Caching:** Status updates and other high-frequency data are cached for lightning-fast access.
*   **Socket Deduplication:** Custom logic prevents "double message" bugs, ensuring reliable delivery.
*   **Secure Payments:** Full backend validation of Razorpay signatures to prevent fraud.

---
*Built with passion by Kishlay*
