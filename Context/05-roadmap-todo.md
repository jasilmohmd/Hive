# Roadmap / TODO — continuing work

A prioritized punch list built from `01`–`04` in this folder plus `HANDOFF.md`'s existing issue table. Structured so a Claude Code session can work top-down.

## Tier 0 — ✅ DONE (PR #2, merged to `main` at `aecbd00`, 2026-09-08)

All Tier 0 items shipped. Seven commits on `fix/community-management-tier0`:

| Item | Commit | Note |
|---|---|---|
| Argument-order bug (`04` #1) | `e9ecffd` | 5 call sites swapped; `implements ICommunityController`; debug logs removed |
| `MANAGE_TAG` grant (`04` #4) | `429ed97` | Owner + Admin. **New communities only** — existing role docs not backfilled |
| Owner-loss guard (`04` #8) | `89454a5` | `isCommunityOwner` check in `leaveCommunity` / `removeMember` |
| Populate `joinRequests` (`04` #3) | `f3013a5` | server half only; the approve/reject UI is Tier 1 |
| `deleteChannel` `$pull` (`HANDOFF` #5) | `d8c9c33` | |
| Empty list → `[]` (`04` #6) | `17831cf` | server half; `layout.component.ts` error handling still Tier 3 |
| `parseObjectId` validation (`HANDOFF` #7) | `f653285` | also fixed `searchAccessibleChannels` 400-on-every-call |

Verified: `tsc --noEmit` clean, `npm run build` clean. No endpoint tests exist in the repo.

Line-ending noise from the `.gitattributes` added in the redesign pass was normalized separately in PR #3 (`chore/normalize-line-endings`, merged).

## Tier 1 — finish community management (the feature the owner asked about) — ⏳ IN PROGRESS

**Items 1–5 (membership lifecycle) — ✅ DONE, PR #6.** Join-request panel, remove-member fix, request-to-join (private only), leave-community, + four `CommunityService` methods.
**Items delete / edit-details / tag-management — ✅ DONE, PR #9.** (+ server-side delete cascade, + `common-modal` `confirmPhrase`, + password-leak fix PR #8.)
**Community search + tag filter — ✅ DONE, PR #10** (client-side over the loaded list; server search endpoints left unused by design — item 7 below).
**Tier 1 is complete.** Next: Tier 2 (RBAC / role management).

Original list (strikethrough = shipped in PR #6):

1. ~~**Join-request UI.**~~ ✅ Panel + Approve/Reject + `requestToJoinCommunity`/`approveJoinRequest`/`rejectJoinRequest` service methods. "Request to join" added to Discover for private communities. A community's About page (or a dedicated "Requests" panel) needs: a list of pending requesters (fix the populate first — #4 above — so you get usernames/avatars, not ids), and Approve/Reject buttons wired to `CommunityService` methods that don't exist yet (`requestToJoinCommunity`, `approveJoinRequest`, `rejectJoinRequest` need to be added to `community.service.ts` — they're missing entirely, see `01-backend-frontend-gap-analysis.md`). Also add a "Request to join" button somewhere reachable for `type: 'private'` communities discovered via `discover` — right now the only join path is direct-add by an existing member with `MANAGE_MEMBERS`.
2. ~~**Fix "Remove member"**~~ ✅ Own confirm modal + state, calls `removeMember` with the member's user id, hidden on the owner row (`04-known-bugs.md` #2).
3. ~~**"Leave community" UI**~~ ✅ Button on About (hidden for owner), confirm → `leaveCommunity` → navigate to Discover; sidebar refreshes via `CommunityStateService.membershipChanged$`.
4. ~~**"Delete community" UI**~~ ✅ **PR #9.** Type-the-name-to-confirm modal (`common-modal` gained a `confirmPhrase` input), gated `MANAGE_COMMUNITY`; navigates to Discover + refreshes the sidebar. Server-side `deleteCommunity` now cascades the community's `Role` + `Channel` docs (was orphaning them). Channel messages/chats still not cascaded — same gap as `deleteChannel`.
5. ~~**Edit community details**~~ ✅ **PR #9.** "Manage Community" button opens a name/description/type form (reuses `updateCommunity`).
6. ~~**Tag management on an existing community**~~ ✅ **PR #9.** Tags card "Manage" button opens a modal — removable chips + add-from-all-tags picker. `addTag`/`removeTag` added to `community.service.ts`. Works for communities created after PR #2 (Owner/Admin have `MANAGE_TAG`); older communities need a role backfill.
7. ~~**Community search + filter-by-tag**~~ ✅ **PR #10.** Discover has a name/description search box + tag-filter dropdown, applied **client-side** over the loaded `listCommunities()` result. `GET /community/search` / `/filter_by_tag` stay unused for now (switch to them if the list needs paging). **`CommunityCategory` is being kept** — the owner wants communities categorised by their tags as a future feature (build on `/community/categories` + `/filter_by_category` + the tag `categories` field, which is why `seedTags.ts` assigns category ids). Do **not** delete it.

**Tier 1 is now complete** except the deliberately-deferred category removal above.

## Tier 2 — finish RBAC / role management (the other thing the owner asked about)

> **Tier 2 COMPLETE.** `08-tier2-plan.md`. **PR A (#12):** server endpoints + service methods. **PR B (#13):** roles CRUD screen. **PR C (#14):** member role editor, Kick-vs-Remove, role badges. Remaining RBAC items are the opportunistic ones in Tier 3 (dead `CommunityCategory`, `VIEW_CONTENT`/`SEND_MESSAGES` enforcement intent).


1. ~~**Build a Roles screen**~~ ✅ **PR #13.** `RolesModalComponent` — list/create/edit/delete, defaults read-only. `role.service.ts` gained all six methods in PR #12.
2. ~~**Role assignment for existing members**~~ ✅ server PR #12, UI PR #14 (member modal "Roles" per-member checkbox editor).
3. ~~**Decide `KICK_MEMBERS`'s fate**~~ ✅ **PR #12** — real narrower kick (`POST /community/kick/:communityId`); UI (Kick vs Remove) **PR #14**.
4. ~~**Role badges in the member list**~~ ✅ **PR #14** — coloured pills per role via a `common-table` `roleBadges` column.
5. ~~Confirm intent for `VIEW_CONTENT`/`SEND_MESSAGES`~~ ✅ **PR #19** + **PR #21** — enforced in the channel/chat layer (Guest reads but can't post); PR #21 extended it to reactions/poll-votes (`SEND_MESSAGES`) and voiceroom join (`VIEW_CONTENT`), and converted `chat.usecase` client-fault errors from bare `Error` (500) to `CustomError` (404/400/401).

## Tier 3 — smaller things worth doing opportunistically

- ~~**`GET /community/:id` leaks bcrypt password hashes**~~ ✅ **PR #8** — User model `toJSON` transform strips `password`.
- `channel.service.ts` is missing a `search` method for `GET /channel/search/:communityId` — **left unbuilt by decision (PR #22):** no channel-search UI exists, so a service method would be dead code. Add it alongside the UI if one is ever wanted.
- ~~Resolve what `GET /auth/userDetails/:id` is for~~ ✅ **PR #22** — it *is* used (`friends.service.getUserDetails(friendId)` → incoming-call modal, channel-chat-panel, direct-message). Kept; added an ObjectId-validity guard (400 instead of 500 on garbage input).
- ~~have `layout.component.ts`'s `loadCommunities()` explicitly handle its error case~~ ✅ **PR #22** — now toasts on failure and keeps the existing list instead of only `console.log`. (The four "empty result → 404" usecases were already fixed to return `[]` in PR #2.)
- Cleanup pass on stray `console.log`s in controllers/components (`04-known-bugs.md` #7) — not urgent, but easy to batch with other work in the same files.

## Backlog pass 2026-09-10 (PRs #21–#24)

- **PR #21** — PR #19 follow-ups: reactions/poll-votes gated on `SEND_MESSAGES`, voiceroom join on `VIEW_CONTENT`, `chat.usecase` error-type cleanup.
- **PR #22** — Tier 3 minor: `GET /auth/userDetails/:id` kept (it's used) + id guard; `layout.loadCommunities()` toasts on error; channel-search method left unbuilt by decision.
- **PR #23** — HANDOFF #6: new `UserRepository` / `IUserRepository`; `chat`/`voiceroom` no longer import the `Users` model directly.
- **PR #24** — HANDOFF #11/#12: multi-origin CORS + `CORS_ORIGIN_SUFFIXES`; `render.yaml` declares `TURN_*`.

**Left open after this pass:** HANDOFF #9 (DM-call vs voiceroom mic contention — client-side, needs real design), #10 / #14 (both deliberate). No other backlog items remain.

## Responsive + fixes pass — 2026-09-25 (branch `claude/inspiring-mendel-cvs180`)

A client-wide audit (phones 360–430px, tablets, landscape phones) plus the call/socket code. One commit per phase:

| Phase | What |
|---|---|
| **A — shell** | Content pages (Discover, Profile, Edit profile, Change password, About) had **no scroll container** and were cut off below the fold — root is now `h-dvh`, routed `<main>` + community pane scroll. Phones couldn't reach joined communities (rail was md+ only) → labelled bottom nav + **Communities bottom sheet** (`common/bottom-sheet`). `dvh` + safe-area tokens, 16px inputs on touch (iOS zoom), `coarse:`/`hover-none:`/`short:` variants, toasts above the nav, header Settings link. Routing: landing `canActivate`, default-child redirects, `**`, UrlTree guard. `HiveTitleStrategy`. |
| **B — calls/voice** | **HANDOFF #9 fixed** (confirm-then-switch; accept awaits the room leave). **Voice-room audio no longer dies when you navigate away** (`VoiceroomAudioComponent` in the community layout). Mute/deafen streams (deafen is new). Failed room join no longer leaves a ghost participant. Sockets: `onSocketReady` fires on first connect too; call/voice/presence re-bind per socket instance (**logout → login in one tab works**); chat rooms and room presence re-joined after reconnect. Second incoming call no longer overwrites the first; second tab no longer answers the offer. `ConfirmDialogService` replaces `confirm()`; `confirmLeaveCallGuard`. `common-modal` Escape fixed. |
| **C — community on phones** | Channel sidebar is a **slide-over drawer below md** (column from md, unchanged). Sidebar mic/deafen/settings wired. Community load failure shows an error + retry (was blank). Presence watches ref-counted; channel list diffs its watches. Role loads tracked per community. |
| **D — per screen** | Chat bubbles wrap long URLs; `appStickToBottom` (open at newest, follow, keyboard); compact DM header + back; composer/sheets/context-menu touch sizes. Voice room: chat overlays below lg, lobby scrolls, dock/tray fit, idle-fade transform bug. Call overlay wraps. About: wrapping action row, no stacking-context cropper trap, lg two-column, `+N more`, Join Requests only for `MANAGE_MEMBERS`, default-image fallbacks. `list-modal` **`@slideInOut` crash** removed, scrolls. `common-table` cards below sm. Friends: scroll tabs, real empty/loading/error states, in-flight/“Requested” states, `switchMap` search. Profile: one toast, prefilled username, Cancel. Wizard: scrolls, retryable error (overlay used to stick), new community appears + opens. Auth/landing mobile fixes. |
| **E — client errors** | About refreshes keep data + toast on failure (a failed refresh blanked the page). Channel list error + retry. Logout disconnects only after success. `console.*` removed from client. |
| **F — server** | Link previews **never block sending** and are SSRF-hardened (validated lookup, no pooled sockets, manual re-validated redirects, streamed size cap). Clients can't send `type:"call"`. Ringing callee = busy; 45s ring timeout → missed; disconnect ends a call only when it was the user's last socket (8s grace); accept/callId validation. Data-dumping `console.log`s removed. New `npm run test:link-preview` (in CI). |

**Verification:** `tsc` (app + spec) clean, 113/113 client specs, `ng build` within budgets (initial ≈1.40 MB of 1.5 MB error budget — lazy-loading routes is the next lever if it grows), server `tsc` + build + 3 self-tests. Screens were checked in Playwright at 360/390/768/844×390/1280 against a mocked API (no horizontal overflow except the Friends tab row, which scrolls by design). **Not exercised here:** real WebRTC/LiveKit — see the manual checklist in the PR/hand-off notes.

**Deliberately not done:** lazy-loaded routes; a 401→logout interceptor (permission denials are also 401 server-side); a route-independent DM call overlay; channel search UI; `chat-forward-picker` backdrop (#10).

## Everything in `HANDOFF.md`'s table, unchanged

Still open, still worth doing, not repeated here in detail — see that file's "Known open issues" table (14 items: route-order bug in `app.routes.ts`, email enumeration on login, unpinned JWT algorithm, OTP-to-stdout logging, dangling channel refs on delete, layering violations querying `Users` directly, the `Types.ObjectId(undefined)` dead-guard pattern, the `voice`/`voiceroom` key mismatch, DM-call/voiceroom mic contention, the intentionally-different `chat-forward-picker` backdrop, missing `TURN_*`/`GIPHY_API_KEY` env vars, single-origin CORS blocking Pages previews, no startup guard on `JWT_SECRET_KEY`, and the deliberate absence of ESLint/Prettier).

## What's *not* on this list because it's already solid

Chat (text/media/reactions/polls/link previews), DM calls (WebRTC P2P + signaling), voicerooms (LiveKit), friends (request/accept/reject/block/search/online-status), auth (register/login/OTP/password reset/JWT), and profile management are all implemented on both sides and don't need discovery work — just the fixes HANDOFF.md already tracks for a few of them.
