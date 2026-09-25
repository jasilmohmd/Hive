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

**Routes:** `/auth/{login,register,email_verify,otp,change_pass}` · `/main/{discover,profile,edit_profile,change_password,friends_section/{friends,online,pending,blocked,addfriend},direct_message}` · `/main/community/:id/{about,chatroom/:channelId,voiceroom/:channelId}` · `/main/community/create` (the wizard; also opened as a modal from the nav). `/main`, `/auth` and `friends_section` redirect to a default child; `**` redirects to the landing page, whose `canActivate` sends signed-in users to `/main/discover`. `direct_message` has `canDeactivate: confirmLeaveCallGuard`. Browser tab titles come from route `data.title` via `HiveTitleStrategy`.

**Shared chat components** (extracted — reuse these, don't re-inline):
- `common/chat-message-body/` — renders a bubble's contents (sticker/audio/video/file/location/contact/poll/gif/image/text). Used by both `direct-message` and `channel-chat-panel`.
- `common/chat-sheet/` — backdrop + mobile bottom-sheet / desktop dropdown chrome for all 7 composer popups. Takes `theme`, `panelClass`, `sheetTitle`.
- Both use `host: { class: 'contents' }` (`display:contents`) so the wrapper element stays out of layout. **Keep that** if you touch them.
- `chat-composer` renders one template for both themes via class getters (`containerClasses`, `inputClasses`, …) — do not re-fork it per theme.
- `directives/stick-to-bottom.directive.ts` — put `appStickToBottom [stickTrigger] [stickKey] [stickForce]` on a message list's scroll container; it opens at the newest message and follows new ones.

**Responsive layout (2026-09-25 pass)** — read before touching the shell or adding a page:
- **The shell is exactly one screen tall** (`h-dvh overflow-hidden` root). The routed `<main>` and the community pane are the scroll containers: a content page just grows and scrolls; a chat/voice view fills with `h-full`/flex and scrolls internally. Don't give pages `min-h-screen`/`100vh`.
- **`dvh`, not `vh`**, anywhere height matters on phones. Bottom-fixed UI offsets by `var(--bottom-nav-h)` + `var(--safe-bottom)` (tokens in `styles.css`); `index.html` sets `viewport-fit=cover, interactive-widget=resizes-content`.
- **Text fields are ≥16px on coarse pointers** (global rule in `styles.css`) — iOS zooms otherwise.
- **Tailwind variants** (`tailwind.config.js`): `coarse:` (finger), `hover-none:` (no hover — give hover-only affordances a visible fallback), `short:` (landscape phones: md-wide but <500px tall).
- **Phones:** bottom nav (Home, Communities sheet, Discover, Create, Channels). The community channel sidebar is a **drawer below md** (`ChannelSidebarService.mobileOpen$`, not persisted) and a collapsible column from md (`collapsed$`, persisted). `toggle()` acts on whichever the viewport uses.
- `common-table` renders **stacked cards below sm** and a table from sm; `TableAction` has `hidden` / `disabled` / `labelFor` per row.
- **Keep `voiceroom.component.css` under the 12 kB component-style warning** (it's ~11.6 kB; error at 16 kB). Put new voice-room styling in template utility classes.
- Avoid `z-index` on wrappers of anything that opens a `fixed` overlay (e.g. `image-picker-menu`'s cropper): a z-indexed ancestor traps it under the nav.

## Conventions & gotchas (these have each caused real bugs here)

1. **Compare ObjectIds with `.equals()`** — never `===`, `!==`, or `Array.includes()`. A whole class of silent no-ops (leave community, remove member, approve join, remove tag) came from this.
2. **Usecases must rethrow domain errors:** `if (error instanceof CustomError) throw error;` before any generic wrap. `error.middleware.ts` dispatches on `instanceof`; wrapping turns 404/400/401 into opaque 500s.
3. **`server/src` is TypeScript-only.** 131 stale compiled `.js` files once shadowed their `.ts` sources at runtime. Now blocked by `src/**/*.js` in `server/.gitignore` — never commit `.js` there, and never import with an explicit `.js` extension (that bypasses ts-node resolution under CommonJS).
4. **One bad spec kills the entire client suite.** A TS error in any `*.spec.ts` makes Karma abort with `Found 1 load error` and run **zero** tests — silently green-looking if tests aren't gated. CI now runs `ng test` for this reason.
5. **Dev server does not typecheck.** `nodemon` uses `ts-node/register/transpile-only`, and `noEmitOnError` is off. `tsc`/CI is the only real gate.
6. **Editor TS ≠ project TS.** Workspace TS is 5.4.5; a newer editor TS can surface diagnostics CI never sees (this is why `client/tsconfig.json` now sets an explicit `rootDir`).
7. **Confirmations: use `ConfirmDialogService.confirm({...})` (awaitable, rendered once in `AppComponent`) or a template-owned `app-common-modal`** — never `window.confirm()`.
8. **One microphone owner at a time.** DM calls (`CallService`), voice rooms (`VoiceroomService`) and voice notes all capture the mic. Accepting a call awaits `voiceroom.leaveActiveCall()` first; joining a room during a live call asks to end it; the recorder refuses while either is active. Voice-room **remote audio plays from `VoiceroomAudioComponent` in the community layout**, not from the voice-room page — don't add `<audio>` for remote tracks anywhere else.
9. **Socket listeners bind per socket instance** (a new one after logout → login) via `ChatService.onSocketReady`, which fires on every (re)connect; re-send room joins there. `ChatService.sessionEnded$` fires on logout.
10. **Git history was grafted** with `git subtree`. Old per-file history is reachable (blame works back to Jan 2025). The two original repos' other branches are preserved as `archive/frontend-*` and `archive/backend-*` refs.

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
npm run test:chat-media-url && npm run test:chat-message-content && npm run test:link-preview

# client
cd client && npm start
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.spec.json      # NOT covered by the app typecheck
CHROME_BIN="/c/Program Files/Google/Chrome/Application/chrome.exe" \
  npm test -- --watch=false --browsers=ChromeHeadless      # 113 specs, all passing
# (Linux as root: point CHROME_BIN at a wrapper that adds --no-sandbox)
npm run build
```

## Recently fixed — do not "re-fix"

Security: OTP now required for password reset; bcrypt hash no longer returned by `/auth/userDetails*`; socket `joinChat` checks membership; `/image/upload` authed + 5MB + image-only; rate limiting on `/auth/*`; regex escaping in auth lookups; membership checks on role/channel reads.

Correctness: ObjectId `.equals()` sweep; `CustomError` rethrow; cookie `secure`/`sameSite` on JWT-error clear; OTP expiry 60s → 10min; voiceroom presence keyed per-socket (multi-tab); client state caches cleared on logout; per-community subscription disposal in `community/layout` + `about`.

2026-09-25 responsive + fixes pass: see `Context/05-roadmap-todo.md` → "Responsive + fixes pass". Highlights — content pages scroll again; phones reach their communities; channel drawer; DM-call vs voice-room mic handoff (#9); voice-room audio survives navigation; sockets re-bind after re-login and re-join rooms after reconnect; list-modal `@slideInOut` crash; `common-modal` Escape; safe, non-fatal link previews; server-only call logs; ring timeout + ringing-callee busy.

Infra/UI: 131 stale `.js` deleted; CI added (typecheck + build + tests); mobile stacking for the community sidebar; `chat-composer`/`chat-sheet`/`chat-message-body` de-duplication; client test suite repaired (0 running → 75 passing).

## Known open issues (verified still present at `e179da9`)

| # | Where | Issue |
|---|---|---|
| ~~1~~ | ~~`client/src/app/app.routes.ts`~~ | **FIXED** (PR #16) — `community/create` now precedes `community/:id`. |
| ~~2~~ | ~~`server/src/usecase/auth.usecase.ts`~~ | **FIXED** (PR #18) — login returns one generic 401 for unknown-email and wrong-password, with a dummy bcrypt compare to keep timing even. |
| ~~3~~ | ~~`server/src/framework/utils/jwt.service.ts`~~ | **FIXED** (PR #16) — `algorithm`/`algorithms: ['HS256']` pinned on sign and verify. |
| ~~4~~ | ~~`server/src/usecase/auth.usecase.ts:236`~~ | **FIXED** (PR #15) — the OTP mail-options / send-result `console.log`s are gone. |
| 5 | ~~`server/src/repositories/channel.repository.ts:84`~~ | **FIXED** (PR #2, `d8c9c33`) — `deleteChannel` now `$pull`s the id from `Community.channels`. |
| ~~6~~ | ~~`server/src/usecase/chat.usecase.ts`~~ | **FIXED** (PR #23) — new `UserRepository.findPublicProfileById` (+ `IUserRepository`); `ChatUseCase` and `VoiceroomUseCase` take it as a constructor dep, `voiceroomPresence` uses a module-level instance. No usecase/util imports `user.model` directly any more. |
| ~~6b~~ | ~~`server/src/repositories/community.repository.ts`~~ | **FIXED** (PR #8 `aef7301`) — User schema `toJSON` transform strips `password` from every serialised response. |
| ~~8~~ | ~~`server/src/usecase/channel.usecase.ts`~~ | **FIXED** (PR #17) — the `getAccessibleChannels` return-type key is `voiceroom` (the real runtime key), was `voice`, in the server usecase/interfaces and `client/channel.service.ts`. |
| 8 | `server/src/usecase/channel.usecase.ts:~84` | `getAccessibleChannels` return type says key `voice`; runtime key is `voiceroom`. |
| ~~9~~ | ~~client `call.service` / `voiceroom.service`~~ | **FIXED** (2026-09-25 pass) — accepting a DM call awaits the voice-room leave before taking the mic (the modal says it will), joining a room during a live call asks first, leaving a DM mid-call asks first, voice notes refuse while a room holds the mic. |
| 10 | `client/.../chat-forward-picker` | Unlike its 7 siblings it has no full-viewport dismiss backdrop (left deliberately — different design, not a mechanical fix). |
| ~~11~~ | ~~`render.yaml`~~ | **FIXED** (PR #24) — `TURN_URL`/`TURN_USERNAME`/`TURN_CREDENTIAL` declared (`sync: false`); `GIPHY_API_KEY` added to `.env.example`. Set real TURN values in the Render dashboard to actually get a relay. |
| ~~12~~ | ~~`server/src/framework/config/app.ts`~~ | **FIXED** (PR #24) — `CORS_ORIGIN` is now a comma-separated allow-list; optional `CORS_ORIGIN_SUFFIXES` matches host suffixes (e.g. `.pages.dev`) so preview deploys pass. Same check on Express + Socket.IO. |
| ~~13~~ | ~~`server/src/framework/utils/jwt.service.ts`~~ | **FIXED** (PR #16) — `server.ts` exits on a missing `JWT_SECRET_KEY` at startup. |
| 14 | repo-wide | No ESLint/Prettier. Deliberate — no existing convention to encode, and adding one means a large reformat. |

Ops reminders: `EMAIL_USER`/`EMAIL_PASS` must be set in the Render dashboard (declared but `sync: false`), and `CORS_ORIGIN` must include the live Pages origin (comma-separate multiple; set `CORS_ORIGIN_SUFFIXES` for preview-deploy subdomains).

Still open after the 2026-09-25 pass: #10 (deliberate) and #14 (deliberate). Everything else in this table is fixed.
