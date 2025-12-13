# 🏗️ Chat Architecture & Real-Time Flow

## 1. High-Level Architecture

### Why Conversations?
Previously, the sidebar fetched a static list of **Users**. This prevented sorting by "last active" and showing message previews.
We introduced a **Conversation** model that aggregates:
- `participants`: Who is in the chat.
- `lastMessage`: Reference to the latest message (for preview).
- `unreadCount`: A Map tracking unread messages per user.
- `updatedAt`: Timestamp for sorting (WhatsApp-style).

### Real-Time Sidebar
The sidebar is no longer a passive list. It subscribes to `conversationUpdated` events.
- **On Send/Receive**: The conversation moves to the **TOP** of the list instantly.
- **State**: Managed via `useChatStore.conversations`. Updates are optimistic and immediate.

### Unread / Seen Logic
- **Unread**: Increments on the backend when a message is sent. Resets to `0` when the user opens the chat (`markMessagesAsSeen`).
- **Seen**: When a user opens a chat, a `messagesSeen` event is emitted. The sender listens to this to update message status (e.g., double blue ticks) in real-time.

---

## 2. Data Flows

### 📤 Send Message Flow
1. **User** types and hits send.
2. **Backend**:
   - Saves `Message`.
   - Finds or Creates `Conversation`.
   - Updates `lastMessage` and increments `unreadCount` for receiver.
   - Emits `newMessage` (for chat window).
   - Emits `conversationUpdated` (for sidebar).
3. **Sender UI**: Adds message to chat, moves conversation to top.
4. **Receiver UI**:
   - If chat open: Adds message, marks as seen immediately.
   - If chat closed: Updates sidebar (top), increments unread badge.

### 📥 Receive Message Flow
1. **Socket** receives `conversationUpdated`.
2. **Store**:
   - Removes old conversation entry.
   - Adds new conversation entry at `index 0`.
   - Updates unread badge (if not current chat).

### 🔄 Offline → Reconnect Flow
1. **User** is offline. Messages accumulate in DB.
2. **User** comes online (or refreshes).
3. **Socket** connects (`socket.on("connect")`).
4. **Store** calls `getConversations()`.
5. **Result**: Sidebar syncs with DB, showing all missed messages and correct unread counts.

---

## 3. Key Socket Events

| Event | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `newMessage` | Server → Client | `Message` object | Appends message to active chat window. |
| `conversationUpdated` | Server → Client | `Conversation` object | Updates sidebar (move to top, preview, unread). |
| `messagesSeen` | Server → Client | `{ conversationId }` | Marks messages as "seen" in sender's view. |
| `connect` | Client Event | N/A | Triggers `getConversations()` to sync state. |

---

## 4. Edge Cases Handled

- **First Message**: If no conversation exists, the backend creates one on-the-fly and emits `conversationUpdated`. The receiver sees the new user appear instantly at the top.
- **New User Signup**: No impact until they send/receive a message. Sidebar is conversation-driven, not user-list driven.
- **Offline Messages**: Handled via DB persistence + Reconnect Sync. No messages are lost.
- **Rapid Reconnects**: The `connect` listener ensures state is always eventually consistent with the server.

---

## 5. Why this works like WhatsApp
1. **Recency Sorting**: Most active chats are always at the top.
2. **Persistent Unread**: Unread counts survive refreshes.
3. **Live Feedback**: "Seen" status updates instantly for the sender.
4. **Zero Refresh**: The entire flow (send -> receive -> sort -> read) happens without a single page reload.
