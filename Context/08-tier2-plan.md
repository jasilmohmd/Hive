# Tier 2 plan — RBAC / role management

Written 2026-09-09, after Tier 1 completed (`main` at `e6f254e`). Covers `05-roadmap-todo.md` Tier 2. **Plan only — not started.**

## Decisions locked

| Decision | Choice |
|---|---|
| Member role assignment (server) | **New routes** `POST /role/assign/:communityId` + `POST /role/unassign/:communityId`, body `{ userId, roleId }`, `MANAGE_ROLES`-gated. Wire the existing `roleRepository.assignRole` / `removeRole` through new usecase + controller methods. |
| `KICK_MEMBERS` | **Implement a real kick.** New `POST /community/kick/:communityId` (body `{ memberId }`) gated on `KICK_MEMBERS` (not `MANAGE_MEMBERS`), keeps the owner guard, calls the same `communityRepository.removeMember`. Lets Moderators remove members without full `MANAGE_MEMBERS`. `removeMember` stays as-is. |

## Backend facts (verified at `e6f254e`)

- Role CRUD routes all exist and are `MANAGE_ROLES`-gated: `POST /role/create/:communityId` (`{name, permissions}`), `PUT /role/update/:communityId/:roleId`, `DELETE /role/delete/:communityId/:roleId`, `GET /role/list/:communityId`. `updateRole`/`deleteRole` throw on `isDefault` roles.
- `roleValidator` (`role.validator.ts`) requires `permissions` **nonempty** — the create/edit UI must enforce ≥1.
- `roleRepository` already has `assignRole(userId, communityId, roleId)` and `removeRole(...)` — **no controller/usecase/route exposes them** (only called internally at community creation for the Owner).
- **Gap:** `deleteRole` deletes the Role doc but never `$pull`s its id from `community.members[].roleIds` → dangling refs (same class as the channel/community cascade gaps already fixed).
- **Inconsistency:** `role.controller.listRoles` does `res.json(roles)` (bare array); `getUserRoles` does `res.json({ roles })`. Normalise `listRoles` to `{ roles }`.
- No shared permissions constant. The 8 strings live in `constants/predifinedRoles.ts` and inline `hasPermission(...)` calls in `community.usecase.ts`:
  `MANAGE_COMMUNITY, MANAGE_ROLES, MANAGE_MEMBERS, MANAGE_CHANNELS, MANAGE_TAG, KICK_MEMBERS, VIEW_CONTENT, SEND_MESSAGES`.
- `RBACService.hasPermission` = union of the member's roles' permissions.
- `about.component.ts` `manageMembers()` already builds `roles: member.roleIds?.map(r => r.name).join(', ')`; the member modal's "Manage" button currently (wrongly) opens the channel-edit modal via the shared `handleModalAction('edit')`.

## Plan

### Server

1. **Permissions constant** — `server/src/constants/permissions.ts` exporting the 8 strings (+ a `PERMISSION_LABELS`/description map). Refactor `predifinedRoles.ts` and `community.usecase.ts` literals to use it. Mirror to `client/src/app/constants/permissions.ts`.
2. **`deleteRole` cascade** — after deleting the Role, `$pull` its id from every `community.members[].roleIds` in that community. Members left with zero roles stay members (lose all perms) — acceptable, warn in the UI confirm.
3. **Assign / unassign** —
   - `IRoleUsecase` + `RoleUseCase`: `assignRole(actingUserId, communityId, memberId, roleId)`, `unassignRole(...)`. Checks: `MANAGE_ROLES`; role belongs to `communityId`; **block any change to the owner's role set** (simplest owner-safety).
   - `IRoleController` + `RoleController`: `assignRole`, `unassignRole` — `memberId` + `roleId` from body, validated via `parseObjectId`-style guards.
   - Routes in `role.router.ts`.
   - Update `IRoleController.interface` + `IRoleUsecase.interface`.
4. **Kick** —
   - `ICommunityUsecase` + `CommunityUseCase`: `kickMember(actingUserId, communityId, memberId)` — `KICK_MEMBERS` check, `isCommunityOwner` guard, then `communityRepository.removeMember(communityId, memberId)`.
   - `CommunityController.kickMember` (body `{memberId}`) + route `POST /community/kick/:communityId` + interface entry.
5. **Normalise `listRoles`** response to `{ roles }`.

### Client

6. **`role.service.ts`** — add `listRoles`, `createRole`, `updateRole`, `deleteRole`, `assignRole`, `unassignRole` (+ HTTP-mock spec tests). Also `community.service.ts` `kickMember`.
7. **`constants/permissions.ts`** — 8 permissions with display label + one-line description, for the checkbox UI.
8. **Roles screen** — new standalone component, opened as a **modal from the About page** (consistent with join-requests / tags), gated `permissions.includes('MANAGE_ROLES')`:
   - list roles (name, permission count, "Default" badge)
   - create: name + permission checkboxes (≥1 required)
   - edit custom role: same form; default roles read-only
   - delete custom role: confirm modal (warn about members losing the role)
   - entry point: a "Roles" button near "Manage Community".
9. **Member role assignment** — replace the member modal "Manage" action: a per-member role editor (checkboxes of the community's roles) calling `assignRole`/`unassignRole` on toggle. Owner's row locked.
10. **Kick vs Remove** in the member modal — show "Remove" when the user has `MANAGE_MEMBERS`, else "Kick" when they have `KICK_MEMBERS`; both hidden on the owner row; both refresh community state.
11. **Role badges** — upgrade `mapMembers()`'s `roles` string to colored pills; small `roleColor(name)` helper (fixed colors for the 5 defaults, hashed palette for custom).

### Verification

- `tsc` (server + client app + spec), `ng build`, `ng test`.
- **Live**: create custom role → assign to a member → member can perform a newly-granted gated action → unassign → delete role (confirm it's pulled from members) → kick a member as a Moderator (`KICK_MEMBERS` only, no `MANAGE_MEMBERS`) → confirm default roles reject edit/delete and the owner's roles are locked.
- **Playwright**: roles modal CRUD, member role editor, badges render.

### PR structure

- **PR A** — server (permissions constant, assign/unassign, kick, deleteRole cascade, listRoles shape) + `role.service.ts`/`community.service.ts` methods.
- **PR B** — Roles CRUD screen.
- **PR C** — member role assignment + kick UI + role badges.

### Sub-decisions to settle during build

- Roles screen as modal vs. dedicated route — leaning **modal**.
- Owner-role safety — leaning **block all changes to the owner's roles**.
- Deleting a role that leaves members with zero roles — leaning **allow, warn**.

### Also flagged (not Tier 2, do opportunistically)

- Delete the dead `CommunityCategory` model / `seedCategories.ts` / `GET /community/categories` / `/filter_by_category` — no UI, no plan (from Tier 1 wrap-up).
- `VIEW_CONTENT` / `SEND_MESSAGES` are seeded but never enforced outside channel-membership checks — confirm intent or document as reserved (`03-rbac-status.md`).
