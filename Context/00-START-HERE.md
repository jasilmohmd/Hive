# Hive — Context Pack (start here)

Generated 2026-09-08 at commit `597fb1b` (branch `main`) by a Claude review session, at the request of the repo owner, to prime a **future Claude Code session** that will continue development. This complements — does not replace — `HANDOFF.md` at the repo root, which is still accurate and worth reading first for stack/layout/conventions. This folder goes one layer deeper: it cross-references the Angular client against the Express API line by line, and answers the two questions the owner specifically asked about: *is community management done?* and *is role-based access control done?* (Short answer to both: no — see below.)

## Files in this folder

| File | What it covers |
|---|---|
| `01-backend-frontend-gap-analysis.md` | Every backend route, domain by domain, marked used / unused / partially-used by the Angular client. |
| `02-community-management-status.md` | Deep dive: community CRUD, membership, join requests, tags/categories — what works, what's UI-only, what's backend-only, what's silently broken. |
| `03-rbac-status.md` | Deep dive: the permission model, where it's enforced, where it isn't, and the gaps between the 5 predefined roles and what the UI/API actually need. |
| `04-known-bugs.md` | Every concrete, file-and-line bug found this pass, **not duplicating** `HANDOFF.md`'s "Known open issues" table (read that one too — it's still valid, verified against the current HEAD below). |
| `05-roadmap-todo.md` | A prioritized punch list to work from, split into "fix before anything else" / "finish the half-built features" / "nice to have". |

## The one-paragraph version

Hive is further along on chat/calls/voicerooms than on the "community" side of a community platform. Communities, channels, and a 5-tier role/permission system exist as clean, layered backend code (controller → usecase → repository), but the **membership lifecycle is broken end-to-end**: five of the six membership usecase methods in `community.controller.ts` call their usecase with `(communityId, userId)` when the usecase (and its own interface) expects `(userId, communityId)` — since both are same-typed `ObjectId`s, TypeScript can't catch it, so `POST /community/request/:id`, `/approve_request/:id`, `/reject_request/:id`, `/leave/:id`, and `/member/remove/:id` all run against swapped arguments and fail or misbehave at runtime (see `04-known-bugs.md` #1). On top of that, the Angular client never calls four of those five endpoints at all, and the "Join Requests" card and "Remove member" button that *do* exist in the UI are wired to dead/wrong handlers (see `02-community-management-status.md`). Role management (create/edit/delete a role, assign a role to an existing member) has full backend support and zero frontend surface — `RoleService` on the client only implements `getUserRoles`.

## Verified against HEAD

This pass re-read every file `HANDOFF.md`'s "Known open issues" table cites, at commit `597fb1b`. The 14 commits since the commit HANDOFF verified against (`e179da9`) are all UI/design/a11y/mobile work (the `redesign/ui-ux-pass` branch, now merged) — none touch community, role, or membership logic — so that table is still accurate as written. Nothing in this folder repeats it; treat the two documents as one combined list.

## Suggested order for a Claude Code session picking this up

1. Read `HANDOFF.md` (repo root) for stack/conventions/gotchas.
2. Read `04-known-bugs.md` here — several are one-line fixes with an outsized effect (the argument-order bug alone breaks five endpoints).
3. Read `02-community-management-status.md` and `03-rbac-status.md` to decide how much of "finish community management" is a backend fix vs. new frontend work — it's roughly half and half.
4. Use `05-roadmap-todo.md` as the actual task list.
5. `01-backend-frontend-gap-analysis.md` is the reference table to check against before adding any new endpoint or service method, so nothing else drifts out of sync the way `role.service.ts` and `community.service.ts` have.
