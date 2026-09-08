# Tier 1 plan — finish community management (membership lifecycle)

Written 2026-09-08 after Tier 0 landed (`main` at `4e5ad84`). This is the agreed build plan for the **membership lifecycle** slice of Tier 1 (`05-roadmap-todo.md` Tier 1 items 1–5). Delete-community, edit-details, tag management and search/filter are **deferred** to a later pass.

> **✅ DONE — PR #6, merged to `main` at `915355e` (2026-09-08).** All five items shipped. Commits: `d0e5aeb` (service methods), `fdf0900` (remove-member fix), `1c90265` (join-request panel), `9afdb3b` (request-to-join), `c3d3a77` (leave UI). Verified live end-to-end (register → private community → request → approve → member leaves; owner-leave/remove rejected) plus a Playwright UI pass with screenshots. `ng test` 79/79.
>
> **Follow-up found during verification — FIXED (PR #8 `aef7301`):** `GET /community/:id` leaked bcrypt password hashes for members + requesters. Fixed with a User-schema `toJSON` transform.
>
> **Beyond items 1–5 — the rest of community admin also shipped (PR #9):** edit name/description/type, delete community (type-to-confirm; server-side `deleteCommunity` now cascades `Role` + `Channel` docs), tag add/remove, plus a reusable `confirmPhrase` on `common-modal`. Verified live (API + Playwright). **Only Tier 1 item left: community search / filter-by-tag/category** (`05-roadmap-todo.md` item 7).

## Decisions locked

| Decision | Choice |
|---|---|
| Public vs private join | **Private only.** `type: 'public'` communities keep instant direct-add (`addMember`). Only `type: 'private'` uses request → approve. |
| Approve-request role | **Auto-assign the "Member" role** (same lookup as `about.component.ts` `addUserToCommunity()`). No role picker. |
| Delete-community orphan cleanup | Deferred (delete UI itself is out of this pass). When built: `deleteCommunity` usecase currently deletes only the community doc — `Role` and `Channel` docs are orphaned. Needs a cascade. |
| Scope this pass | **Items 1–5 only.** |

## Branch / PR

`feat/community-management-tier1` off `main`. One PR, commit-per-item. Verify with the `run` skill (Angular client + Express backend) before review — manually walk a private-community request → approve → leave cycle.

## Items

### 1. `community.service.ts` methods (foundation commit)
Add, matching existing style (plain-body POSTs, `map`/`catchError`, `handleError`):
- `requestToJoinCommunity(communityId: string)` → `POST /community/request/:communityId`
- `approveJoinRequest(communityId: string, memberId: string, roleId: string)` → `POST /community/approve_request/:communityId`, body `{ memberId, roleId }`
- `rejectJoinRequest(communityId: string, memberId: string)` → `POST /community/reject_request/:communityId`, body `{ memberId }`
- `leaveCommunity(communityId: string)` → `POST /community/leave/:communityId`

All return `{ success: boolean }`. (`deleteCommunity` / `addTag` / `removeTag` NOT added this pass.)

### 2. Fix "Remove member" (`04-known-bugs.md` #2)
- In `about.component.ts`, stop routing the member table's "Remove" through `handleModalAction` → `channelToDelete` → `deleteChannel`.
- Add dedicated `memberToRemove` + `showRemoveMemberModal` state and a confirm modal ("Remove **{{name}}** from the community?").
- Call `communityService.removeMember(communityId, <userId>)`. **Watch out:** `manageMembers()` maps `_id: member._id` (the member subdoc id); `removeMember` needs the **user** id (`member.userId._id`). Fix the mapping or pass the right field.
- Hide/disable "Remove" on the owner's row (`member.userId._id === community.ownerId._id`). Backend rejects it anyway (PR #2 owner guard) — don't render a dead button.
- On success: `communityStateService.loadCommunity(id, true)`, refresh modal data, toast.

### 3. Join-request panel (`04-known-bugs.md` #3, the core ask)
- Wire the Join Requests card "Manage" button `(click)` (currently none) — already gated `*ngIf="permissions.includes('MANAGE_MEMBERS')"`.
- New standalone `community-join-requests` component (or reuse `list-modal`): row per `community.joinRequests` entry (populated user docs since PR #2 — `userName`, `profilePicture`, `_id`), each with **Approve** / **Reject**.
- Approve: look up the "Member" role in `community.roles`, call `approveJoinRequest(communityId, request._id, memberRoleId)`.
- Reject: `rejectJoinRequest(communityId, request._id)`.
- Fix the card body template: `{{ request }}` → `{{ request.userName }}`.
- After any action: reload community, re-render, toast.

### 4. "Request to join" (private communities only)
- Button in `discover` (and/or community layout) shown when: `community.type === 'private'` AND current user is not in `community.members` AND not already in `community.joinRequests`.
- Needs the current user id — resolve once via `UserAuthService.getUserDetails()` (or existing profile/user state if one exists — check first).
- `requestToJoinCommunity(community._id)`; on success disable the button and show "Request sent".
- Public communities: leave the existing behaviour (direct-add by a member with `MANAGE_MEMBERS`).

### 5. "Leave community" UI
- Button in `about` (secondary/overflow area), **hidden for the owner** (`community.ownerId._id === currentUserId`) — backend rejects it (PR #2).
- Confirm modal → `leaveCommunity(communityId)` → on success `router.navigate(['/main/discover'])` and refresh the sidebar list (`main/layout` `loadCommunities`, likely via `CommunityStateService` / a shared refresh).

## Known server contracts (verified at `4e5ad84`)

- `requestToJoinCommunity` usecase: rejects if already a member or a duplicate request; adds to `joinRequests`.
- `approveJoinRequest`: `MANAGE_MEMBERS` check; repo `approveJoinRequest(communityId, memberId, roleId)` pushes to `members`, pulls from `joinRequests`.
- `rejectJoinRequest`: `MANAGE_MEMBERS` check; `$pull` from `joinRequests`.
- `leaveCommunity`: owner guard (throws `ValidationError`), then `removeMember(communityId, userId)`.
- `removeMember`: `MANAGE_MEMBERS` check + owner guard.
- All controller id params now validated via `parseObjectId` (400 on malformed).

## Out of scope (future Tier 1 / Tier 3)

Delete community (+ orphan cascade), edit name/description/type, tag management on existing communities, community search, filter-by-tag/category, `channel.service` search. See `05-roadmap-todo.md`.
