const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./firebaseKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.static('../frontend'));

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
    try {
      const docRef = await db.collection('messages').add({
        name: data.name,
        message: data.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Message saved successfully with ID:', docRef.id);

      io.emit('chatMessage', data);
    } catch (error) {
      console.error('Error saving message:', error);
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
