# Backend ↔ Frontend gap analysis

Every mounted Express route (`server/src/framework/router/*.ts`), against whether an Angular service (`client/src/app/services/*.ts`) actually calls it. "Used" means a service method calls it *and* at least one component calls that service method — a service method nobody calls is flagged separately.

Legend: ✅ used from a component · 🟡 service method exists but no component calls it (dead code) · ❌ no frontend service method at all · — not applicable (internal/health).

> **Update 2026-09-08 (PR #2 → `main` `aecbd00`):** the "also broken server-side" annotations on the community membership routes are now stale — `POST /community/request|approve_request|reject_request|leave|member/remove` all work server-side. Frontend-caller status (❌/🟡) is unchanged; that's the Tier 1 gap.

## `/community` (`community.router.ts` ↔ `community.service.ts`)

| Route | Usecase call | Frontend | Notes |
|---|---|---|---|
| `POST /create` | `createCommunity` | ✅ | via `create-community` wizard |
| `GET /search` | `searchCommunitiesByName` | ❌ (by design, PR #10) | `discover` filters the already-loaded list client-side; endpoint kept for a future server-side-paging switch |
| `GET /` | `listCommunities` | ✅ | `discover` |
| `GET /user` | `getCommunitiesByUser` | ✅ | sidebar/community list |
| `GET /tags` | `getAllTags` | ✅ | create-community step 3 |
| `GET /categories` | `getCategories` | ❌ | no client method — categories are unreachable from the UI even though `communityCategory.model.ts` + `seedCategories.ts` exist server-side |
| `GET /:id` | `getCommunityById` | ✅ | `about`, layout |
| `PUT /update/:communityId` | `updateCommunity` | ✅ | icon/cover upload only (`about.component.ts`); no "edit name/description/type" UI |
| `DELETE /delete/:communityId` | `deleteCommunity` | ❌ | no client method — a community, once created, can never be deleted from the UI |
| `GET /tag/:id` | `getTagById` | ✅ | |
| `POST /request/:communityId` | `requestToJoinCommunity` | ❌ | server-side now works (PR #2); no `community.service.ts` method yet |
| `POST /approve_request/:communityId` | `approveJoinRequest` | ❌ | server-side now works (PR #2); no client method |
| `POST /reject_request/:communityId` | `rejectJoinRequest` | ❌ | server-side now works (PR #2); no client method |
| `POST /leave/:communityId` | `leaveCommunity` | ❌ | server-side now works (PR #2, incl. owner guard); no "Leave community" UI exists anywhere |
| `POST /member/add/:communityId` | `addMember` | ✅ | `about.component.ts` `addUserToCommunity()` — this is the *only* way members join today, bypassing `joinRequests` entirely, even for `type: 'private'` communities |
| `POST /member/remove/:communityId` | `removeMember` | 🟡 | server-side now works (PR #2, incl. owner guard); method exists in `community.service.ts` but the "Remove" button in `about.component.ts` calls `deleteChannel()` instead (see `02-community-management-status.md`) — genuinely dead code |
| `POST /add_tag/:communityId/:tagId` | `addTag` | ❌ | `MANAGE_TAG` now granted to Owner/Admin for new communities (PR #2); still no client method |
| `DELETE /remove_tag/:communityId/:tagId` | `removeTag` | ❌ | same |
| `GET /filter_by_tag/:tagId` | `filterCommunitiesByTag` | ❌ | |
| `GET /filter_by_category/:categoryId` | `filterCommunitiesByCategory` | ❌ | |

**10 of 19 community routes have no frontend caller at all; 1 more is wired to the wrong handler.** Community "management" beyond icon/cover swap and the ad-hoc add-member flow is entirely unreachable from the UI today.

## `/role` (`role.router.ts` ↔ `role.service.ts`)

| Route | Usecase call | Frontend |
|---|---|---|
| `POST /create/:communityId` | `createRole` | ❌ |
| `GET /:id` | `getRoleById` | ❌ |
| `GET /user/:communityId` | `getUserRoles` | ✅ (`role-state.service.ts`, drives the `permissions.includes(...)` gates seen throughout `about.component.html`) |
| `PUT /update/:communityId/:roleId` | `updateRole` | ❌ |
| `DELETE /delete/:communityId/:roleId` | `deleteRole` | ❌ |
| `GET /list/:communityId` | `listRoles` | ❌ |

**`role.service.ts` implements exactly one of six routes.** There is no screen anywhere in the client for creating a custom role, editing a role's permission set, deleting a role, or assigning/reassigning a role to an already-joined member. The 5 predefined roles (Owner/Admin/Moderator/Member/Guest, seeded per-community in `defaultRolesData`) are the only roles that will ever exist in practice.

## `/channel` (`channel.router.ts` ↔ `channel.service.ts`)

| Route | Frontend |
|---|---|
| `POST /create/:communityId` | ✅ |
| `GET /:id` | ✅ |
| `GET /list/:communityId` | ✅ |
| `GET /search/:communityId` | ❌ — no client method; channel search box, if any, would need to filter client-side |
| `PUT /update/:communityId/:channelId` | ✅ |
| `DELETE /delete/:communityId/:channelId` | ✅ |

Channels are the best-covered of the three community-scoped domains — only search is missing.

## `/auth`, `/friends`, `/profile`, `/image`, `/chat`, `/call`, `/voiceroom`

These are essentially fully covered — every route in `auth.router.ts`, `friends.router.ts`, `profile.router.ts`, `image.router.ts`, `chat.router.ts`, `call.router.ts`, and `voiceroom.router.ts` has a corresponding, called, frontend method, with one minor exception:

- `GET /auth/userDetails/:id` exists server-side (returns another user's public details) but `user-auth.service.ts` has no method that calls it by that path — check before assuming it's reachable if a future feature needs "view another user's profile by id"; it may be intentionally unused today (nothing in the UI currently opens a bare user-id profile view) or may be a leftover from an earlier flow. Worth a `git log -p` on that route before either wiring it up or deleting it.

Everything else in these seven domains (register/login/OTP/password reset, friend request/accept/reject/block/unblock, edit profile/avatar/change password, image upload, chat history/media messages/reactions/polls, WebRTC ICE config, voiceroom presence/token) is implemented on both sides and actively used.

## Net picture

Of the ~45 community + role + channel routes, **16 have zero frontend caller and 1 more is miswired** — almost exactly the two areas (community management, RBAC) flagged as suspect. Chat, calls, voicerooms, friends, auth, and profile are essentially complete on both sides.
