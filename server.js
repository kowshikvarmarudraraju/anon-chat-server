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

// Live user count tracker
const liveUsers = new Set();
const pairs = new Map();
let waiting = null;

io.on('connection', (socket) => {
  // ✅ Track new connection
  liveUsers.add(socket.id);
  io.emit('userCount', liveUsers.size);

  // ✅ Matchmaking
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);
    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');
    waiting = null;
  } else {
    waiting = socket.id;
  }

  // ✅ Typing notification
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // ✅ Message relay
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // ✅ Disconnect cleanup
  socket.on('disconnect', () => {
    liveUsers.delete(socket.id);
    io.emit('userCount', liveUsers.size);

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

// ✅ Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
