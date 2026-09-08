# Role-based access control — status

Answering directly: **the enforcement mechanism is real and mostly correct where it's wired up; the management UI for it doesn't exist, and the permission set has gaps and at least one permission that can never be granted in practice.**

> **Update 2026-09-08 (PR #2 `aecbd00`).** `MANAGE_TAG` added to Owner/Admin (new communities only); `approve`/`rejectJoinRequest` reachable again.
>
> **Update 2026-09-09 (Tier 2, PRs #12–#14) — RBAC is now feature-complete on both sides.** `KICK_MEMBERS` is a real permission (`POST /community/kick/:communityId`, narrower than `MANAGE_MEMBERS`, Moderator-accessible). Member **role assignment**: `POST /role/assign` + `/role/unassign` (`MANAGE_ROLES`; owner's roles locked; member keeps ≥1 role), with a per-member checkbox editor in the member modal. **Roles CRUD UI**: `RolesModalComponent` from the About page — list/create/edit/delete, defaults read-only. `deleteRole` cascades to member `roleIds`. Shared `PERMISSIONS` constant (server + client, client has display labels). Member list shows coloured role pills; member modal shows Kick or Remove per the viewer's permission. **Still open:** `VIEW_CONTENT`/`SEND_MESSAGES` are seeded but only enforced via channel-membership checks — confirm whether that's intentional or add explicit gates.

## The model

- `RoleModel` (`server/src/framework/models/role.model.ts`): `{ communityId, name, permissions: string[], isDefault }`. Roles are per-community documents, not global — every community gets its own copy of Owner/Admin/Moderator/Member/Guest at creation time (`defaultRolesData` in `server/src/constants/predifinedRoles.ts`).
- `Community.members[]` is `{ userId, roleIds: [] }` — a member can hold multiple roles simultaneously; effective permissions are the union (`RBACService.hasPermission` does `roles.some(role => role.permissions.includes(requiredPermission))` after fetching all of the member's roles).
- `RBACService.hasPermission(userId, communityId, permission)` (`server/src/framework/utils/RBACService.ts`) is the single source of truth, injected into `CommunityUseCase`, `RoleUseCase`, and `ChannelUseCase`. There's no middleware-level enforcement — every usecase method that needs a permission check calls it explicitly and throws `UnauthorizedError` if it fails.

## The predefined roles

```
Owner:     MANAGE_COMMUNITY, MANAGE_ROLES, MANAGE_MEMBERS, MANAGE_CHANNELS, KICK_MEMBERS, VIEW_CONTENT, SEND_MESSAGES
Admin:     MANAGE_ROLES, MANAGE_MEMBERS, MANAGE_CHANNELS, KICK_MEMBERS, VIEW_CONTENT, SEND_MESSAGES
Moderator: MANAGE_CHANNELS, KICK_MEMBERS, VIEW_CONTENT, SEND_MESSAGES
Member:    VIEW_CONTENT, SEND_MESSAGES
Guest:     VIEW_CONTENT
```

## Where enforcement is real and correct

| Permission checked | Where | Verdict |
|---|---|---|
| `MANAGE_COMMUNITY` | `updateCommunity`, `deleteCommunity` | Correct, but `deleteCommunity` has no frontend caller (see `01-...gap-analysis.md`) so it's untested from the UI |
| `MANAGE_ROLES` | `createRole`, `updateRole`, `deleteRole` | Correct, but none of the three has a frontend caller at all |
| `MANAGE_MEMBERS` | `approveJoinRequest`, `rejectJoinRequest`, `addMember`, `removeMember` | Correct in the usecase; **the controller argument-swap bug is now fixed (PR #2)** so `approveJoinRequest`/`rejectJoinRequest` are reachable and their permission checks run. `removeMember` is still unreachable *from the UI* (the "Remove" button calls `deleteChannel` — Tier 1 fix), but the endpoint itself works |
| `MANAGE_CHANNELS` | `createChannel`, `updateChannel`, `deleteChannel` | Correct and this is the one place the whole chain (permission model → backend enforcement → frontend gating → frontend action) actually works end-to-end |

## Where it's incomplete or inconsistent

- **`KICK_MEMBERS` is defined but never checked anywhere.** `grep`ing the whole server for it turns up only its declaration in `predifinedRoles.ts` and the `Role` entity typing. There's no "kick" concept distinct from `removeMember`/`MANAGE_MEMBERS` — the permission exists in the data model with no corresponding code path. Either wire a `KICK_MEMBERS` check into a real kick action, or drop the permission from the seed data so the UI/API surface matches reality.
- ~~**`MANAGE_TAG` is required by `addTag`/`removeTag` but granted by no predefined role.**~~ **FIXED in PR #2 (`429ed97`)** — `MANAGE_TAG` added to `Owner` and `Admin` in `defaultRolesData`. Caveat: this only affects communities created *after* the change; role documents for existing communities were seeded at creation time and still lack it (a one-off migration would be needed to backfill).
- **No permission gates `VIEW_CONTENT` or `SEND_MESSAGES` anywhere server-side** that this review found outside channel access checks (`channelAccess.util.ts`, `directChatAuth.util.ts` — those check *membership*, not these specific permission strings). They may be vestigial (present in the seed data for completeness/future use) rather than actively enforced. Worth confirming intent before building more on top of them.
- **Custom roles are a backend-only feature.** `createRole` validates a name + arbitrary `permissions: string[]` (via `roleValidator`, `server/src/framework/utils/validators/role.validator.ts` — worth checking whether it restricts values to a known permission enum or accepts any string) and stores it, but with no frontend to call it, in practice only the 5 seeded roles will ever exist in any community. A community owner cannot create a "Trusted Member" role or restrict `Moderator` further without an API client.
- **No role reassignment for existing members.** `approveJoinRequest` assigns a role at approval time; there is no endpoint or UI to change a member's role(s) after that (short of removing and re-adding them through `addMember`, which itself has no "which role" picker beyond the hardcoded `Member` lookup in `addUserToCommunity()`).
- **Partial protection for the `Owner` role.** `updateRole`/`deleteRole` block edits to *any* `isDefault` role. **PR #2 (`89454a5`) added** an `isCommunityOwner` guard so `removeMember` can't remove the owner and `leaveCommunity` won't let the owner leave. Still missing: a transfer-ownership path, and a more general "don't strip the last `MANAGE_ROLES` holder" check (only the `ownerId` field is guarded, not role membership).

## Frontend RBAC surface

- `RoleStateService` (`client/src/app/services/shared/role-state.service.ts`) loads the current user's roles for a community via the one implemented endpoint, flattens their `permissions` into a `Set`, and exposes `permissions$`.
- `about.component.ts` reads that into `this.permissions` and gates buttons in `about.component.html` with `*ngIf="permissions.includes('MANAGE_COMMUNITY' | 'MANAGE_MEMBERS' | 'MANAGE_CHANNELS')"`. This part is correctly implemented — the gating logic is sound, it's just gating actions that are themselves broken or missing (see `02-community-management-status.md`).
- There is no permission-gating anywhere else in the client (channel-level allowed-roles are handled separately via `channelAccess.util.ts` server-side and `getAccessibleChannels`, not via the `permissions$` stream).
- No component reads `role.name` to show a role badge/label on a member row beyond the plain-text join in `manageMembers()` (`member.roleIds?.map(...).join(', ')`), and there's no color/hierarchy treatment of roles anywhere in the UI.

## Bottom line

RBAC enforcement itself — the actual "can this user do X" check — is well-factored and correct in the four places it's wired up. What's missing is (a) a UI to manage roles and role assignments at all, (b) closing the `MANAGE_TAG`-with-no-grantee gap, (c) deciding what `KICK_MEMBERS` is for and either implementing or removing it, and (d) owner/last-admin protections once the membership endpoints are fixed. This is a smaller lift than community management overall, but it's blocked on the same controller bug for two of its four enforcement points.
