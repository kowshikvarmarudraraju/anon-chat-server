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

// ✅ Function to emit live user count using built-in sockets map
function broadcastUserCount() {
  const liveCount = io.sockets.sockets.size;
  io.emit('userCount', liveCount);
}

io.on('connection', (socket) => {
  broadcastUserCount();

  // 👥 Pair with waiting user if exists
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);

    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');

    waiting = null;
  } else {
    waiting = socket.id;
  }

  // ✉️ Handle messages
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // ⌨️ Handle typing
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // ❌ Handle disconnect
  socket.on('disconnect', () => {
    broadcastUserCount();

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

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
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

// ✅ Function to emit live user count using built-in sockets map
function broadcastUserCount() {
  const liveCount = io.sockets.sockets.size;
  io.emit('userCount', liveCount);
}

io.on('connection', (socket) => {
  broadcastUserCount();

  // 👥 Pair with waiting user if exists
  if (waiting && waiting !== socket.id) {
    pairs.set(socket.id, waiting);
    pairs.set(waiting, socket.id);

    io.to(socket.id).emit('matched');
    io.to(waiting).emit('matched');

    waiting = null;
  } else {
    waiting = socket.id;
  }

  // ✉️ Handle messages
  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('message', msg);
    }
  });

  // ⌨️ Handle typing
  socket.on('typing', () => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit('typing');
    }
  });

  // ❌ Handle disconnect
  socket.on('disconnect', () => {
    broadcastUserCount();

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

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
