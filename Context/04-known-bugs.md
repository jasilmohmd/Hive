# Known bugs — this pass

New findings from this review, verified by reading the actual code at commit `597fb1b`. These are **in addition to** `HANDOFF.md`'s "Known open issues" table (14 items, still valid — see `00-START-HERE.md`), not a replacement for it. Ordered by severity/impact.

---

## 1. `community.controller.ts` calls 5 of 6 membership usecase methods with swapped arguments (critical)

**File:** `server/src/controller/community.controller.ts`
**Also see:** `server/src/usecase/community.usecase.ts`, `server/src/interfaces/usecase/ICommunity.usecase.interface.ts`

`ICommunityUsecase` declares (and `CommunityUseCase` implements) every membership method as `(userId, communityId, ...)`. The controller — typed against that same interface — calls five of them with the first two arguments reversed:

| Method | Interface signature | Controller actually calls with |
|---|---|---|
| `requestToJoinCommunity` | `(userId, communityId)` | `(communityId, userId)` |
| `approveJoinRequest` | `(userId, communityId, memberId, roleId)` | `(communityId, userId, memberId, roleId)` |
| `rejectJoinRequest` | `(userId, communityId, memberId)` | `(communityId, userId, memberId)` |
| `leaveCommunity` | `(userId, communityId)` | `(communityId, userId)` |
| `removeMember` | `(userId, communityId, memberId)` | `(communityId, userId, memberId)` |
| `addMember` | `(userId, communityId, memberId, roleId)` | `(userId, communityId, memberId, roleId)` — **correct, not affected** |

Because `userId` and `communityId` are both plain `Types.ObjectId`, TypeScript's structural typing accepts the call either way — this compiles cleanly and `tsc --noEmit` will not catch it. At runtime, each affected usecase's `communityId` parameter receives the caller's user id instead, so `this.communityRepository.getCommunityById(communityId)` looks up a community using a user id and (for `requestToJoinCommunity`) throws `NotFoundError: Community not found` for essentially every legitimate call — a real community id and a real user id colliding is astronomically unlikely. `approveJoinRequest`/`rejectJoinRequest` are additionally passing the wrong value as `userId` into the `MANAGE_MEMBERS` permission check.

**Fix:** swap the argument order back to match the interface in all five call sites in `community.controller.ts`. Then add `implements ICommunityController` (it's currently missing — the class declares `class CommunityController {` with no `implements` clause) so a future refactor gets compiler help; note that alone wouldn't have caught *this* bug since the mismatch is controller→usecase, not controller→interface, but it's good hygiene. Consider also giving `userId`/`communityId` distinct nominal types (e.g. branded types) if this class of bug is a concern going forward — same-shaped ID params silently swapping is easy to reintroduce.

**Blast radius:** join requests, approving/rejecting join requests, leaving a community, and removing a member are all non-functional. This is almost certainly why none of them are wired up from the frontend (`02-community-management-status.md`) — they may well have been tried and appeared broken.

---

## 2. "Remove member" button calls channel deletion, not member removal

**File:** `client/src/app/component/main/community/about/about.component.ts` (`manageMembers()`, `handleModalAction()`)

The member-management modal and the channel-management modal share one generic list-modal component and one handler, `handleModalAction(event)`. For `action: 'delete'`, the handler unconditionally does:

```ts
this.channelToDelete = event.item;
this.showConfirmModal = true;
// on confirm:
this.deleteChannel(this.communityId, this.channelToDelete._id);
```

When invoked from the member table's "Remove" button, `event.item` is a member row (`{ _id, userName, roles }`), not a channel — so confirming "Remove" issues `DELETE /channel/delete/:communityId/:channelId` with the member's `_id` as the channel id. `CommunityService.removeMember()` — the correct call — is fully implemented but never invoked anywhere in the codebase.

**Fix:** give member removal its own confirm-delete path (e.g. a `memberToRemove` field alongside `channelToDelete`, or a `kind: 'channel' | 'member'` tag on the modal action) that calls `this.communityService.removeMember(...)`. Also fix bug #1 first, since `removeMember`'s backend usecase call is itself broken.

---

## 3. Join Requests card shows raw ObjectIds and its "Manage" button does nothing

**File:** `client/src/app/component/main/community/about/about.component.html` (Join Requests card), `server/src/repositories/community.repository.ts:16-19`

Two independent problems:

- `CommunityRepository.getCommunityById` populates `'ownerId roles channels members.userId members.roleIds tags'` but not `joinRequests`, so `community.joinRequests` is an array of raw Mongo ObjectId strings. The template renders `{{ request }}` directly, which would show something like `65f3a2b1c9d4e5f6a7b8c9d0` instead of a username.
- The "Manage" button next to the count (`*ngIf="permissions.includes('MANAGE_MEMBERS')"`) has no `(click)` binding at all — it renders, gated correctly, and does nothing when clicked.

**Fix:** add `joinRequests` to the populate list server-side, and build an actual approve/reject UI for the "Manage" button (which will also need bug #1 fixed to work).

---

## 4. `MANAGE_TAG` permission is required but granted by no role

**File:** `server/src/constants/predifinedRoles.ts`, `server/src/usecase/community.usecase.ts` (`addTag`, `removeTag`)

`addTag`/`removeTag` gate on `hasPermission(userId, communityId, "MANAGE_TAG")`, but `defaultRolesData` never includes `"MANAGE_TAG"` in any of the five predefined roles — not even `Owner`. As shipped, nobody, including the community's creator, can add or remove a tag on an existing community through the normal permission set. Full detail and remediation options in `03-rbac-status.md`.

**Fix:** almost certainly just add `"MANAGE_TAG"` to `Owner` (and probably `Admin`) in `defaultRolesData`. Low effort, easy to miss because nothing throws until you actually try to tag/untag an existing community (tags are only set at creation time today, which is why this has likely gone unnoticed).

---

## 5. `KICK_MEMBERS` permission is declared, seeded, and never checked

**File:** `server/src/constants/predifinedRoles.ts` and every usecase file (absence, not presence)

`KICK_MEMBERS` is part of `Owner`/`Admin`/`Moderator`'s permission set in the seed data and part of the `Role` entity's implied vocabulary, but no controller/usecase in the codebase ever calls `hasPermission(..., "KICK_MEMBERS")`. `removeMember` is gated on `MANAGE_MEMBERS` instead. This isn't causing incorrect behavior today (nothing is under-protected), but it's a permission that exists in the data model with no code path, which will confuse anyone building a "kick" feature and expecting it to already be enforced somewhere.

**Fix:** either (a) implement a distinct kick action gated on `KICK_MEMBERS` (e.g. lets Moderators remove members without giving them full `MANAGE_MEMBERS`, which also covers approving join requests), or (b) drop it from the seed data if `MANAGE_MEMBERS` is meant to cover this permanently.

---

## 6. `getCommunitiesByUser` / `filterCommunitiesByTag` / `filterCommunitiesByCategory` / `searchCommunitiesByName` throw `NotFoundError` on an empty result instead of returning `[]`

**File:** `server/src/usecase/community.usecase.ts`

All four throw `NotFoundError("No communities found...")` when the underlying query returns zero rows, instead of returning an empty array. For `getCommunitiesByUser` specifically, this means a brand-new user with no communities yet gets a 404 from `GET /community/user` rather than `{ communities: [] }`. The one caller that matters today, `layout.component.ts`'s `loadCommunities()`, just does `console.log(error.message)` in its error handler and leaves `this.communities` untouched — so a fresh user happens to see an empty sidebar (because the array was never populated in the first place), but a user who *had* communities and got a transient/incorrect 404 on a refresh would see stale data silently rather than an error state, since nothing resets `this.communities` on error.

**Fix:** return `[]` for a genuinely-empty result in these four methods (reserve `NotFoundError` for "the id you asked about doesn't exist", not "the list is empty"), and have `layout.component.ts` explicitly clear/set state in its `error` callback rather than only logging.

---

## 7. Debug `console.log` left in request-handling hot paths

**Files:** `server/src/controller/community.controller.ts:28` (`console.log(req.body.data)` in `createCommunity`), `server/src/controller/channel.controller.ts:23` (`console.log(channelData)` in `createChannel`), plus the OTP-mailer log already flagged in `HANDOFF.md`'s known-issues table (#4) and several `console.log`/`console.error` calls throughout `about.component.ts` on the client.

Not a functional bug, but worth a cleanup pass before this becomes a habit copied into new code — request bodies (which can include user-entered community descriptions, etc.) shouldn't be logged unfiltered in production.

---

## 8. No owner-loss protection on leave/remove (latent, currently masked by bug #1)

**File:** `server/src/usecase/community.usecase.ts` (`leaveCommunity`, `removeMember`)

Neither method checks whether the acting-on user is the community's `Owner` (or the last holder of `MANAGE_COMMUNITY`/`MANAGE_ROLES`). Once bug #1 is fixed, an owner could leave their own community, or be removed by an Admin, leaving it permanently unmanageable (no one left with `MANAGE_ROLES` to grant themselves anything). Not currently exploitable only because the endpoints don't work yet — fix this in the same pass as #1 rather than after, so it isn't shipped as a fresh regression.
