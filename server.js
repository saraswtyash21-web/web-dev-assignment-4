require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const initChat = require('./src/socket/chat');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET missing in .env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // simple chat test client

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Secure Connect API is running' }));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/notes', require('./src/routes/noteRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));

app.use(notFound);
app.use(errorHandler);

initChat(io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => server.listen(PORT, () => console.log(`[server] running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  });
