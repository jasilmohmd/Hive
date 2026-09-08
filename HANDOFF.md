# Hive — Codebase Context

Community/collaboration platform (Discord-like): communities → channels → chat, plus DMs, friends, WebRTC calls, and LiveKit voicerooms.

**Repo:** `https://github.com/jasilmohmd/Hive` (public) · branch `main` · 65 commits · root: `E:\Bro Camp\Week 22 - 2nd Project\Hive`

## Stack

| | |
|---|---|
| Client | Angular 18 (standalone components), Tailwind 3.4, RxJS, socket.io-client, livekit-client. TS pinned `~5.4.2` |
| Server | Express 4.21, Mongoose 8.9, Socket.IO 4.8, TS 5.7, JWT (cookie) + RBAC, Cloudinary, nodemailer, Winston, zod |
| DB | MongoDB Atlas |
| Size | client 156 `.ts` / 67 `.html`; server 132 `.ts` |

Monorepo is **not** an npm workspace — root `package.json` only proxies via `--prefix`. `client/` and `server/` have independent `package.json` + lockfiles + `node_modules`.

## Layout

```
Hive/
├── .github/workflows/ci.yml   two jobs: server + client, on push/PR to main
├── render.yaml                Render service `hive-api` (rootDir: server)
├── client/                    Angular SPA → Cloudflare Pages (dist/client/browser)
└── server/                    Express API → Render
```

## Server architecture

Clean/layered: **controller → usecase → repository → Mongoose model**, with interfaces per layer under `src/interfaces/`.

```
server/src/
├── controller/     auth channel chat community friends image profile role call voiceroom
├── usecase/        business logic (same domains)
├── repositories/   data access (auth channel chat community friends message
│                   messageReaction pollVote profile role)
├── entity/         domain types
├── interfaces/     contracts: controllers/ usecase/ repository/ middleware/ models/ utils/
├── errors/         CustomError + NotFoundError / ValidationError / UnauthorizedError
├── constants/auth/ errorCode errorField errorMessage statusCodes successMessage
└── framework/
    ├── config/     app.ts (Express + Socket.IO wiring), db.ts
    ├── middlewares/ auth.middleware.ts, error.middleware.ts
    ├── models/     Mongoose schemas + seedCategories/seedTags
    ├── router/     one per domain
    └── utils/      jwt.service, hashing.service, RBACService, CloudinaryStorageService,
                    callSignaling, voiceroomPresence, channelAccess.util,
                    directChatAuth.util, socketAuth.util, chatMessageContent,
                    chatMediaUrl, callMessageContent, linkPreview, validators/
```

**Mounted routes:** `/auth /friends /profile /community /channel /role /image /chat /call /voiceroom` + `GET /health`.

**Auth:** JWT in an httpOnly cookie (`secure` in prod, `sameSite` from `COOKIE_SAME_SITE`). Sockets authenticate with a JWT fetched from `GET /auth/realtime-token` (cookie → JSON → sessionStorage), verified in `io.use` in `app.ts`.

**Socket events:** `joinChat`, `sendMessage`/`newMessage`, `chatError`; calls `call:offer|answer|ringing|busy|unavailable|error`; voicerooms `room:watch|unwatch|join|leave|mute|state|error`.

## Client architecture

```
client/src/app/
├── app.routes.ts        route tree (below)
├── core/interceptor/    auth.interceptor.ts
├── guards/              auth.guard.ts (AuthGuardChild)
├── models/  interface/  util/
├── services/            call call-ringtone channel chat community friends image role
│                        toast user-auth user-profile voiceroom voiceroom-presence
│   ├── shared/          channel-state, community-state, role-state (cached state)
│   └── call/            call-transport.interface, p2p-transport, livekit-transport,
│                        media-capture  (WebRTC abstraction)
└── component/
    ├── auth/            login register email-verify otp change-password layout
    ├── landing-page/
    ├── common/          ~30 shared: chat-* family, button, modal, table, dropdown,
    │                    toast, empty/loading/error states, image cropper/picker
    └── main/            discover profile friends-section community
                         direct-message create-community
```

**Routes:** `/auth/{login,register,email_verify,otp,change_pass}` · `/main/{discover,profile{,/edit_profile,/change_password},friends_section/{friends,online,pending,blocked,addfriend},direct_message}` · `/main/community/:id/{about,chatroom/:channelId,voiceroom/:channelId}` · `/main/community/create/{step-one,step-two,step-three}`

**Shared chat components** (extracted — reuse these, don't re-inline):
- `common/chat-message-body/` — renders a bubble's contents (sticker/audio/video/file/location/contact/poll/gif/image/text). Used by both `direct-message` and `channel-chat-panel`.
- `common/chat-sheet/` — backdrop + mobile bottom-sheet / desktop dropdown chrome for all 7 composer popups. Takes `theme`, `panelClass`, `sheetTitle`.
- Both use `host: { class: 'contents' }` (`display:contents`) so the wrapper element stays out of layout. **Keep that** if you touch them.
- `chat-composer` renders one template for both themes via class getters (`containerClasses`, `inputClasses`, …) — do not re-fork it per theme.

## Conventions & gotchas (these have each caused real bugs here)

1. **Compare ObjectIds with `.equals()`** — never `===`, `!==`, or `Array.includes()`. A whole class of silent no-ops (leave community, remove member, approve join, remove tag) came from this.
2. **Usecases must rethrow domain errors:** `if (error instanceof CustomError) throw error;` before any generic wrap. `error.middleware.ts` dispatches on `instanceof`; wrapping turns 404/400/401 into opaque 500s.
3. **`server/src` is TypeScript-only.** 131 stale compiled `.js` files once shadowed their `.ts` sources at runtime. Now blocked by `src/**/*.js` in `server/.gitignore` — never commit `.js` there, and never import with an explicit `.js` extension (that bypasses ts-node resolution under CommonJS).
4. **One bad spec kills the entire client suite.** A TS error in any `*.spec.ts` makes Karma abort with `Found 1 load error` and run **zero** tests — silently green-looking if tests aren't gated. CI now runs `ng test` for this reason.
5. **Dev server does not typecheck.** `nodemon` uses `ts-node/register/transpile-only`, and `noEmitOnError` is off. `tsc`/CI is the only real gate.
6. **Editor TS ≠ project TS.** Workspace TS is 5.4.5; a newer editor TS can surface diagnostics CI never sees (this is why `client/tsconfig.json` now sets an explicit `rootDir`).
7. **Git history was grafted** with `git subtree`. Old per-file history is reachable (blame works back to Jan 2025). The two original repos' other branches are preserved as `archive/frontend-*` and `archive/backend-*` refs.

## Deployment

- **API** → Render service `hive-api`, `rootDir: server`, build `npm install && npm run build`, start `npm start`, health `/health`.
- **SPA** → Cloudflare Pages, root `client`, output `dist/client/browser`.
- **Cross-origin**, so `CORS_ORIGIN` (server) must exactly match the Pages origin and `COOKIE_SAME_SITE=none` pairs with `secure:true`.
- `client/src/environments/environment.prod.ts` points at `https://hive-backend-n6iv.onrender.com`.
- Env vars in `render.yaml`: `NODE_ENV PORT JWT_SECRET_KEY MONGO_URI CORS_ORIGIN COOKIE_SAME_SITE LIVEKIT_* CLOUDINARY_* GIPHY_API_KEY EMAIL_USER EMAIL_PASS`.

## Commands

```bash
# server
cd server && npm run dev                    # nodemon, transpile-only
npx tsc --noEmit && npm run build
npm run test:chat-media-url && npm run test:chat-message-content

# client
cd client && npm start
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.spec.json      # NOT covered by the app typecheck
CHROME_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe" \
  npm test -- --watch=false --browsers=ChromeHeadless      # 79 specs, all passing
npm run build
```

## Recently fixed — do not "re-fix"

Security: OTP now required for password reset; bcrypt hash no longer returned by `/auth/userDetails*`; socket `joinChat` checks membership; `/image/upload` authed + 5MB + image-only; rate limiting on `/auth/*`; regex escaping in auth lookups; membership checks on role/channel reads.

Correctness: ObjectId `.equals()` sweep; `CustomError` rethrow; cookie `secure`/`sameSite` on JWT-error clear; OTP expiry 60s → 10min; voiceroom presence keyed per-socket (multi-tab); client state caches cleared on logout; per-community subscription disposal in `community/layout` + `about`.

Infra/UI: 131 stale `.js` deleted; CI added (typecheck + build + tests); mobile stacking for the community sidebar; `chat-composer`/`chat-sheet`/`chat-message-body` de-duplication; client test suite repaired (0 running → 75 passing).

## Known open issues (verified still present at `e179da9`)

| # | Where | Issue |
|---|---|---|
| 1 | `client/src/app/app.routes.ts:66,76` | `community/:id` declared **before** `community/create`; Angular is first-match-wins, so `/main/community/create` resolves to the detail route with `id="create"`. Muted today only because the UI opens create as a modal — breaks deep links. Fix: move `create` above `:id`. |
| 2 | `server/src/usecase/auth.usecase.ts:~121` | Login returns distinct "user not found" vs "password incorrect" → email enumeration. |
| 3 | `server/src/framework/utils/jwt.service.ts:23` | `jwt.verify` doesn't pin `algorithms: ['HS256']` (defense-in-depth). |
| 4 | `server/src/usecase/auth.usecase.ts:236` | `console.log("Sending mail with options:", mailOptions)` — plaintext OTP to stdout. |
| 5 | ~~`server/src/repositories/channel.repository.ts:84`~~ | **FIXED** (PR #2, `d8c9c33`) — `deleteChannel` now `$pull`s the id from `Community.channels`. |
| 6 | `server/src/usecase/chat.usecase.ts` (~216) | Queries the `Users` model directly instead of via a repository (layering violation; also in `voiceroom.usecase.ts`, `voiceroomPresence.ts`). |
| ~~6b~~ | ~~`server/src/repositories/community.repository.ts`~~ | **FIXED** (PR #8 `aef7301`) — User schema `toJSON` transform strips `password` from every serialised response. |
| 7 | ~~`server/src/controller/community.controller.ts`~~ | **FIXED** (PR #2, `f653285`) — both controllers now route every id param through a `parseObjectId` helper that validates the raw string with `Types.ObjectId.isValid` and returns 400 before construction. Also fixed `searchAccessibleChannels`, which 400'd every call. |
| 8 | `server/src/usecase/channel.usecase.ts:~84` | `getAccessibleChannels` return type says key `voice`; runtime key is `voiceroom`. |
| 9 | client `call.service` / `voiceroom.service` | No mutual exclusion — a DM call started while in a voiceroom fights over the microphone (`NotReadableError`). |
| 10 | `client/.../chat-forward-picker` | Unlike its 7 siblings it has no full-viewport dismiss backdrop (left deliberately — different design, not a mechanical fix). |
| 11 | `render.yaml` | `TURN_*` and (locally) `GIPHY_API_KEY` undeclared; no TURN means DM calls fail behind strict NAT. |
| 12 | `server/src/framework/config/app.ts` | `CORS_ORIGIN` accepts a single exact origin → Cloudflare Pages preview deploys are blocked. |
| 13 | `server/src/framework/utils/jwt.service.ts:14` | `JWT_SECRET_KEY` non-null-asserted with no startup guard (unlike `MONGO_URI` in `db.ts`, which exits). Server boots and passes `/health`, then fails every auth call. |
| 14 | repo-wide | No ESLint/Prettier. Deliberate — no existing convention to encode, and adding one means a large reformat. |

Ops reminders: `EMAIL_USER`/`EMAIL_PASS` must be set in the Render dashboard (declared but `sync: false`), and `CORS_ORIGIN` must match the live Pages origin.
