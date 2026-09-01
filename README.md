# My Chat 💬

A simple, modern real-time chat web application built with **React + Vite + Tailwind CSS + Supabase**.

Users can sign up, log in, search for other registered users, and chat with them in real time.

## Features

- Signup (username, email, password) & Login with form validation
- Logout
- Search users by username
- Real-time messaging with Supabase Realtime (no page refresh)
- Send messages with Enter or the Send button
- Delete your own messages
- Online / offline presence indicator
- Empty state when no chat is selected
- Light mode & dark mode toggle
- Clean, responsive, mobile-friendly UI

## Tech Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) (v4)
- [Supabase](https://supabase.com) — Auth, Database, Realtime
- [React Router](https://reactrouter.com)
- [lucide-react](https://lucide.dev) icons

## Project Structure

```
src/
├── components/
│   ├── Avatar.jsx
│   ├── ChatWindow.jsx
│   ├── Sidebar.jsx
│   └── ThemeToggle.jsx
├── pages/
│   ├── Chat.jsx
│   ├── Login.jsx
│   └── Signup.jsx
├── lib/
│   └── supabase.js
├── hooks/
│   └── useTheme.js
├── App.jsx
└── main.jsx
```

## 1. Prerequisites

- Node.js (18+) and npm
- A free [Supabase](https://supabase.com) account

## 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, open your project dashboard.

### Create the tables & policies

In your Supabase project, open the **SQL Editor** and run the SQL in
[`supabase/schema.sql`](supabase/schema.sql). This creates the `profiles` and
`messages` tables, sets up Row Level Security, auto-creates a profile on
signup, and enables realtime for messages.

### Get your API keys

In your project dashboard, go to **Project Settings → API**.

Copy your:

- **Project URL** (e.g. `https://yourproject.supabase.co`)
- **anon public key**

## 3. `.env` setup

Create a file named `.env` in the project root (a template is in
`.env.example`):

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> `.env` is gitignored, so your keys are never committed. Only the **anon**
> public key is used in the frontend (never the `service_role` key).

### Disable email confirmation (optional, for testing)

By default Supabase requires email confirmation. To make testing easier:

- Go to **Authentication → Providers → Email**.
- Turn off **Confirm email** (or confirm your email in the inbox).

## 4. Run the project

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## 5. How to test with two accounts

1. Open http://localhost:5173 in a normal browser window.
2. Sign up for account A (e.g. `alice` / alice@test.com).
3. Open a **second** browser window in incognito/private mode (or a different
   browser), and sign up for account B (e.g. `bob` / bob@test.com).
4. In **both** windows, log in if you aren't logged in already.
5. In Alice's window, use **Search users** to find `bob` and click him.
6. Send a message from Alice. It should appear instantly in Bob's window
   without refreshing.
7. Reply from Bob — it appears instantly in Alice's window.
8. Delete a message and watch it disappear on the other side.

## Troubleshooting

- **"duplicate key value violates unique constraint" on signup** — a profile
  for that email already exists. Try a different email, or delete the user
  from Supabase **Authentication → Users**.
- **Realtime messages not appearing** — make sure you ran
  `alter publication supabase_realtime add table public.messages;` from
  `supabase/schema.sql`.
- **Login fails** — if email confirmation is on, confirm the email first.

## Availability / security notes

- This is a **demo** project focused on core functionality.
- The "online" indicator uses Supabase Realtime presence, so it only tracks
  users actually viewing the app at the same time.
- Row Level Security is enforced in the database, so users can only read their
  own conversations, send messages as themselves, and delete their own messages.
