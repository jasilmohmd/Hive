# Hive

Community and collaboration platform: **Angular 18** SPA (`client/`) and **Express + MongoDB** API (`server/`) with JWT cookies, RBAC, communities/channels, friends, image uploads, and realtime text chat (Socket.IO).

## Prerequisites

- Node.js 18+
- MongoDB reachable at the URI you configure

## Setup

1. Copy environment template for the API:

   `server/.env.example` → `server/.env` and set `MONGO_URI`, `JWT_SECRET_KEY`, and optional `CORS_ORIGIN` (default `http://localhost:4200`).

2. Install dependencies (from repo root):

   ```bash
   npm run install:all
   ```

## Run locally

Use **two terminals**.

**API** (from repo root):

```bash
npm run server
```

**SPA** (from repo root):

```bash
npm run client
```

- App: `http://localhost:4200`
- API: `http://localhost:3000` (override via `client/src/environments/environment.ts` → `apiUrl`)

### Realtime chat note

The SPA runs on a different origin than the API in development. JWT is stored in an **httpOnly** cookie for HTTP requests and duplicated in API responses so the client can keep a **sessionStorage** copy for Socket.IO (`auth.token`). Logging in (or calling `isUserAuthenticated`) refreshes that token.

## Features implemented in this pass

- Single HTTP server for Express + Socket.IO (correct listen target).
- Socket JWT authentication and channel/direct messaging rules on the server.
- `GET /chat/messages/:chatId` for history (authenticated).
- Community **chatroom** UI: history + live send/receive.
- Friends → **Message** opens direct chat (`/main/direct_message?friendId=…`).
- **Discover** lists communities from `GET /community/`.
- **DM voice/video calls** (WebRTC P2P + Socket.IO signaling): call buttons in DM, app-wide incoming call modal, mute/camera/end controls.

## Deploy (free tier — Option A)

| Layer | Host |
|-------|------|
| Angular SPA | **Cloudflare Pages** — build `client`, output `dist/client/browser` |
| API + Socket.IO | **Render** free web service — root `server`, start `npm start` |
| MongoDB | **Atlas M0** |
| Voicerooms | **LiveKit Cloud** free tier |

1. Set `server/.env`: `MONGO_URI`, `JWT_SECRET_KEY`, `CORS_ORIGIN` = your Pages URL.
2. Set `client/src/environments/environment.prod.ts` → `apiUrl` = your Render URL.
3. Render deploy: enable WebSockets; add health check path `/health`.
4. Optional: **UptimeRobot** ping `/health` every 10–14 min to reduce idle spin-down on Render free tier.

### DM calls (local test)

**DM calls** use WebRTC P2P + `GET /call/ice-config` (optional TURN via `TURN_*` env vars). Device release, retries, and camera/mic-in-use messages are in [`client/src/app/services/call/media-capture.ts`](client/src/app/services/call/media-capture.ts).

**Voicerooms (phase 2):** set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in `server/.env` and `livekitUrl` in `client/src/environments/environment.ts` (same wss URL). Join a community **Voice Room** channel (max 6 participants). Features: voice, optional camera, screen share, speaking indicator.

**Two browsers on one PC (DM video):** after retries, callee may fall back to **mic-only**. Use two devices for full two-way video.

1. `server/.env`: `MONGO_URI`, `JWT_SECRET_KEY`, `CORS_ORIGIN=http://localhost:4200` (no quotes; see `server/.env.example`).
2. `client/src/environments/environment.ts`: `apiUrl: "http://localhost:3000"` (default).
3. Run API + client (two terminals). **Restart server after code changes** (`npm run server` uses `src/` — stale `*.js` files next to `*.ts` used to shadow new routes; `tsconfig` now prefers `.ts`).

   Quick check: `GET http://localhost:3000/health` → `{"ok":true}` and `GET http://localhost:3000/auth/realtime-token` (with login cookie) → `{"token":"..."}`.
4. Log in as two **mutual friends** in two browsers (or profiles).
5. Both users open any `/main/...` page so Socket.IO connects (check server terminal for `Socket connected userId=...`).
6. Open DM → use phone/video icons. Callee accepts the modal.

**Do not use** `environment.prod.ts` locally — that file is for Cloudflare/Render deploy only.

If calls fail: refresh after login (needs `hive_access_token` in sessionStorage), allow mic/camera, and watch the server log for `[call] invite from ...`.

## Build

```bash
npm run build:server
npm run build:client
```

## UI Improvement Backlog (Prioritized)

1. Navigation consistency
   - Replace remaining `href`-based internal links with `routerLink`.
   - Add consistent active state (`routerLinkActive`) in top-level navigation layouts.
2. Shared feedback states
   - Extract reusable loading, empty, and inline-error components.
   - Adopt these in discover, friends, profile edit, and community pages.
3. Accessibility baseline
   - Add better `aria-label`/`alt` text for interactive icons and user images.
   - Ensure keyboard interaction and escape-close support for dropdowns/modals.
4. Responsive layout density
   - Reduce fixed panel widths/heights in community and friends layouts.
   - Improve spacing and stacking behavior for tablet breakpoints.
5. Interaction polish
   - Standardize async button states (idle/loading/success/error).
   - Unify hover/focus transitions and form validation feedback.

Suggested next step after current chat improvements: extract a reusable `ChatComposer` component for shared text + attachment behavior across direct and channel chat UIs.
