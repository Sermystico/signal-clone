# Signal Clone — Real-Time Secure Messaging Application

A full-stack, real-time messaging web application built to mirror the UI, UX, and core workflows of **Signal Desktop**.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom HSL colors, Glassmorphism, Responsive design)
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **ORM & Database:** SQLAlchemy & SQLite (ACID compliant)
- **Real-Time Protocol:** WebSockets (Bi-directional async connection manager)
- **Authentication:** JWT (JSON Web Tokens) with Phone/Username + Mock OTP (`123456`)

---

## 🏛 Architecture Overview

```
+--------------------------------------------------------------+
|                     Next.js Frontend                         |
|  - App Router (/login, /register, /)                         |
|  - Sidebar Workflow & Left Rail Navigation                    |
|  - Chat Pane & Responsive Layout                             |
|  - Real-time WebSocket Event Handler                         |
+------------------------------+-------------------------------+
                               |
                               | REST APIs & WebSockets
                               v
+--------------------------------------------------------------+
|                     FastAPI Backend                          |
|  - Routers (/auth, /users, /contacts, /conversations, /messages, /ws) |
|  - ConnectionManager for WebSocket Broadcasting               |
|  - Auth Middleware & Dependency Injection                    |
+------------------------------+-------------------------------+
                               |
                               | SQLAlchemy ORM
                               v
+--------------------------------------------------------------+
|                     SQLite Database                          |
|  - Users, Contacts, Conversations, ConversationMembers       |
|  - Groups, GroupMembers, Messages                            |
+--------------------------------------------------------------+
```

---

## 🗄 Database Schema Design

The SQLite database uses standard foreign key constraints and indexed columns to ensure fast querying and relational integrity.

### 1. `users`
- `id` (INTEGER, Primary Key)
- `username` (VARCHAR, Unique, Indexed)
- `phone` (VARCHAR, Unique, Indexed, Nullable)
- `display_name` (VARCHAR)
- `avatar_url` (VARCHAR, Nullable)
- `is_online` (BOOLEAN, Default: False)
- `last_seen` (DATETIME, Default: UTC Now)
- `created_at` (DATETIME, Default: UTC Now)

### 2. `contacts`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `contact_user_id` (INTEGER, Foreign Key -> `users.id`)
- `created_at` (DATETIME, Default: UTC Now)
*Note: Contacts are strictly unidirectional.*

### 3. `conversations`
- `id` (INTEGER, Primary Key)
- `type` (VARCHAR: `'direct'` or `'group'`)
- `group_id` (INTEGER, Foreign Key -> `groups.id`, Nullable)
- `created_at` (DATETIME, Default: UTC Now)
- `updated_at` (DATETIME, Default: UTC Now)

### 4. `conversation_members`
- `conversation_id` (INTEGER, Foreign Key -> `conversations.id`, Composite Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`, Composite Primary Key)
- `joined_at` (DATETIME, Default: UTC Now)
- `last_read_message_id` (INTEGER, Default: 0)
- `last_delivered_message_id` (INTEGER, Default: 0)

### 5. `groups`
- `id` (INTEGER, Primary Key)
- `name` (VARCHAR)
- `avatar_url` (VARCHAR, Nullable)
- `created_by` (INTEGER, Foreign Key -> `users.id`)
- `created_at` (DATETIME, Default: UTC Now)

### 6. `group_members`
- `group_id` (INTEGER, Foreign Key -> `groups.id`, Composite Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`, Composite Primary Key)
- `role` (VARCHAR: `'admin'` or `'member'`, Default: `'member'`)
- `joined_at` (DATETIME, Default: UTC Now)

### 7. `messages`
- `id` (INTEGER, Primary Key)
- `conversation_id` (INTEGER, Foreign Key -> `conversations.id`)
- `sender_id` (INTEGER, Foreign Key -> `users.id`)
- `content` (TEXT)
- `status` (VARCHAR: `'sending'`, `'sent'`, `'delivered'`, `'read'`)
- `created_at` (DATETIME, Default: UTC Now)
- `read_at` (DATETIME, Nullable)

---

## 📡 API Overview & Endpoints

### Authentication (`/auth`)
- `POST /auth/check-phone` — Validates phone number format and checks registration status.
- `POST /auth/verify-otp` — Verifies OTP code (`123456`).
- `POST /auth/register` — Registers a new user account with phone, username, and display name.
- `POST /auth/login` — Authenticates by username/display name + OTP.
- `POST /auth/login/phone` — Authenticates by phone number + OTP.

### Users (`/users`)
- `GET /users/search?q={query}` — Searches registered users by name, username, or phone.
- `POST /users/avatar` — Uploads custom profile picture.
- `DELETE /users/avatar` — Removes custom profile picture.

### Contacts (`/contacts`)
- `GET /contacts/` — Fetches current user's contact list.
- `POST /contacts/{contact_user_id}` — Adds target user to current user's contacts.
- `DELETE /contacts/{contact_user_id}` — Removes target user from current user's contacts.

### Conversations (`/conversations`)
- `GET /conversations/` — Lists all conversations for current user with unread counts and last message preview.
- `POST /conversations/direct` — Gets or creates a direct conversation between two users.
- `POST /conversations/group` — Creates a new group conversation with creator assigned as admin.
- `GET /conversations/{conversation_id}` — Fetches group/conversation details and member list.
- `POST /conversations/{conversation_id}/members` — Adds a user to group (Admin only).
- `DELETE /conversations/{conversation_id}/members/{user_id}` — Removes a member from group (Admin only).
- `DELETE /conversations/{conversation_id}/leave` — Leaves group with auto-admin succession.

### Messages (`/messages`)
- `GET /messages/{conversation_id}` — Fetches message history for a conversation (Member authorized).
- `POST /messages/` — Sends a message to a conversation and broadcasts via WebSockets.

### WebSockets (`/ws`)
- `WS /ws?token={jwt_token}` — Real-time bidirectional connection for:
  - `message.new` — Instant delivery of new direct/group messages.
  - `message.status` — Delivery and read receipts update.
  - `typing.start` / `typing.stop` — Live typing indicators.
  - `presence.update` — Online / offline status & last seen.

---

## 🛠 Setup & Local Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.12+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Instructions

### Frontend (Vercel)
1. Import the repository into Vercel and set the framework to **Next.js**.
2. Set the `Root Directory` to `frontend`.
3. Add the following environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g., `https://signal-clone-backend.onrender.com`).
4. Deploy.

### Backend (Render)
1. Create a new **Web Service** on Render connected to this repository.
2. Set the `Root Directory` to `backend`.
3. Set the `Build Command` to `pip install -r requirements.txt`.
4. Set the `Start Command` to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Under **Advanced**, add a **Persistent Disk** mounted at `/data` (to preserve the SQLite database).
6. Add the following environment variables:
   - `DATABASE_URL`: `sqlite:////data/sql_app.db`
   - `ALLOWED_ORIGINS`: Your deployed Vercel frontend URL (e.g., `https://signal-clone-frontend.vercel.app`).
7. Deploy.

---

## 🧪 Demo Test Credentials

The database is pre-seeded with sample users, contacts, and active conversations:

| Username | Phone Number | Display Name | Mock OTP |
|---|---|---|---|
| `alice` | `+919876500001` | Alice | `123456` |
| `bob` | `+919876500002` | Bob | `123456` |
| `charlie` | `+919876500003` | Charlie | `123456` |
| `test` | `+919876500004` | test | `123456` |
| `test2` | `+919876500005` | test2 | `123456` |
| `test3` | `+919876500006` | test3 | `123456` |

---

## 📌 Key Assumptions Made

1. **Mock OTP Authentication:** Real SMS API integration is mocked with fixed development code `123456` as permitted.
2. **One-Way Contacts:** Adding User B to User A's contacts is one-way. Removing a contact does not delete direct conversation history.
3. **Admin Succession:** When a group admin leaves, administrative privileges are automatically transferred to the oldest remaining member.
4. **End-to-End Encryption:** E2EE status notices and security lock badges are UI-simulated per the specification.
