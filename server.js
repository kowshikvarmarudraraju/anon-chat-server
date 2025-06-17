
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

let waitingUser = null;
let onlineCount = 0;

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('onlineCount', onlineCount);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    waitingUser.emit('partnerConnected');
    socket.emit('partnerConnected');
    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    onlineCount--;
    io.emit('onlineCount', onlineCount);
    if (socket.partner) {
      socket.partner.emit('partnerDisconnected');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
