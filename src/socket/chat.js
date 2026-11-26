const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const appEvents = require('../events/appEvents');

module.exports = function initChat(io) {
  // Socket.IO middleware: reject connections without a valid JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) return next(new Error('Authentication error: token missing'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  const onlineUsers = new Map(); // socket.id -> { id, name }

  const broadcastOnline = () =>
    io.emit('online_users', [...new Set([...onlineUsers.values()].map((u) => u.name))]);

  io.on('connection', (socket) => {
    const { user } = socket;
    let room = 'general';
    socket.join(room);
    onlineUsers.set(socket.id, { id: String(user._id), name: user.name });

    appEvents.emit('chat:connected', { name: user.name, room });
    socket.emit('system', `Welcome ${user.name}! You joined #${room}`);
    socket.to(room).emit('system', `${user.name} joined #${room}`);
    broadcastOnline();

    // Switch rooms
    socket.on('join_room', (newRoom) => {
      if (typeof newRoom !== 'string' || !newRoom.trim()) return;
      socket.leave(room);
      socket.to(room).emit('system', `${user.name} left #${room}`);
      room = newRoom.trim().toLowerCase().slice(0, 30);
      socket.join(room);
      socket.emit('system', `You joined #${room}`);
      socket.to(room).emit('system', `${user.name} joined #${room}`);
    });

    // Send a message to the current room (persisted in DB)
    socket.on('chat_message', async (text) => {
      try {
        if (typeof text !== 'string' || !text.trim()) return;
        const msg = await Message.create({
          room,
          sender: user._id,
          senderName: user.name,
          text: text.trim(),
        });
        io.to(room).emit('chat_message', {
          id: msg._id,
          room,
          sender: user.name,
          text: msg.text,
          createdAt: msg.createdAt,
        });
        appEvents.emit('chat:message', { name: user.name, room, text: msg.text });
      } catch (err) {
        socket.emit('error_message', 'Message could not be sent.');
      }
    });

    // Typing indicator
    socket.on('typing', (isTyping) => {
      socket.to(room).emit('typing', { user: user.name, isTyping: !!isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      socket.to(room).emit('system', `${user.name} left #${room}`);
      appEvents.emit('chat:disconnected', { name: user.name });
      broadcastOnline();
    });
  });
};
