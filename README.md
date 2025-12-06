# ChimChat

A modern, real-time group chat application with AI capabilities, built with Express + Socket.IO and featuring a clean sage-green themed interface. ChimChat combines instant messaging with intelligent AI features like conversation summarization, context-aware Q&A, and IoT sensor data analysis.

![ChimChat UI](./ui-ux.png)

## 📋 Quick Summary

ChimChat is a real-time chat app that lets users communicate instantly in a shared group space. It integrates with Firebase Firestore for persistent message storage and includes AI-powered features powered by Ollama, toxicity filtering for safe messaging, and an intuitive, responsive UI with a calming sage-green color scheme. Messages are preserved between sessions, typing indicators provide feedback when AI is responding, and the app can be deployed locally or shared externally using ngrok.

## ✨ Features

### Core Chat Features

- **Real-time Messaging**: Instant message delivery to all connected users via Socket.IO
- **Message Persistence**: All messages stored in Firebase Firestore with automatic loading of recent conversation history (last 10 messages)
- **User Names**: Persistent username storage with localStorage, so users don't need to re-enter their name
- **Clean UI**: Message bubbles with distinct styling for self vs. other users, auto-scrolling chat display
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: ARIA labels and semantic HTML for screen reader support

### AI-Powered Commands

Trigger AI responses by sending special commands:

1. **`/summarize`** – Generates a concise bullet-point summary of the last 10 chat messages, useful for catching up on conversation highlights
2. **`/question <your question>`** – Ask AI a question with context from the last 6 recent messages; AI uses conversation context to provide relevant answers
3. **`/environment`** – Retrieves and analyzes IoT sensor data from Firebase Realtime Database, providing status summaries and actionable insights (requires server configuration)

### Content Safety

- **Toxicity Detection**: Uses TensorFlow.js toxicity model to detect and filter harmful content in real-time
- **Client-side Filtering**: Toxic messages are replaced with asterisks before being sent
- **Customizable Threshold**: Toxicity sensitivity can be adjusted via `TOXICITY_THRESHOLD` variable

### User Experience

- **Typing Indicator**: "AI is typing..." indicator appears when the AI is processing a command
- **Send on Enter**: Press Enter to send messages; Shift+Enter for new lines
- **Auto-focus**: Message input is auto-focused on page load for quick typing
- **Auto-scroll**: Chat view automatically scrolls to the latest message

## 🏗️ Architecture

### Project Structure

```
ChimChat/
├── backend/
│   ├── index.js           # Express + Socket.IO server with AI command handlers
│   ├── package.json       # Backend dependencies (Express, Socket.IO, Firebase Admin, Ollama)
│   ├── firebaseKey.json   # Firebase service account credentials (excluded from git)
│   ├── rtdb.json          # Firebase Realtime Database credentials for sensors (optional)
│   └── .gitignore         # Git ignore rules
└── frontend/
    ├── index.html         # HTML structure, chat display, and input fields
    ├── styles.css         # Sage-themed CSS with responsive design
    └── chat.js            # Socket.IO client logic, toxicity filtering, and UI interactions
```

### Technology Stack

**Backend:**

- **Express.js 5.x** – Web server framework
- **Socket.IO 4.x** – Real-time bidirectional communication
- **Firebase Admin SDK 13.x** – Firestore for message storage and optional Realtime Database for sensor data
- **Ollama SDK** – Local AI model integration for chat summarization and Q&A
- **CORS** – Cross-origin resource sharing
- **dotenv** – Environment variable management

**Frontend:**

- **HTML5** – Semantic structure
- **CSS3** – Sage-themed responsive design with flexbox and grid
- **Socket.IO Client** – Real-time event handling
- **TensorFlow.js Toxicity Model** – Client-side content filtering
- **Bootstrap 5.3** – Utility CSS framework (included for optional styling)
- **Poppins Font** – Google Fonts for typography

## 📋 Requirements

- **Node.js** 18+ (recommended 18.x or later)
- **npm** 9+
- Firebase project with Firestore enabled (for message storage)
- Ollama installed locally with a model (e.g., llama3, llama2) for AI features
- Optional: Firebase Realtime Database for `/environment` command

## 🚀 Setup and Deployment

### 1. Local Development (localhost)

#### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

#### Step 2: Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a service account and download the JSON key file
4. Save it as `backend/firebaseKey.json`

#### Step 3: Create Environment File

Create a `.env` file in the `backend/` directory:

```env
# Ollama configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3

# Optional: Firebase Realtime Database for sensors
SENSOR_DATABASE_URL=https://your-project.firebaseio.com
SENSOR_DATA_PATH=/sensors
```

#### Step 4: Start Backend Server

```bash
cd backend
node index.js
```

The server will run on `http://localhost:3000`

#### Step 5: Configure Frontend Socket URL

In `frontend/chat.js`, ensure the socket connection points to localhost:

```javascript
const socket = io('http://localhost:3000');
```

#### Step 6: Open the App

- Visit `http://localhost:3000` in your browser (served by the Express server), or
- Open `frontend/index.html` directly in your browser

### 2. Remote Deployment with ngrok

To test from a phone or share externally:

1. **Start the backend** (see Step 1–4 above)

2. **In a new terminal, run ngrok:**

   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** from ngrok output (e.g., `https://your-subdomain.ngrok-free.app`)

4. **Update frontend socket URL** in `frontend/chat.js`:

   ```javascript
   const socket = io('https://your-subdomain.ngrok-free.app');
   ```

5. **Access from your phone or externally:**
   - Use the ngrok URL in your mobile browser
   - Share the link with others to collaborate in real-time

### 3. Production Deployment

For production, consider:

- Deploy the backend to services like **Heroku**, **Railway**, **Render**, or **AWS**
- Use environment variables for all sensitive data (Firebase keys, Ollama host, database URLs)
- Set `CORS` origin to your production domain
- Use a reverse proxy (nginx) for security
- Enable HTTPS/SSL
- Update the frontend socket URL to your production domain

## 🔧 Configuration

### Environment Variables (`.env`)

| Variable              | Default                  | Description                                         |
| --------------------- | ------------------------ | --------------------------------------------------- |
| `OLLAMA_HOST`         | `http://127.0.0.1:11434` | URL where Ollama API is running                     |
| `OLLAMA_MODEL`        | `llama3`                 | Ollama model name (e.g., llama3, llama2, mistral)   |
| `SENSOR_DATABASE_URL` | (none)                   | Firebase Realtime Database URL for IoT sensor data  |
| `SENSOR_DATA_PATH`    | `/`                      | JSON path in Realtime Database to fetch sensor data |

### Frontend Customization

- **Socket URL**: Edit `frontend/chat.js` line 1
- **Toxicity Threshold**: Edit `frontend/chat.js` line 6 (0.0–1.0, higher = stricter)
- **Theme Colors**: Edit `frontend/styles.css` for sage-green and other colors
- **Max History Messages**: Change values in backend `fetchLastMessages()` calls

## 📱 Usage Examples

### Sending a Regular Message

1. Enter your name in the top-right input field
2. Type your message in the chat input
3. Press **Enter** or click the Send button

### Summarizing Conversation

```
/summarize
```

AI will analyze the last 10 messages and provide a bullet-point summary.

### Asking a Question

```
/question What was the main topic we discussed?
```

AI will use the last 6 messages as context and provide an answer.

### Analyzing Sensor Data

```
/environment
```

AI will fetch IoT sensor data from Firebase Realtime Database and provide insights (only if configured).

## 🛡️ Safety & Moderation

- **Toxicity Filtering**: Messages flagged as toxic are automatically replaced with `*****` before sending
- **No External Scripts**: Uses local TensorFlow.js model for filtering; no data sent to external services
- **Client-side Processing**: Toxicity check happens in the browser for privacy

## 🐛 Troubleshooting

| Issue                        | Solution                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Can't connect to backend     | Ensure `node index.js` is running and firebaseKey.json exists                     |
| "OLLAMA_HOST not found"      | Ensure Ollama is running on `http://127.0.0.1:11434` or set `OLLAMA_HOST` env var |
| Messages not persisting      | Check Firebase Firestore is enabled and credentials are valid                     |
| `/environment` command fails | Set `SENSOR_DATABASE_URL` env var with your Firebase Realtime DB URL              |
| Toxicity model fails to load | Ensure TensorFlow.js and toxicity model CDN is accessible                         |
| ngrok URL not working        | Recheck the URL is copied correctly and update `frontend/chat.js`                 |

## 📝 API Reference

### Socket Events

**Client → Server:**

- `chatMessage`: Emit a new chat message
  ```javascript
  socket.emit('chatMessage', { name: 'John', message: 'Hello!' });
  ```

**Server → Client:**

- `chatMessage`: Receive a new message
  ```javascript
  socket.on('chatMessage', data => {
    console.log(`${data.name}: ${data.message}`);
  });
  ```
- `typing`: Typing indicator status
  ```javascript
  socket.on('typing', payload => {
    if (payload.name === 'AI' && payload.typing) {
      console.log('AI is typing...');
    }
  });
  ```

## 📄 License

This project is open source and available under the ISC License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, fork the repository, or create pull requests.

## 📧 Questions?

For questions or feedback, open an issue in the repository.
