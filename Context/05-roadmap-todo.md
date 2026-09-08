# Roadmap / TODO — continuing work

A prioritized punch list built from `01`–`04` in this folder plus `HANDOFF.md`'s existing issue table. Structured so a Claude Code session can work top-down.

## Tier 0 — fix before building anything new on top

These are cheap, high-leverage, and everything in Tier 1 depends on at least one of them.

1. **Fix the argument-order bug in `community.controller.ts`** (`04-known-bugs.md` #1). Five call sites, one-line swaps each. Unblocks join requests, approve/reject, leave, and remove-member.
2. **Add `"MANAGE_TAG"` to the `Owner`/`Admin` permission sets** in `predifinedRoles.ts` (`04-known-bugs.md` #4). One line.
3. **Add owner-loss guards** to `leaveCommunity`/`removeMember` while you're already touching that file for #1 (`04-known-bugs.md` #8) — don't ship the argument fix without this, or you'll immediately regress into "owner can accidentally orphan their own community."
4. **Populate `joinRequests` in `CommunityRepository.getCommunityById`** (`04-known-bugs.md` #3) so the data is even usable once a UI exists.

Also apply while in these files: the existing `HANDOFF.md` items that are one-liners in the same neighborhood — `channel.repository.ts` `deleteChannel` not `$pull`ing from `Community.channels` (their #5), the `Types.ObjectId(undefined)` dead-guard pattern in `community.controller.ts`/`channel.controller.ts` (their #7).

## Tier 1 — finish community management (the feature the owner asked about)

Ordered as a sensible build sequence, each depending on Tier 0 being done first:

1. **Join-request UI.** A community's About page (or a dedicated "Requests" panel) needs: a list of pending requesters (fix the populate first — #4 above — so you get usernames/avatars, not ids), and Approve/Reject buttons wired to `CommunityService` methods that don't exist yet (`requestToJoinCommunity`, `approveJoinRequest`, `rejectJoinRequest` need to be added to `community.service.ts` — they're missing entirely, see `01-backend-frontend-gap-analysis.md`). Also add a "Request to join" button somewhere reachable for `type: 'private'` communities discovered via `discover` — right now the only join path is direct-add by an existing member with `MANAGE_MEMBERS`.
2. **Fix "Remove member"** to call `communityService.removeMember()` instead of `deleteChannel()` (`04-known-bugs.md` #2) — give it its own confirm-dialog state rather than sharing `channelToDelete`.
3. **"Leave community" UI** — doesn't exist anywhere in the client today. Add `leaveCommunity` to `community.service.ts` and a button (probably in the About page's overflow menu or a settings screen).
4. **"Delete community" UI** — `deleteCommunity` has no client caller at all. Gate on `MANAGE_COMMUNITY`, put it somewhere deliberately hard to hit by accident (confirm modal, type-the-name-to-confirm pattern is common for this).
5. **Edit community details** — currently only icon/cover can be changed from the UI. Add a form for name/description/type, reusing the existing `updateCommunity` call (it already accepts `Partial<ICommunity>`).
6. **Tag management on an existing community** — `addTag`/`removeTag` have no client callers; add them to `community.service.ts` once Tier 0 #2 makes them grantable.
7. Lower priority: community search (`GET /community/search`), filter-by-tag/filter-by-category, and the categories endpoint (`GET /community/categories` — decide whether the `CommunityCategory` model is still part of the plan or should be removed if categories were abandoned as a concept).

## Tier 2 — finish RBAC / role management (the other thing the owner asked about)

1. **Build a Roles screen** for `MANAGE_ROLES` holders: list roles (`listRoles` — needs adding to `role.service.ts`), create a role (`createRole` — needs adding), edit a role's name/permissions (`updateRole` — needs adding, remember `isDefault` roles are already correctly blocked server-side), delete a custom role (`deleteRole` — needs adding). All four backend endpoints exist and are correctly permission-gated; only the frontend is missing.
2. **Role assignment for existing members.** There's currently no way to change a member's role(s) after they've joined, short of a raw API call. Decide the shape: either extend `addMember`'s role param into a proper "assign role" action reachable from the member-management modal, or add a new endpoint (`role.repository.ts` already has `assignRole` — it's just currently only called internally at community-creation time for the Owner).
3. **Decide `KICK_MEMBERS`'s fate** (`04-known-bugs.md` #5) — implement it as a real, narrower-than-`MANAGE_MEMBERS` action, or remove it from the seed data so the permission list matches what's actually enforced.
4. **Role badges in the member list.** `manageMembers()` already computes `roles: member.roleIds?.map(r => r.name).join(', ')` — worth a small polish pass (colored pills per role, matching whatever visual language the rest of the redesign uses) once assignment actually works.
5. Confirm intent for `VIEW_CONTENT`/`SEND_MESSAGES` (`03-rbac-status.md`) — either find/add their enforcement points or document that they're reserved for future use.

## Tier 3 — smaller things worth doing opportunistically

- `channel.service.ts` is missing a `search` method for `GET /channel/search/:communityId` — cheap to add if/when a channel search box is wanted.
- Resolve what `GET /auth/userDetails/:id` is for (`01-backend-frontend-gap-analysis.md`) — wire it up or remove it.
- Tighten the four "empty result → 404" usecases (`04-known-bugs.md` #6) to return `[]`, and have `layout.component.ts`'s `loadCommunities()` explicitly handle its error case instead of only logging.
- Cleanup pass on stray `console.log`s in controllers/components (`04-known-bugs.md` #7) — not urgent, but easy to batch with other work in the same files.

## Everything in `HANDOFF.md`'s table, unchanged

Still open, still worth doing, not repeated here in detail — see that file's "Known open issues" table (14 items: route-order bug in `app.routes.ts`, email enumeration on login, unpinned JWT algorithm, OTP-to-stdout logging, dangling channel refs on delete, layering violations querying `Users` directly, the `Types.ObjectId(undefined)` dead-guard pattern, the `voice`/`voiceroom` key mismatch, DM-call/voiceroom mic contention, the intentionally-different `chat-forward-picker` backdrop, missing `TURN_*`/`GIPHY_API_KEY` env vars, single-origin CORS blocking Pages previews, no startup guard on `JWT_SECRET_KEY`, and the deliberate absence of ESLint/Prettier).

## What's *not* on this list because it's already solid

Chat (text/media/reactions/polls/link previews), DM calls (WebRTC P2P + signaling), voicerooms (LiveKit), friends (request/accept/reject/block/search/online-status), auth (register/login/OTP/password reset/JWT), and profile management are all implemented on both sides and don't need discovery work — just the fixes HANDOFF.md already tracks for a few of them.
