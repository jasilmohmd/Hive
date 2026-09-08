# Community management — status

Answering directly: **community management is a skeleton, not a feature.** The data model and most backend rules are there; the membership lifecycle is broken server-side and the client only implements a fraction of it.

> **Update 2026-09-08 (PR #2, #6, #8, #9).** Server-side membership lifecycle fixed (PR #2). Membership-lifecycle UI built (PR #6): join-request panel, working "Remove member", "Request to join" for private communities, "Leave community". Community admin UI built (PR #9): edit name/description/type, delete community (type-to-confirm, server cascades roles+channels), tag add/remove. Password-hash leak in `GET /community/:id` fixed (PR #8). So nearly all of "What's broken server-side" / "What exists in the UI but doesn't do anything" / "What's missing outright" below is **no longer accurate**. **Still open:** community search + filter-by-tag/category (Tier 1 remainder), and member **role reassignment** (Tier 2).

## What actually works today

- **Create a community** — full wizard (`create-community/step-one|two|three`), creates the community, seeds 5 default roles, assigns the creator the `Owner` role. Works.
- **Browse / discover communities** — `GET /community/`, `GET /community/user`. Works.
- **View a community's About page** — name, description, icon, cover, channel list, member list, tag chips. Works (`about.component.ts`).
- **Change icon / cover image** — the only two fields `updateCommunity` is actually used for from the UI (`onCommunityIconUploaded` / `onCommunityCoverUploaded`). There's no form to edit name, description, type (public/private), or tags after creation.
- **Add a member directly** — `about.component.ts` → `openAddMemberModal()` → search any user by username/email (`FriendService.searchUserByUsername`, not restricted to friends) → `addUserToCommunity()` → `POST /community/member/add/:communityId` with the community's `Member` role. This works and is, today, **the only way anyone joins a community that isn't the creator** — including `type: 'private'` communities, which per the data model should require approval instead.
- **Channel CRUD inside a community** — create/edit/delete channel, gated on `MANAGE_CHANNELS`. Works and is reasonably complete.

## ~~What's broken server-side~~ — FIXED in PR #2 (kept for history)

> Every endpoint in this section now works. The argument-order bug (`04-known-bugs.md` #1) is fixed. Text below describes the pre-fix state.

See `04-known-bugs.md` #1 for the full trace, but in short: `community.controller.ts` calls five of its six membership usecase methods with `communityId` and `userId` swapped relative to what `ICommunityUsecase` (and the usecase implementation) declares. Concretely:

- `POST /community/request/:communityId` (send a join request) — will throw `NotFoundError: Community not found` for essentially every real call, because the usecase's `communityId` parameter actually receives the caller's user id.
- `POST /community/approve_request/:communityId` — same swap, plus an *additional* `userId`/`communityId` swap on top (both of the first two positional args are reversed).
- `POST /community/reject_request/:communityId` — same class of bug.
- `POST /community/leave/:communityId` — same.
- `POST /community/member/remove/:communityId` — same.

Only `POST /community/member/add/:communityId` has its arguments in the right order, which is presumably why it's the one path that got built on and works.

**Practical effect:** even if someone wired up "Request to join" / "Approve" / "Reject" / "Leave" buttons in the client today, calling them would fail or, worse, silently act on the wrong record, because the bug is entirely inside the controller→usecase call, independent of what the HTTP request body/params contain.

## What exists in the UI but doesn't do anything (or does the wrong thing)

- **"Join Requests" card** (`about.component.html`, the section headed "Join Requests"): renders `community.joinRequests.length` and `{{ request }}` for up to 4 entries. Two problems:
  1. `CommunityRepository.getCommunityById` (`server/src/repositories/community.repository.ts:16-19`) never `.populate('joinRequests')`, so each `request` is a raw Mongo `ObjectId` string, not a user — the card would literally show hex strings like `65f3a2b1c9d4e5f6a7b8c9d0`, not usernames.
  2. The **"Manage" button next to it has no `(click)` handler at all** — it's `permissions.includes('MANAGE_MEMBERS')`-gated but calls nothing. There is no code path anywhere that would let an admin approve or reject a join request from the UI, even ignoring the backend bug above.
- **"Remove" button in the member-management modal** (`about.component.ts` `manageMembers()` → `handleModalAction()`): the member table's "Remove" action and the channel table's "Delete" action both route through the same `handleModalAction(event)` method, which — for a `delete` action — sets `this.channelToDelete = event.item` and, on confirm, calls `this.deleteChannel(this.communityId, this.channelToDelete._id)`. That's `ChannelService.deleteChannel`, i.e. `DELETE /channel/delete/:communityId/:channelId`, called with a **member's** `_id` as the channel id. Clicking "Remove" on a member will not remove them; it will issue a channel-deletion request that should 404 (or, in the worst case if IDs ever collided with a real channel, delete the wrong channel). `CommunityService.removeMember()` exists and is correctly implemented but is never called from anywhere.
- **"Manage" (edit) button on a member row**: routes to the same generic edit modal used for channels (`this.listModal.startCreate(); this.listModal.patchForm(event.item)`), but the member modal's `modalData` never sets `createFields`, so there's no actual form for changing a member's role — there is no "change this member's role" UI at all, consistent with `RoleService` not exposing `updateRole`/`getRoleById` in a way the UI uses.

## What's missing outright

- Delete a community (`DELETE /community/delete/:communityId` has no client caller).
- Edit a community's name / description / type / tags after creation (`addTag`/`removeTag` have no client callers either, and — separately — no predefined role grants the `MANAGE_TAG` permission those two routes require; see `03-rbac-status.md`).
- Any UI for categories (`GET /community/categories` unused; `CommunityCategory` model + seed data exist but are dead weight today).
- Community search (`GET /community/search` unused — `discover` presumably filters the already-fetched list client-side).
- Filter-by-tag / filter-by-category (`filterCommunitiesByTag`/`filterCommunitiesByCategory` unused).
- Transfer ownership / demote-the-owner protection: `leaveCommunity` and `removeMember` have no check preventing the `Owner` from leaving or being removed, which would strand the community with no one holding `MANAGE_COMMUNITY`/`MANAGE_ROLES` (moot right now since both call paths are broken, but worth fixing at the same time).
- Ban vs. kick distinction: there's a `KICK_MEMBERS` permission in the role model that nothing checks (see `03-rbac-status.md`) and no "ban" concept at all — a removed member could immediately re-request or be re-added.

## Bottom line

Treat "community management" as roughly **50% done** post-PR-#2: creation, browsing, channel management, a workaround join flow (direct-add), **and the full server-side membership lifecycle** (request / approve / reject / leave / remove, with owner protection) now work. What's left is entirely **frontend**: the UI never calls the join-request endpoints, "Remove member" is wired to `deleteChannel`, the "Manage" button on Join Requests has no handler, and there's no leave/delete/edit-details UI. That's Tier 1 in `05-roadmap-todo.md`.
