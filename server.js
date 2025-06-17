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

let waitingQueue = [];
let onlineCount = 0;

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('userCount', onlineCount);

  // Try to pair the socket
  let partner = waitingQueue.shift();

  if (partner && partner.connected) {
    // Pair users
    socket.partner = partner;
    partner.partner = socket;
    socket.emit('matched');
    partner.emit('matched');
  } else {
    // No one to match, put this socket in queue
    waitingQueue.push(socket);
  }

  // Message handler
  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    onlineCount--;
    io.emit('userCount', onlineCount);

    // Notify partner
    if (socket.partner) {
      socket.partner.emit('partnerDisconnected');
      socket.partner.partner = null;
    }

    // Remove from queue if still in it
    waitingQueue = waitingQueue.filter(s => s !== socket);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
