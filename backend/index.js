require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const { Ollama } = require('ollama');

const serviceAccount = require('./firebaseKey.json');

const messagesApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(messagesApp);

let rtdb = null;
try {
  const sensorKeyPath = './rtdb.json';
  const sensorDatabaseURL = process.env.SENSOR_DATABASE_URL;
  if (sensorDatabaseURL) {
    const sensorCredentials = sensorKeyPath
      ? require(sensorKeyPath)
      : serviceAccount;
    const sensorsApp = admin.initializeApp(
      {
        credential: admin.credential.cert(sensorCredentials),
        databaseURL: sensorDatabaseURL
      },
      'sensors-app'
    );
    rtdb = admin.database(sensorsApp);
    console.log('Realtime Database for sensors configured.');
  } else {
    console.warn(
      'SENSOR_DATABASE_URL not set. /environment command will be disabled.'
    );
  }
} catch (err) {
  console.warn('Failed to initialize sensors Realtime Database:', err.message);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.static('../frontend'));

const ollamaClient = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
});

io.on('connection', async socket => {
  console.log('A user connected:', socket.id);

  try {
    const messagesRef = db.collection('messages');
    const snapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push(doc.data());
    });

    messages.reverse().forEach(msg => {
      socket.emit('chatMessage', msg);
    });

    console.log(`Sent ${messages.length} recent messages to user ${socket.id}`);
  } catch (error) {
    console.error('Error loading messages:', error);
  }

  socket.on('chatMessage', async data => {
    const name = String(data?.name || '').trim() || 'Anonymous';
    const message = String(data?.message || '').trim();

    try {
      await db.collection('messages').add({
        name,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }

    io.emit('chatMessage', { name, message });

    const lower = message.toLowerCase();
    const isSummarize = lower === '/summarize';
    const isQuestion = lower.startsWith('/question');
    const isEnvironment = lower === '/environment';

    if (!isSummarize && !isQuestion && !isEnvironment) {
      return; 
    }

    io.emit('typing', { name: 'AI', typing: true });

    try {
      async function fetchLastMessages(n = 10) {
        const snap = await db
          .collection('messages')
          .orderBy('timestamp', 'desc')
          .limit(n)
          .get();
        const items = [];
        snap.forEach(doc => items.push(doc.data()));
        return items.reverse();
      }

      async function callOllama(messages, model) {
        const mdl = model || process.env.OLLAMA_MODEL || 'llama3';
        const res = await ollamaClient.chat({
          model: mdl,
          messages,
          stream: false
        });
        const aiText = res?.message?.content || '';
        return aiText.trim();
      }

      if (isSummarize) {
        const history = await fetchLastMessages(10);
        const transcript = history
          .map(m => `${m.name}: ${m.message}`)
          .join('\n');

        const aiText = await callOllama([
          {
            role: 'system',
            content:
              'You are an assistant for a small chat app. Write a concise summary of the conversation focusing on key points and decisions. Keep it under 8 bullet points.'
          },
          {
            role: 'user',
            content: `Here are the last 10 messages:\n\n${transcript}\n\nPlease summarize.`
          }
        ]);

        const aiMessage = { name: 'AI', message: aiText };
        io.emit('chatMessage', aiMessage);
        try {
          await db.collection('messages').add({
            name: 'AI',
            message: aiText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (e) {
          console.warn('Failed to save AI message:', e.message);
        }
      } else if (isQuestion) {
        const question = message.replace(/^\/question\s*/i, '').trim();
        if (!question) {
          const aiMessage = {
            name: 'AI',
            message: 'Please provide a question after /question.'
          };
          io.emit('chatMessage', aiMessage);
          return;
        }

        const history = await fetchLastMessages(6);
        const context = history.map(m => `${m.name}: ${m.message}`).join('\n');

        const aiText = await callOllama([
          {
            role: 'system',
            content:
              'You are a helpful assistant in a group chat. Use the context if relevant, otherwise answer directly.'
          },
          {
            role: 'user',
            content: `Chat context (recent):\n${context}\n\nQuestion: ${question}`
          }
        ]);

        const aiMessage = { name: 'AI', message: aiText };
        io.emit('chatMessage', aiMessage);
        try {
          await db.collection('messages').add({
            name: 'AI',
            message: aiText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (e) {
          console.warn('Failed to save AI message:', e.message);
        }
      } else if (isEnvironment) {
        if (!rtdb) {
          const aiMessage = {
            name: 'AI',
            message:
              'Sensor database is not configured on the server. Please set SENSOR_DATABASE_URL and optional SENSOR_FIREBASE_KEY_PATH.'
          };
          io.emit('chatMessage', aiMessage);
          return;
        }

        const dataPath = process.env.SENSOR_DATA_PATH || '/';
        const snap = await rtdb.ref(dataPath).get();
        const sensorData = snap.val();
        const sensorJson = JSON.stringify(sensorData ?? {}, null, 2);

        const aiText = await callOllama([
          {
            role: 'system',
            content:
              'You are an IoT data analyst. Given JSON sensor readings, summarize current status, highlight anomalies, and suggest actionable insights succinctly.'
          },
          {
            role: 'user',
            content: `Here is the latest sensor JSON from Firebase Realtime Database at path ${dataPath}:\n\n${sensorJson}\n\nProvide a clear summary.`
          }
        ]);

        const aiMessage = { name: 'AI', message: aiText };
        io.emit('chatMessage', aiMessage);
        try {
          await db.collection('messages').add({
            name: 'AI',
            message: aiText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (e) {
          console.warn('Failed to save AI message:', e.message);
        }
      }
    } catch (err) {
      console.error('AI command handling failed:', err);
      io.emit('chatMessage', {
        name: 'AI',
        message: 'Sorry, I ran into an error handling that request.'
      });
    } finally {
      io.emit('typing', { name: 'AI', typing: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
