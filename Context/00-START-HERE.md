# Hive — Context Pack (start here)

Generated 2026-09-08 at commit `597fb1b` (branch `main`) by a Claude review session, at the request of the repo owner, to prime a **future Claude Code session** that will continue development.

> **Progress update — 2026-09-08, `main` at `aecbd00`.** **Tier 0 is done** (PR #2, merged). The critical argument-order bug, the `MANAGE_TAG` gap, owner-loss protection, `joinRequests` population, the dangling-channel-ref bug, the empty-list-404 bug, and the `Types.ObjectId(undefined)` dead-guard pattern are all fixed. See `05-roadmap-todo.md` for the commit-by-commit breakdown and `04-known-bugs.md` for per-bug status. **Tier 1 (finish community management — join-request UI, remove-member fix, leave/delete community, edit details, tags) is the next block of work and is now unblocked.** Nothing in Tier 0 touched the frontend. This complements — does not replace — `HANDOFF.md` at the repo root, which is still accurate and worth reading first for stack/layout/conventions. This folder goes one layer deeper: it cross-references the Angular client against the Express API line by line, and answers the two questions the owner specifically asked about: *is community management done?* and *is role-based access control done?* (Short answer to both: no — see below.)

## Files in this folder

| File | What it covers |
|---|---|
| `01-backend-frontend-gap-analysis.md` | Every backend route, domain by domain, marked used / unused / partially-used by the Angular client. |
| `02-community-management-status.md` | Deep dive: community CRUD, membership, join requests, tags/categories — what works, what's UI-only, what's backend-only, what's silently broken. |
| `03-rbac-status.md` | Deep dive: the permission model, where it's enforced, where it isn't, and the gaps between the 5 predefined roles and what the UI/API actually need. |
| `04-known-bugs.md` | Every concrete, file-and-line bug found this pass, **not duplicating** `HANDOFF.md`'s "Known open issues" table (read that one too — it's still valid, verified against the current HEAD below). |
| `05-roadmap-todo.md` | A prioritized punch list to work from, split into "fix before anything else" / "finish the half-built features" / "nice to have". |

## The one-paragraph version

Hive is further along on chat/calls/voicerooms than on the "community" side of a community platform. Communities, channels, and a 5-tier role/permission system exist as clean, layered backend code (controller → usecase → repository). The **membership lifecycle was broken end-to-end** — five of the six membership usecase methods in `community.controller.ts` called their usecase with swapped `(communityId, userId)` arguments (`04-known-bugs.md` #1) — but **that is now fixed** (PR #2), along with the other Tier 0 backend bugs. What remains: the Angular client still never calls four of those five endpoints, and the "Join Requests" card and "Remove member" button that *do* exist in the UI are still wired to dead/wrong handlers (see `02-community-management-status.md`) — that's the Tier 1 frontend work. Role management (create/edit/delete a role, assign a role to an existing member) still has full backend support and zero frontend surface — `RoleService` on the client only implements `getUserRoles` — that's Tier 2.

## Verified against HEAD

This pass re-read every file `HANDOFF.md`'s "Known open issues" table cites, at commit `597fb1b`. The 14 commits since the commit HANDOFF verified against (`e179da9`) are all UI/design/a11y/mobile work (the `redesign/ui-ux-pass` branch, now merged) — none touch community, role, or membership logic — so that table was accurate as written. Nothing in this folder repeats it; treat the two documents as one combined list.

**Since then (2026-09-08, PR #2 → `aecbd00`):** `HANDOFF.md` table items **#5** (dangling channel refs) and **#7** (`Types.ObjectId(undefined)` dead-guards) are now **FIXED** — the table has been annotated. All other `HANDOFF.md` items remain open.

## Suggested order for a Claude Code session picking this up

1. Read `HANDOFF.md` (repo root) for stack/conventions/gotchas.
2. Skim `04-known-bugs.md` here for the status banner — Tier 0 (the backend bugs) is already done; this tells you what's left.
3. Read `02-community-management-status.md` and `03-rbac-status.md` for what "finish community management / RBAC" means as frontend work — that's what's left.
4. Use `05-roadmap-todo.md` as the actual task list — **start at Tier 1**.
5. `01-backend-frontend-gap-analysis.md` is the reference table to check against before adding any new endpoint or service method, so nothing else drifts out of sync the way `role.service.ts` and `community.service.ts` have.
