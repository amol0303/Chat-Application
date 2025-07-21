const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New user connected');

  // Handle new user joining
  socket.on('join', ({ username, avatar }) => {
    users[socket.id] = { username, avatar };
    socket.broadcast.emit('userJoined', { username, avatar });
    io.emit('updateUsers', users);
  });

  // Handle incoming messages
  socket.on('sendMessage', (message) => {
    const user = users[socket.id];
    io.emit('message', {
      text: message,
      username: user.username,
      avatar: user.avatar,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing indicator
  socket.on('typing', () => {
    const user = users[socket.id];
    socket.broadcast.emit('userTyping', user.username);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.broadcast.emit('userLeft', user.username);
      delete users[socket.id];
      io.emit('updateUsers', users);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));