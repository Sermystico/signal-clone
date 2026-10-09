# Signal Clone — Real-Time Secure Messaging Application

A full-stack, real-time messaging web application built with pixel-level fidelity to mirror the UI, UX, and core workflows of **Signal Desktop**.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, React 19) with Turbopack
- **Language:** TypeScript
- **Styling:** Vanilla CSS & Tailwind CSS (Custom HSL palette, Glassmorphism, Signal Dark/Light themes, Responsive layouts)
- **Icons:** Lucide React & Custom Signal SVGs (Stories segmented icon)
- **Avatars:** LoremFaces Dynamic Human Avatar API

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **ORM & Database:** SQLAlchemy & SQLite (ACID compliant)
- **Real-Time Protocol:** WebSockets (Bi-directional async connection manager with presence, typing, and read receipts)
- **Authentication:** JWT (JSON Web Tokens) with Phone/Username + Mock OTP (`123456`)
- **Static File Storage:** FastAPI StaticFiles mount for user avatars and message file attachments

---

## ✨ Features & UI/UX Highlights

### 💬 Real-Time Messaging & Chat Experience
- **Instant Message Delivery:** Sub-millisecond WebSocket broadcasting for 1-on-1 direct chats and multi-user group chats.
- **Delivery & Read Receipts:** Single check (`sent`), double check (`delivered`), and white double check (`read`).
- **Live Typing Indicators:** Real-time animated typing bubbles that automatically stop when idle.
- **Presence Tracking:** Online/Offline green status indicators and human-readable "Last seen" timestamps.
- **Browser History Integration:** Integrated `popstate` navigation where the Back button closes active conversations smoothly without leaving the app.

### 📎 Media & File Attachments
- **Multi-Format Support:** Photos, videos, audio clips, PDFs, documents (`.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`), text files, and archives (`.zip`).
- **Attachment Preview Bar:** Real-time upload preview bar above the composer with thumbnail, filename, formatted size, and remove button.
- **Rich Message Cards:**
  - **Images:** High-res inline image cards with click-to-open **Lightbox Fullscreen Modal** and direct download action.
  - **Videos & Audio:** Native inline HTML5 media players.
  - **Documents / Files:** Signal document cards with file type icons, size metadata, and single-click download.

### 😀 Interactive Signal Emoji Picker
- **5 Categorized Tabs:** Popular (`🔥`), Smileys & People (`😀`), Gestures (`👍`), Hearts & Symbols (`❤️`), and Objects & Tech (`💻`).
- **Live Keyword Search:** Instant emoji filtering by keywords (e.g., *fire*, *love*, *smile*, *cool*, *party*, *code*, *coffee*).
- **Click-to-Insert:** Seamless insertion at current cursor position in message input.

### 👤 Contact & Direct Chat Workflows
- **Contact Intro Card:** Centered contact card with overlapping avatar, name, and expandable chevron details popover.
- **Non-Contact In-Chat Banner:** Shows *"This person is not in your contact list"* with an `[ Add to contacts ]` action button that automatically disappears once added.
- **Interactive Contact Popover:** Displays phone number, dynamic shared group membership (`Member of <groups>`), and an interactive Add/Remove contact toggle.
- **One-Way Contacts:** Removing a contact leaves conversation history accessible and intact.

### 👥 Group Conversations & Admin Management
- **Group Creation:** Multi-select members workflow with group name and custom avatar.
- **Admin Privileges:** Admin-only member addition and removal with 403 authorization guards.
- **Automatic Admin Succession:** When an admin leaves a group, administrative privileges transfer to the senior remaining member.
- **Clean Group Headers:** Group chats feature dedicated member counts and clean intros without contact popovers.

### ⚙️ Desktop Settings (2-Pane Modal)
- Full Signal Desktop 2-pane Settings interface:
  - **Profile:** Edit display name, about bio, view phone number, and copy username (`@username`).
  - **Appearance:** System, Light, and Dark mode theme selectors.
  - **Chats, Calls, Notifications, Privacy, and Help:** Granular preference panels.

---

## 🏛 Architecture Overview

```
+--------------------------------------------------------------+
|                     Next.js Frontend                         |
|  - App Router (/login, /register, /)                         |
|  - Sidebar Workflow & Left Rail Navigation                    |
|  - Chat Pane, File Composer & Emoji Picker                   |
|  - Real-time WebSocket Event & Status Manager                |
+------------------------------+-------------------------------+
                               |
                               | REST APIs, StaticFiles & WebSockets
                               v
+--------------------------------------------------------------+
|                     FastAPI Backend                          |
|  - Routers (/auth, /users, /contacts, /conversations,        |
|            /messages, /ws)                                   |
|  - Static Uploads Mount (/uploads) for Attachments & Avatars |
|  - ConnectionManager for Async WebSocket Broadcasting        |
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

### 3. `conversations`
- `id` (INTEGER, Primary Key)
- `type` (VARCHAR: `'direct'` or `'group'`)
- `group_id` (INTEGER, Foreign Key -> `groups.id`, Nullable)
- `created_at` (DATETIME, Default: UTC Now)
- `updated_at` (DATETIME, Default: UTC Now)

### 4. `conversation_members`
- `conversation_id` (INTEGER, Foreign Key -> `conversations.id`, Composite PK)
- `user_id` (INTEGER, Foreign Key -> `users.id`, Composite PK)
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
- `group_id` (INTEGER, Foreign Key -> `groups.id`, Composite PK)
- `user_id` (INTEGER, Foreign Key -> `users.id`, Composite PK)
- `role` (VARCHAR: `'admin'` or `'member'`, Default: `'member'`)
- `joined_at` (DATETIME, Default: UTC Now)

### 7. `messages`
- `id` (INTEGER, Primary Key)
- `conversation_id` (INTEGER, Foreign Key -> `conversations.id`)
- `sender_id` (INTEGER, Foreign Key -> `users.id`)
- `content` (TEXT, Stores text or rich attachment JSON payload)
- `status` (VARCHAR: `'sending'`, `'sent'`, `'delivered'`, `'read'`)
- `created_at` (DATETIME, Default: UTC Now)
- `read_at` (DATETIME, Nullable)

---

## 📡 API Overview & Endpoints

### Authentication (`/auth`)
- `POST /auth/check-phone` — Validates phone number format and checks registration status.
- `POST /auth/verify-otp` — Verifies OTP code (`123456`).
- `POST /auth/register` — Registers new account with phone, username, display name, and avatar.
- `POST /auth/login` — Authenticates by username/display name + OTP.
- `POST /auth/login/phone` — Authenticates by phone number + OTP.
- `GET /auth/me` — Fetches authenticated user profile.

### Users & Search (`/users`)
- `GET /users/search?q={query}` — Searches registered users by `@username`, name, or phone.
- `POST /users/avatar` — Uploads custom profile avatar.
- `DELETE /users/avatar` — Removes custom avatar.

### Contacts (`/contacts`)
- `GET /contacts/` — Fetches current user's contact list.
- `POST /contacts/{contact_user_id}` — Adds target user to contacts.
- `DELETE /contacts/{contact_user_id}` — Removes target user from contacts.

### Conversations & Groups (`/conversations`)
- `GET /conversations/` — Lists all conversations with unread counts and latest messages.
- `POST /conversations/direct` — Retrieves or creates direct 1-on-1 conversation.
- `POST /conversations/group` — Creates group conversation with creator as admin.
- `GET /conversations/{conversation_id}` — Fetches group details and member list.
- `POST /conversations/{conversation_id}/members` — Adds member to group (Admin only).
- `DELETE /conversations/{conversation_id}/members/{user_id}` — Removes member from group (Admin only).
- `DELETE /conversations/{conversation_id}/leave` — Leaves group with automatic admin promotion.

### Messages & File Uploads (`/messages`)
- `GET /messages/{conversation_id}` — Fetches message history for a conversation.
- `POST /messages/` — Sends a message and triggers async WebSocket broadcasts.
- `POST /messages/upload` — Uploads file/image attachment to static storage.

### WebSockets (`/ws`)
- `WS /ws?token={jwt_token}` — Real-time bidirectional connection:
  - `message.new` — Instant delivery of messages and media attachments.
  - `message.status` — Real-time delivery and read receipt acknowledgments.
  - `typing.start` / `typing.stop` — Live typing notifications.
  - `presence.update` — Instant online/offline status updates.

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

## 🧪 Demo Test Credentials

The database is pre-seeded with sample users, contacts, and active conversations:

| Username | Phone Number | Display Name | Mock OTP |
|---|---|---|---|
| `alice` | `+919876500001` | Alice | `123456` |
| `bob` | `+919876500002` | Bob | `123456` |
| `charlie` | `+919876500003` | Charlie | `123456` |

---

## ☁️ Deployment Instructions

### Frontend (Vercel)
1. Import repository into Vercel and select **Next.js** framework.
2. Set `Root Directory` to `frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://signal-clone-backend.onrender.com`).
4. Deploy.

### Backend (Render)
1. Create a **Web Service** on Render connected to this repository.
2. Set `Root Directory` to `backend`.
3. Set `Build Command` to `pip install -r requirements.txt`.
4. Set `Start Command` to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Under **Advanced**, add a **Persistent Disk** mounted at `/data` (to preserve SQLite database and file uploads).
6. Add environment variables:
   - `DATABASE_URL`: `sqlite:////data/sql_app.db`
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://signal-clone-frontend.vercel.app`).
7. Deploy.
