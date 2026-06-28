# Pulse — Web

Frontend for **Pulse**, a real-time chat app. Talks to the [`pulse-api`](https://github.com/KMM2019503/pulse-api) backend over REST + Socket.IO.

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind 4 · TanStack Query · socket.io-client
- **MVP scope:** auth (login / signup) + real-time direct-message chat with presence and read receipts
- **Design:** clean & modern, full light/dark via `next-themes`

## Prerequisites

The `pulse-api` backend must be running and reachable. By default this client
targets `http://localhost:9999`. The backend's CORS + Socket.IO must allow this
app's origin (`http://localhost:3000` in dev), so **run this app on port 3000**.

## Run locally

```bash
bun install
cp .env.example .env.local      # then edit if your API is elsewhere
PORT=3000 bun run dev           # http://localhost:3000
```

Configuration lives in `.env.local` (see [`.env.example`](.env.example)):

```env
NEXT_PUBLIC_API_URL=http://localhost:9999
# Only if the backend sets V2_INTERNAL_TOKEN:
# NEXT_PUBLIC_V2_INTERNAL_TOKEN=
```

## Deploy (Vercel)

Zero-config. Import this repo into Vercel and set environment variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public URL of the deployed `pulse-api` (e.g. `https://api.yourdomain.com`) |
| `NEXT_PUBLIC_V2_INTERNAL_TOKEN` | Only if the backend sets `V2_INTERNAL_TOKEN` |

The backend must list this app's deployed origin in its `CORS_ORIGIN`, and
auth cookies require both to be served over HTTPS in production.

## How it talks to the backend

| Concern | Detail |
| --- | --- |
| Auth | httpOnly `token` cookie; every request uses `credentials: "include"` |
| REST base | `${NEXT_PUBLIC_API_URL}/v2` |
| Realtime | Socket.IO on the same origin (`withCredentials`) |
| Receive DM | `incomingNewMessage` → `{ message, updatedConversation }` |
| Presence | `pullOnlineUsers` (array of online user ids) |
| Read receipts | client emits `markMessagesAsRead`; sender receives `messagesStatusUpdated` |

## Structure

```
src/
  app/
    (auth)/            login + signup (branded split-screen)
    (app)/chat/        guarded chat shell, empty state, [conversationId] thread
  components/
    ui/                button, input, avatar, spinner, skeleton
    chat/              sidebar, conversation list/item, header, message list/bubble, composer
  hooks/               use-conversations, use-messages, use-send-message, use-realtime
  lib/                 api (fetch), socket, types, chat-utils, env
  providers/           query-provider, auth-provider
```

## Scripts

```bash
bun run dev            # dev server (Turbopack)
bun run build          # production build
bunx tsc --noEmit      # typecheck
bunx eslint src        # lint
```

## Not yet built (next milestones)

Channels, groups, friends/contacts, profile settings, starting a brand-new
conversation (find-user-by-phone), and message attachments. The backend already
exposes endpoints for most of these under `/v2`.
