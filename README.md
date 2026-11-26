# Secure Connect and Communication Platform (Lab 4)

**Course:** Web Dev III | **Unit:** 4 | **Student:** Prashant Kanwal

A secure Node.js backend with authentication (bcrypt + JWT), role-based access control, a protected Notes API, real-time chat using Socket.IO, and event-driven features using Node's `EventEmitter`.

## Tech Stack
Node.js, Express.js, MongoDB (Mongoose), jsonwebtoken, bcrypt, dotenv, Socket.IO. No auth boilerplate or starter kits used.

## Project Structure
```
secure-connect/
├── server.js                 # app + HTTP server + Socket.IO bootstrap
├── demo-chat.js              # `npm run demo` - two users chatting over Socket.IO
├── .env.example              # copy to .env
├── public/index.html         # tiny chat client for testing Socket.IO
└── src/
    ├── config/db.js          # MongoDB connection
    ├── models/               # User, Note, Message
    ├── middleware/           # authenticate (JWT), authorize (RBAC), error handler
    ├── controllers/          # auth, notes, users, chat history
    ├── routes/               # auth, notes, users, chat
    ├── events/appEvents.js   # EventEmitter + listeners
    └── socket/chat.js        # Socket.IO chat (JWT-protected)
```

## Setup
```bash
npm install
cp .env.example .env     # on Windows: copy .env.example .env
# edit .env -> set MONGO_URI and a long random JWT_SECRET
npm start
```
Server runs at `http://localhost:5000`.

**.env variables**

| Variable | Purpose |
|---|---|
| PORT | Server port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret used to sign JWTs |
| JWT_EXPIRES_IN | Token lifetime, e.g. `1d` |
| ADMIN_EMAIL | The user who signs up with this email gets the `admin` role |

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register (password hashed with bcrypt), returns JWT |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Logged in | Current user profile (protected route) |
| POST | `/api/notes` | Logged in | Create a note |
| GET | `/api/notes` | Logged in | Own notes (admin sees all) |
| GET | `/api/notes/:id` | Owner / Admin | Get one note |
| PUT | `/api/notes/:id` | Owner / Admin | Update a note |
| DELETE | `/api/notes/:id` | Owner / Admin | Delete a note |
| GET | `/api/users` | Admin only | List all users (RBAC) |
| DELETE | `/api/users/:id` | Admin only | Delete a user and their notes |
| GET | `/api/chat/messages?room=general` | Logged in | Chat history |

Send the token as: `Authorization: Bearer <token>`

## Real-Time Chat (Socket.IO)
Connect with `io(url, { auth: { token } })`. Connections without a valid JWT are rejected.

| Event | Direction | Description |
|---|---|---|
| `chat_message` | client → server → room | Send/receive a message (saved in DB) |
| `join_room` | client → server | Switch room |
| `typing` | both | Typing indicator |
| `system` | server → client | Join/leave notifications |
| `online_users` | server → all | List of online users |

To try it: run `npm start` in one terminal and `npm run demo` in a second terminal (two users sign in, chat in real time, and an invalid token is rejected). You can also open `http://localhost:5000` in two browser tabs, paste two different JWTs and click Connect.

## Event-Driven Features (EventEmitter)
`src/events/appEvents.js` listens for `user:signup`, `user:login`, `user:login-failed`, `security:alert` (3 failed logins), `note:created/updated/deleted`, `chat:connected`, `chat:message`, `chat:disconnected` and logs them in the server console.

## Security Notes
- Passwords hashed with bcrypt (10 salt rounds), never returned in responses
- JWT signed with a secret from `.env`; expired/invalid tokens return 401
- Role is never accepted from the request body, preventing self-promotion to admin
- Users can access only their own notes; admins can access all

---

# Postman Output Screenshots

### 1. Signup
![Signup](screenshots/01-signup.png)

### 2. Login (JWT returned)
![Login](screenshots/02-login.png)

### 3. Wrong password (401)
![Login failed](screenshots/03-login-failed.png)

### 4. Protected route without token (401)
![No token](screenshots/04-notes-no-token.png)

### 5. Protected route with valid JWT
![Me](screenshots/05-me.png)

### 6. Create note
![Create note](screenshots/06-create-note.png)

### 7. Get all notes
![Get notes](screenshots/07-get-notes.png)

### 8. Update note
![Update note](screenshots/08-update-note.png)

### 9. Delete note
![Delete note](screenshots/09-delete-note.png)

### 10. RBAC: normal user on `/api/users` (403)
![Forbidden](screenshots/10-users-forbidden.png)

### 11. RBAC: admin on `/api/users` (200)
![Admin users](screenshots/11-users-admin.png)

### 12. Real-time chat (browser + server console)
![Chat](screenshots/12-chat.png)

### 13. EventEmitter logs in server console
![Events](screenshots/13-events-console.png)
