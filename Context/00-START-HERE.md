# Hive — Context Pack (start here)

Generated 2026-09-08 at commit `597fb1b` (branch `main`) by a Claude review session, at the request of the repo owner, to prime a **future Claude Code session** that will continue development.

> **Progress — 2026-09-09.** Tiers **0, 1 and 2 are all shipped** to `main` (PRs #2, #6–#10, #12–#14). Community management and RBAC are feature-complete on both sides — roles CRUD, per-member role assignment, join requests, remove/kick/leave/delete community, edit details, tags, Discover search. `05-roadmap-todo.md` has the PR-by-PR breakdown; `04-known-bugs.md` and the `02`/`03` update banners carry per-item status. Only Tier 3 opportunistic cleanup remains. This complements — does not replace — `HANDOFF.md` at the repo root, which is still accurate and worth reading first for stack/layout/conventions. This folder goes one layer deeper: it cross-references the Angular client against the Express API line by line, and answers the two questions the owner specifically asked about: *is community management done?* and *is role-based access control done?* (Short answer to both: no — see below.)

## Files in this folder

| File | What it covers |
|---|---|
| `01-backend-frontend-gap-analysis.md` | Every backend route, domain by domain, marked used / unused / partially-used by the Angular client. |
| `02-community-management-status.md` | Deep dive: community CRUD, membership, join requests, tags/categories — what works, what's UI-only, what's backend-only, what's silently broken. |
| `03-rbac-status.md` | Deep dive: the permission model, where it's enforced, where it isn't, and the gaps between the 5 predefined roles and what the UI/API actually need. |
| `04-known-bugs.md` | Every concrete, file-and-line bug found this pass, **not duplicating** `HANDOFF.md`'s "Known open issues" table (read that one too — it's still valid, verified against the current HEAD below). |
| `05-roadmap-todo.md` | A prioritized punch list to work from, split into "fix before anything else" / "finish the half-built features" / "nice to have". |
| `07-tier1-plan.md` | Tier 1 build plan (membership lifecycle) — **shipped**, PRs #6–#10. |
| `08-tier2-plan.md` | Tier 2 build plan (RBAC / role management) — **shipped**, PRs #12–#14. |

## The one-paragraph version

Hive is further along on chat/calls/voicerooms than on the "community" side of a community platform. As of 2026-09-09 the community + RBAC gap this pack was written to close is **done**: Tier 0 (backend membership bugs, PR #2), Tier 1 (membership lifecycle + community admin UI — join requests, remove/leave/delete, edit details, tags, Discover search — PRs #6–#10), and Tier 2 (role management: roles CRUD screen, per-member role assignment, `KICK_MEMBERS` kick, role badges — PRs #12–#14) have all shipped to `main`. The docs below are the historical analysis that drove that work — read the per-file "Update" banners for current state. What's left is small opportunistic cleanup (Tier 3 in `05-roadmap-todo.md`): the dead `CommunityCategory` model, `VIEW_CONTENT`/`SEND_MESSAGES` enforcement intent, and the still-open items in `HANDOFF.md`'s table.

## Verified against HEAD

This pass re-read every file `HANDOFF.md`'s "Known open issues" table cites, at commit `597fb1b`. The 14 commits since the commit HANDOFF verified against (`e179da9`) are all UI/design/a11y/mobile work (the `redesign/ui-ux-pass` branch, now merged) — none touch community, role, or membership logic — so that table was accurate as written. Nothing in this folder repeats it; treat the two documents as one combined list.

**Since then (2026-09-08, PR #2 → `aecbd00`):** `HANDOFF.md` table items **#5** (dangling channel refs) and **#7** (`Types.ObjectId(undefined)` dead-guards) are now **FIXED** — the table has been annotated. All other `HANDOFF.md` items remain open.

## Suggested order for a Claude Code session picking this up

1. Read `HANDOFF.md` (repo root) for stack/conventions/gotchas.
2. Skim `04-known-bugs.md` here for the status banner — Tier 0 (the backend bugs) is already done; this tells you what's left.
3. Read `02-community-management-status.md` and `03-rbac-status.md` for what "finish community management / RBAC" means as frontend work — that's what's left.
4. Use `05-roadmap-todo.md` as the actual task list — **start at Tier 1**.
5. `01-backend-frontend-gap-analysis.md` is the reference table to check against before adding any new endpoint or service method, so nothing else drifts out of sync the way `role.service.ts` and `community.service.ts` have.
