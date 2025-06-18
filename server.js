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
const users = new Set();
const pairs = new Map();

io.on('connection', (socket) => {
  users.add(socket.id);
  io.emit('userCount', users.size);

  // Match user with someone else waiting
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);
    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');
    waiting = null;
  } else {
    waiting = socket.id;
  }

  // Relay messages to partner
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // Relay typing notification
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('userCount', users.size);

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

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
