# Known bugs — this pass

New findings from this review, verified by reading the actual code at commit `597fb1b`. These are **in addition to** `HANDOFF.md`'s "Known open issues" table (14 items, still valid — see `00-START-HERE.md`), not a replacement for it. Ordered by severity/impact.

> **Update 2026-09-08 — Tier 0 landed (PR #2, merged to `main` at `aecbd00`).**
> Fixed: **#1** (`e9ecffd`), **#3** (server half — `joinRequests` now populated, `f3013a5`; the UI half is still open), **#4** (`429ed97`), **#6** (`17831cf`), **#7** (`e9ecffd` + partly folded into the controller cleanup), **#8** (`89454a5`).
> Still open: **#2** (frontend — Remove-member wired to `deleteChannel`), **#3** (the approve/reject UI itself), **#5** (`KICK_MEMBERS` unused — decision needed).
> Per-item notes inline below.

---

## 1. `community.controller.ts` calls 5 of 6 membership usecase methods with swapped arguments (critical)

> **FIXED — PR #2 `e9ecffd`.** All five call sites swapped back to `(userId, communityId, …)`; `CommunityController` now `implements ICommunityController`; stray debug `console.log` / unused `log` import removed from both controllers.

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

> **STILL OPEN** — frontend fix, part of Tier 1. The backend `removeMember` usecase it should call is now correct (bug #1) and has an owner-loss guard (bug #8).

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

> **PARTLY FIXED.** Server half done — PR #2 `f3013a5` adds `joinRequests` to the populate list in `getCommunityById`, so the array now carries full User docs. **Still open:** the template still renders `{{ request }}` and the "Manage" button still has no `(click)` handler — the actual approve/reject UI is Tier 1 work.

**File:** `client/src/app/component/main/community/about/about.component.html` (Join Requests card), `server/src/repositories/community.repository.ts:16-19`

Two independent problems:

- ~~`CommunityRepository.getCommunityById` populates `'ownerId roles channels members.userId members.roleIds tags'` but not `joinRequests`~~ — **fixed**, `joinRequests` is now in the populate list. The template still renders `{{ request }}` directly though, so it needs updating to read `request.userName` (or similar) off the populated doc.
- The "Manage" button next to the count (`*ngIf="permissions.includes('MANAGE_MEMBERS')"`) has no `(click)` binding at all — it renders, gated correctly, and does nothing when clicked.

**Remaining fix:** build an actual approve/reject UI for the "Manage" button. `approveJoinRequest` / `rejectJoinRequest` backend + controller are now correct (bug #1); `community.service.ts` still needs `requestToJoinCommunity` / `approveJoinRequest` / `rejectJoinRequest` methods added.

---

## 4. `MANAGE_TAG` permission is required but granted by no role

> **FIXED — PR #2 `429ed97`.** `"MANAGE_TAG"` added to the `Owner` and `Admin` entries in `defaultRolesData`. Note: only affects communities created after this change — existing communities' role documents were seeded at creation time and are unchanged (a data migration would be needed to backfill them).

**File:** `server/src/constants/predifinedRoles.ts`, `server/src/usecase/community.usecase.ts` (`addTag`, `removeTag`)

`addTag`/`removeTag` gate on `hasPermission(userId, communityId, "MANAGE_TAG")`, but `defaultRolesData` never includes `"MANAGE_TAG"` in any of the five predefined roles — not even `Owner`. As shipped, nobody, including the community's creator, can add or remove a tag on an existing community through the normal permission set. Full detail and remediation options in `03-rbac-status.md`.

**Fix:** almost certainly just add `"MANAGE_TAG"` to `Owner` (and probably `Admin`) in `defaultRolesData`. Low effort, easy to miss because nothing throws until you actually try to tag/untag an existing community (tags are only set at creation time today, which is why this has likely gone unnoticed).

---

## 5. `KICK_MEMBERS` permission is declared, seeded, and never checked

> **STILL OPEN** — deliberately left for Tier 2, needs a product decision (implement a narrower kick action, or drop from seed data).

**File:** `server/src/constants/predifinedRoles.ts` and every usecase file (absence, not presence)

`KICK_MEMBERS` is part of `Owner`/`Admin`/`Moderator`'s permission set in the seed data and part of the `Role` entity's implied vocabulary, but no controller/usecase in the codebase ever calls `hasPermission(..., "KICK_MEMBERS")`. `removeMember` is gated on `MANAGE_MEMBERS` instead. This isn't causing incorrect behavior today (nothing is under-protected), but it's a permission that exists in the data model with no code path, which will confuse anyone building a "kick" feature and expecting it to already be enforced somewhere.

**Fix:** either (a) implement a distinct kick action gated on `KICK_MEMBERS` (e.g. lets Moderators remove members without giving them full `MANAGE_MEMBERS`, which also covers approving join requests), or (b) drop it from the seed data if `MANAGE_MEMBERS` is meant to cover this permanently.

---

## 6. `getCommunitiesByUser` / `filterCommunitiesByTag` / `filterCommunitiesByCategory` / `searchCommunitiesByName` throw `NotFoundError` on an empty result instead of returning `[]`

> **FIXED (server) — PR #2 `17831cf`.** All four now `return communities ?? []`. The companion frontend suggestion — have `layout.component.ts`'s `loadCommunities()` set/clear state in its `error` callback rather than only logging — was **not** done and is still worth doing (see Tier 3).

**File:** `server/src/usecase/community.usecase.ts`

All four threw `NotFoundError("No communities found...")` when the underlying query returned zero rows, instead of returning an empty array. For `getCommunitiesByUser` specifically, this means a brand-new user with no communities yet gets a 404 from `GET /community/user` rather than `{ communities: [] }`. The one caller that matters today, `layout.component.ts`'s `loadCommunities()`, just does `console.log(error.message)` in its error handler and leaves `this.communities` untouched — so a fresh user happens to see an empty sidebar (because the array was never populated in the first place), but a user who *had* communities and got a transient/incorrect 404 on a refresh would see stale data silently rather than an error state, since nothing resets `this.communities` on error.

**Fix:** return `[]` for a genuinely-empty result in these four methods (reserve `NotFoundError` for "the id you asked about doesn't exist", not "the list is empty"), and have `layout.component.ts` explicitly clear/set state in its `error` callback rather than only logging.

---

## 7. Debug `console.log` left in request-handling hot paths

> **PARTLY FIXED — PR #2.** The two server-side logs are gone: `community.controller.ts:28` (`console.log(req.body.data)`) and `channel.controller.ts:23` (`console.log(channelData)`). **Still open:** the OTP-mailer log (`HANDOFF.md` #4) and the `console.log`/`console.error` calls in `about.component.ts` on the client.

**Files:** ~~`server/src/controller/community.controller.ts:28`~~, ~~`server/src/controller/channel.controller.ts:23`~~, plus the OTP-mailer log already flagged in `HANDOFF.md`'s known-issues table (#4) and several `console.log`/`console.error` calls throughout `about.component.ts` on the client.

Not a functional bug, but worth a cleanup pass before this becomes a habit copied into new code — request bodies (which can include user-entered community descriptions, etc.) shouldn't be logged unfiltered in production.

*(This item is also `HANDOFF.md` #7, which is a different issue under the same number — the `new Types.ObjectId(undefined)` dead-guard pattern. That one is now **FIXED** in PR #2 `f653285`: both controllers validate raw id params with `Types.ObjectId.isValid` via a `parseObjectId` helper before construction, so a malformed id returns 400 instead of a 500, and `searchAccessibleChannels` — which used to 400 every call because it checked `typeof communityId !== "string"` on an already-constructed ObjectId — now works.)*

---

## 8. No owner-loss protection on leave/remove (latent, currently masked by bug #1)

> **FIXED — PR #2 `89454a5`.** `leaveCommunity` and `removeMember` now call a private `isCommunityOwner(community, targetId)` helper (compares on `ownerId._id` since `ownerId` is populated) and throw a `ValidationError` if the target is the owner — "transfer ownership or delete the community instead". Note this guards **only** the `ownerId` field; it does not yet protect "the last holder of `MANAGE_ROLES`" more generally, and there is still no transfer-ownership endpoint (Tier 1 / Tier 2).

**File:** `server/src/usecase/community.usecase.ts` (`leaveCommunity`, `removeMember`)

Neither method checked whether the acting-on user is the community's `Owner` (or the last holder of `MANAGE_COMMUNITY`/`MANAGE_ROLES`).
