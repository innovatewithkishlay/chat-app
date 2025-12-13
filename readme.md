# Chatyify – Real-time Messaging Platform

A modern, real-time, WhatsApp-inspired chat application with premium UX and advanced real-time features.

## Tech Stack
- **Frontend**: React, Vite, Zustand, Tailwind, DaisyUI, GSAP
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Auth**: JWT
- **Realtime**: Socket.IO
- **Hosting**: Render (Backend)

## Features
- **Real-time 1-1 Chat**: Instant messaging with seamless performance.
- **Conversation-based Sidebar**: Organize chats efficiently.
- **Live Unread Counts**: Real-time updates for unread messages.
- **Message Status**: Visual indicators for Sent, Delivered, and Seen status.
- **Typing Indicators**: See when others are typing in real-time.
- **User Search**: Find users by their unique username.
- **Talk Request System**: Privacy-focused connection requests (Accept/Reject).
- **Friends System**: Manage your friend list easily.
- **Group Chats**:
  - Create and name groups.
  - Add/remove members.
  - Admin controls for group management.
- **Real-time Notifications**: Toast notifications for new messages and events.
- **Online / Last-seen Status**: Know when your contacts are active.
- **Premium UI**: Responsive design with glassmorphism and smooth GSAP animations.
- **Unique Features**:
  - **Contextual Chat Memory**: Save important details.
  - **Message Intent Labels**: Categorize messages (Important, Question, etc.).
  - **Message Reminders**: Set reminders for specific messages.
  - **Timeline Scrubber**: Navigate history by date.
  - **Mood Status Ring**: Visual mood indicators.
  - **Health Indicator**: Conversation analytics.

## Live Backend URL
[https://chatyify-backend.onrender.com](https://chatyify-backend.onrender.com)

## Setup Instructions

### Backend
The backend is already deployed and hosted on Render.

### Frontend
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Build for production:
    ```bash
    npm run build
    ```

## Environment Variables
The frontend uses `VITE_API_BASE_URL` to connect to the backend.

Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=https://chatyify-backend.onrender.com
```
