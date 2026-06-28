# Pulse — Web

Frontend for **Pulse**, a real-time chat app. Talks to the [`pulse-api`](https://github.com/KMM2019503/pulse-api) backend over REST + Socket.IO.

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind 4 · TanStack Query · socket.io-client
- **MVP scope:** auth (login / signup) + persona onboarding + real-time direct-message chat with presence and read receipts
- **Design:** clean & modern, full light/dark via `next-themes`

## Current implementation status

### Integrated now

- Auth flow is implemented for login and signup.
- Persona onboarding is integrated after signup and before the main app when needed.
- Onboarding supports:
  - free-text story submission
  - AI preview review
  - tag confirmation
  - explicit skip
- Root routing checks the current backend profile state and sends the user to:
  - `/onboarding/persona` when profile status is not yet complete
  - `/chat` when profile status is `READY` or `SKIPPED`
- Chat, friends, and nearby app shells now guard against bypassing onboarding.
- Frontend profile integration uses the backend routes:
  - `GET /v2/profile/me`
  - `POST /v2/profile/story`
  - `PUT /v2/profile/tags`
  - `POST /v2/profile/skip`

### Not integrated yet

- Friend suggestions driven by confirmed persona tags.
- Channel suggestions / channel tagging.
- Full manual browser QA against live Gemini responses across the complete onboarding flow.

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
    onboarding/        persona onboarding flow (story, preview, confirm, skip)
    (app)/chat/        guarded chat shell, empty state, [conversationId] thread
  components/
    ui/                button, input, avatar, spinner, skeleton
    chat/              sidebar, conversation list/item, header, message list/bubble, composer
  hooks/               use-conversations, use-messages, use-profile, use-send-message, use-realtime
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

Channels, groups, friend suggestions, channel suggestions, profile settings,
starting a brand-new conversation (find-user-by-phone), and message attachments.
The backend already exposes endpoints for many of these under `/v2`.
