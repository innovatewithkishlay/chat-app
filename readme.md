# Real-Time Productivity Chat Application

## Overview
This isn't just another chat application. It's a comprehensive communication platform designed to bridge the gap between casual messaging and professional collaboration. Built from the ground up to solve the fragmentation I felt when switching between WhatsApp for chats and Trello/Notion for work, this app integrates powerful productivity tools directly into your conversations.

## Why This App Stands Out
Most chat apps stop at text and images. I wanted to push the boundaries of what a "web app" can do without relying on heavy external enterprise software.
-   **It’s a Hybrid:** You can video call a friend, move a task on a Kanban board, and edit a shared note—all in the same window.
-   **Premium Experience:** I focused heavily on the "feel" of the app. It uses glassmorphism, smooth GSAP animations, and optimistic UI updates so it feels native, not like a website.
-   **Privacy & Resilience:** Features like "Ghost Mode" (ephemeral messaging) and robust connection handling (it recovers gracefully if you lose internet) show a depth of engineering often missed in MVPs.

## Key Features
*   **Real-time Messaging:** Instant delivery with typing indicators, read receipts, and online status using Socket.io.
*   **Crystal Clear Calls:** One-on-one Voice and Video calling powered by WebRTC. Includes screen sharing and call history.
*   **Productivity Suite:**
    *   **Kanban Boards:** Drag-and-drop task management within chats.
    *   **Collaborative Notes:** Real-time shared text editors.
    *   **Polls:** Quick consensus gathering for groups.
*   **Scheduled Messages:** Queue messages to be sent later (perfect for cross-timezone teams).
*   **Rich Media:** Image sharing with optimized storage via Cloudinary.
*   **Smart Notifications:** Web Push notifications that work even when the tab is closed.

## Tech Stack
I chose the **MERN** stack for its flexibility and JSON-native nature, paired with **Socket.io** for the real-time heavy lifting.

*   **Frontend:** React (Vite), Zustand (for complex state management like active calls), TailwindCSS + DaisyUI (for the UI system).
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB (with complex aggregations for chat history and search).
*   **Real-time:** Socket.io (Signaling & Events), WebRTC (Peer-to-Peer streaming).
*   **Storage:** Cloudinary.

## How to Run Locally

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas URL)
*   Cloudinary Account

### Steps
1.  **Clone the repository**
2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    cp .env.example .env # Add your MONGO_URI, JWT_SECRET, CLOUDINARY credentials
    npm run dev
    ```
3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    # Create .env and add VITE_API_BASE_URL=http://localhost:5001
    npm run dev
    ```
4.  Open your browser to `http://localhost:5173`.

## Architecture Highlights
*   **Optimistic UI:** When you send a message or move a task, the UI updates instantly while the server processes it in the background. If it fails, it rolls back gracefully.
*   **Socket Deduplication:** I implemented custom logic to prevent "double message" bugs common in socket apps, ensuring reliable delivery even on spotty networks.
*   **Security:** HttpOnly cookies for JWT execution and secure peer negotiation for calls.

---
*Built with passion by [Your Name]*
