# Chat App

A simple chat application built with Node.js, Express, and Socket.IO, allowing users to connect and communicate in real-time.

## Preview

<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
  <div style="text-align: center;">
    <img src="chat.png" alt="Chat Interface" width="300" />
    <p><b>Chat Interface</b></p>
  </div>
  <div style="text-align: center;">
    <img src="profile.png" alt="Profile Page" width="300" />
    <p><b>Profile Page</b></p>
  </div>
  <div style="text-align: center;">
    <img src="setting.png" alt="Settings Page" width="300" />
    <p><b>Settings Page</b></p>
  </div>
</div>

## Features

- **User Authentication**: Secure authentication using `bcryptjs` and `jsonwebtoken`.
- **Real-time Communication**: Powered by `socket.io` for seamless chat experiences.
- **Cloudinary Integration**: Handle image uploads efficiently.
- **Environment Configuration**: Manage sensitive data securely with `dotenv`.
- **Cookie Management**: Easy cookie parsing using `cookie-parser`.
- **Database Integration**: Uses `mongoose` to connect to MongoDB for data persistence.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kishlay-kumar7/chat-app.git
   ```
