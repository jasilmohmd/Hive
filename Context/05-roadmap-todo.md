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
7. ~~**Community search + filter-by-tag**~~ ✅ **PR #10.** Discover now has a name/description search box and a tag-filter dropdown, both applied **client-side** over the already-loaded `listCommunities()` result (instant, composable, no extra requests for a small list). **Decision:** the server endpoints `GET /community/search`, `/filter_by_tag/:tagId`, `/filter_by_category/:categoryId` remain **unused by design** — if the community count ever grows large enough to need server-side paging, switch Discover to them then. The `CommunityCategory` model + `GET /community/categories` + `/filter_by_category` have no UI and no plausible near-term use — **recommend deleting them** in a cleanup pass (seed script `seedCategories.ts`, `communityCategory.model.ts`, the category usecase/repo/controller methods, the two routes).

**Tier 1 is now complete** except the deliberately-deferred category removal above.

## Tier 2 — finish RBAC / role management (the other thing the owner asked about)

> **Tier 2 COMPLETE.** `08-tier2-plan.md`. **PR A (#12):** server endpoints + service methods. **PR B (#13):** roles CRUD screen. **PR C (#14):** member role editor, Kick-vs-Remove, role badges. Remaining RBAC items are the opportunistic ones in Tier 3 (dead `CommunityCategory`, `VIEW_CONTENT`/`SEND_MESSAGES` enforcement intent).


1. ~~**Build a Roles screen**~~ ✅ **PR #13.** `RolesModalComponent` — list/create/edit/delete, defaults read-only. `role.service.ts` gained all six methods in PR #12.
2. ~~**Role assignment for existing members**~~ ✅ server PR #12, UI PR #14 (member modal "Roles" per-member checkbox editor).
3. ~~**Decide `KICK_MEMBERS`'s fate**~~ ✅ **PR #12** — real narrower kick (`POST /community/kick/:communityId`); UI (Kick vs Remove) **PR #14**.
4. ~~**Role badges in the member list**~~ ✅ **PR #14** — coloured pills per role via a `common-table` `roleBadges` column.
5. Confirm intent for `VIEW_CONTENT`/`SEND_MESSAGES` (`03-rbac-status.md`) — either find/add their enforcement points or document that they're reserved for future use.

## Tier 3 — smaller things worth doing opportunistically

- **`GET /community/:id` leaks bcrypt password hashes** for every populated member and (since PR #2) every join requester. Add a `-password` projection to the `getCommunityById` populate, or a `toJSON`/`toObject` transform on the User model that strips `password`. Found during PR #6 verification. Also in `04-known-bugs.md` / `HANDOFF.md`.
- `channel.service.ts` is missing a `search` method for `GET /channel/search/:communityId` — cheap to add if/when a channel search box is wanted.
- Resolve what `GET /auth/userDetails/:id` is for (`01-backend-frontend-gap-analysis.md`) — wire it up or remove it.
- Tighten the four "empty result → 404" usecases (`04-known-bugs.md` #6) to return `[]`, and have `layout.component.ts`'s `loadCommunities()` explicitly handle its error case instead of only logging.
- Cleanup pass on stray `console.log`s in controllers/components (`04-known-bugs.md` #7) — not urgent, but easy to batch with other work in the same files.

## Everything in `HANDOFF.md`'s table, unchanged

Still open, still worth doing, not repeated here in detail — see that file's "Known open issues" table (14 items: route-order bug in `app.routes.ts`, email enumeration on login, unpinned JWT algorithm, OTP-to-stdout logging, dangling channel refs on delete, layering violations querying `Users` directly, the `Types.ObjectId(undefined)` dead-guard pattern, the `voice`/`voiceroom` key mismatch, DM-call/voiceroom mic contention, the intentionally-different `chat-forward-picker` backdrop, missing `TURN_*`/`GIPHY_API_KEY` env vars, single-origin CORS blocking Pages previews, no startup guard on `JWT_SECRET_KEY`, and the deliberate absence of ESLint/Prettier).

## What's *not* on this list because it's already solid

Chat (text/media/reactions/polls/link previews), DM calls (WebRTC P2P + signaling), voicerooms (LiveKit), friends (request/accept/reject/block/search/online-status), auth (register/login/OTP/password reset/JWT), and profile management are all implemented on both sides and don't need discovery work — just the fixes HANDOFF.md already tracks for a few of them.
