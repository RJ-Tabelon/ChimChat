# ChimChat

A simple, modern real‑time chat app with a calm sage‑green theme. The backend is Express + Socket.IO, and the frontend is plain HTML/CSS/JS.

![ChimChat UI](./ui-ux.png)

## Overview

- Realtime messaging with Socket.IO
- Clean, responsive UI with a sage theme
- Name persistence (stored in localStorage)
- Send on Enter, auto-scroll, self/other bubbles
- No connection status dots or timestamps (by design)

## Project structure

```
ChimChat/
├── backend/
│   ├── index.js          # Express + Socket.IO server
│   ├── package.json      # Backend dependencies
│   └── .gitignore        # Node-related ignores
└── frontend/
    ├── index.html        # App shell and layout
    ├── styles.css        # Sage-themed design
    └── chat.js           # Client Socket.IO + UI logic
```

## Requirements

- Node.js 18+ recommended

## Run locally (localhost)

1. Install and start the backend

   ```bash
   cd backend
   npm install
   node index.js
   ```

   The server listens on http://localhost:3000

2. Point the frontend to localhost (recommended for local dev)

   - In `frontend/chat.js`, ensure the socket line is:
     ```js
     const socket = io('http://localhost:3000');
     ```

3. Open the app
   - Visit http://localhost:3000 in your browser (the server serves the `frontend` folder),
     or open `frontend/index.html` directly in your browser.

## Using ngrok (optional)

If you want to test from a phone or share the app externally:

1. Start the backend (see above)
2. In a new terminal, run:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL from ngrok (e.g., `https://your-subdomain.ngrok-free.app`)
4. Update the socket URL in `frontend/chat.js` to the ngrok URL:
   ```js
   const socket = io('https://your-subdomain.ngrok-free.app');
   ```
