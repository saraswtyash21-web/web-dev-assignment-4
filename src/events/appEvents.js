// Event-driven features built on Node.js EventEmitter.
// Controllers / sockets only EMIT events; the listeners below react to them.
const EventEmitter = require('events');

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

const MAX_FAILED_ATTEMPTS = 3;
const failedLogins = new Map(); // email -> count

const stamp = () => new Date().toISOString();

appEvents.on('user:signup', (user) => {
  console.log(`[event ${stamp()}] user:signup -> Welcome ${user.name} <${user.email}> (role: ${user.role})`);
});

appEvents.on('user:login', (user) => {
  failedLogins.delete(user.email); // reset counter on success
  console.log(`[event ${stamp()}] user:login -> ${user.email}`);
});

// Security feature: warn after repeated failed logins
appEvents.on('user:login-failed', (email) => {
  const count = (failedLogins.get(email) || 0) + 1;
  failedLogins.set(email, count);
  console.warn(`[event ${stamp()}] user:login-failed -> ${email} (attempt ${count})`);
  if (count >= MAX_FAILED_ATTEMPTS) {
    appEvents.emit('security:alert', { email, count });
  }
});

appEvents.on('security:alert', ({ email, count }) => {
  console.warn(`[ALERT ${stamp()}] ${count} failed login attempts for ${email}`);
});

appEvents.on('note:created', (note) => {
  console.log(`[event ${stamp()}] note:created -> "${note.title}" (${note._id})`);
});

appEvents.on('note:updated', (note) => {
  console.log(`[event ${stamp()}] note:updated -> "${note.title}" (${note._id})`);
});

appEvents.on('note:deleted', (noteId) => {
  console.log(`[event ${stamp()}] note:deleted -> ${noteId}`);
});

appEvents.on('chat:connected', ({ name, room }) => {
  console.log(`[event ${stamp()}] chat:connected -> ${name} joined #${room}`);
});

appEvents.on('chat:message', ({ name, room, text }) => {
  console.log(`[event ${stamp()}] chat:message -> #${room} ${name}: ${text}`);
});

appEvents.on('chat:disconnected', ({ name }) => {
  console.log(`[event ${stamp()}] chat:disconnected -> ${name}`);
});

module.exports = appEvents;
