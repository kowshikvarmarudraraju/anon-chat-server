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

io.on('connection', (socket) => {
  // ✅ Send live user count using socket.io's built-in count
  io.emit('userCount', io.engine.clientsCount);

  // 🔄 Try to pair with waiting user
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);

    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');

    waiting = null;
  } else {
    waiting = socket.id;
  }

  // 💬 Relay chat messages
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // 🧠 Relay typing status
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // ❌ Handle disconnection
  socket.on('disconnect', () => {
    io.emit('userCount', io.engine.clientsCount);

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
