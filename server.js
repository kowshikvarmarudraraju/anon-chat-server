const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let waiting = null;
const pairs = new Map();

// ✅ Emit the true count of connected sockets
function broadcastUserCount() {
  const liveUserCount = io.sockets.sockets.size;
  io.emit('userCount', liveUserCount);
}

io.on('connection', (socket) => {
  broadcastUserCount(); // when user joins

  // 🔁 Match with waiting stranger
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);
    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');
    waiting = null;
  } else {
    waiting = socket.id;
  }

  // 💬 Relay messages
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // ⌨️ Relay typing notification
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // ❌ On disconnect
  socket.on('disconnect', () => {
    broadcastUserCount(); // when user leaves

    const partner = pairs.get(socket.id);
    if (partner) {
      pairs.delete(partner);
      io.to(partner).emit('partnerDisconnected');
    }

    pairs.delete(socket.id);

    if (waiting === socket.id) {
      waiting = null;
    }
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
