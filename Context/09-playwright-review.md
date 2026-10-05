# Playwright review - 2026-10-06

## Tooling and required rule

Hive did not initially have a project-local Playwright runner or CLI. Added `@playwright/test` 1.63.0, `@playwright/cli` 0.1.22 and installed Chromium. Both the CLI (navigation, snapshot, resize, screenshot) and the test runner actually executed. Angular's unit tests now use that installed Chromium through `npm run test:client`; Windows uses the matching headless shell to avoid machine-managed full-Chrome startup issues.

[AGENTS.md](../AGENTS.md) requires browser testing after every feature/fix, meaningful regressions, and both fixture/live suites before handoff. [e2e/README.md](../e2e/README.md) contains reproducible setup and commands. CI is configured to run these suites and retain evidence; this review did not execute GitHub Actions.

## Scope

Desktop Chromium 1440x900 and mobile Chromium 390x844. The Angular UI is exercised across public auth/reset screens, Discover, profile/edit/password, all friend tabs, DM, community wizard, community about/roles and voice lobby. Route screenshots, console/runtime errors, overflow, wheel scrolling, error/retry paths and interaction flows are checked. Representative generated screenshots were also visually inspected.

The live suite runs real Express, cookie auth, Socket.IO, RBAC and MongoDB against a seeded disposable database, never `server/.env` or the hosted app. It exercises login/logout/guards, friends, profile privacy, persisted DM/channel messages, DM edits/deletion broadcasts, roles create/rename/delete, community create/update/delete, invalid requests and unauthorized reads.

## Bugs fixed and regression coverage

- Discover's routed container hid vertical overflow, leaving later cards unreachable by scrolling. Enabled vertical scrolling and tested wheel reachability.
- Community creation did not consistently honor description validation, refresh membership after success, show actionable upload errors, or dismiss its routed version correctly. Added validation, explicit submission, retry/error handling, membership refresh and routed/modal Escape/cancel handling. Tags are keyboard-operable buttons.
- Profile fetch failures caused an unhandled subscription error; missing communities rendered an empty panel. Both now show errors. Failed community/role loads clear stale caches/permissions.
- Registration accepted passwords below the API's eight-character minimum; OTP accepted any six characters. Aligned registration validation and restricted OTP to six digits.
- Empty/default child routes did not consistently navigate to useful screens. Added default/fallback redirects.
- Pending/blocked friend request failures were stored but not displayed. Rendered error alerts.
- Older friend-search responses could replace newer results. Cancel requests immediately when input changes and dispose subscriptions on destruction.
- Escape did not dismiss a focused confirmation dialog because its panel stopped propagation. Fixed focused-dialog Escape and attachment/poll-sheet dismissal.
- Voice-token failures removed the Join button, preventing retry. Retained a retryable lobby and corrected the parent community route lookup.
- DM and voice-room setup could compete for microphone/camera access. Added synchronous shared media reservation and cleanup, with contention/release unit tests and an incoming-call rejection browser regression.
- Call/presence listeners were bound only once even after logout/login created a new socket. Bind once per socket instead, verified with a same-tab re-login incoming call.
- Invalid community/channel/avatar values produced opaque HTTP 500 responses. Preserve Zod validation errors and return HTTP 400 with the affected field; the live suite checks create/update/missing-body cases.
- The expanded channel sidebar squeezed mobile community content into half the screen on first visit. Default it to collapsed below 768px; keep desktop defaults and explicitly saved preferences, and test toggling/reloading.
- Associated profile/password labels with their inputs, added autofill hints, removed developer-facing DM empty-state text and restored assets in Karma tests.

## Verification

- `npm run test:e2e:all`: **94 fixture tests passed (39.5s) + 8 isolated live tests passed (24.9s)**, zero skips/retries locally.
- `npm run test:client`: **97 Angular/Jasmine tests passed** using Playwright Chromium headless shell.
- `npm run build:client` and `npm run build:server`: **passed**.
- App and spec TypeScript checks: `tsc --noEmit -p client/tsconfig.app.json` and `tsc --noEmit -p client/tsconfig.spec.json`: **passed**; server `tsc --noEmit -p server/tsconfig.json`: **passed**.
- Server `test:chat-media-url` and `test:chat-message-content` self-tests: **passed**.
- CLI headless Chrome navigation/snapshot/mobile screenshot; session closed after review.

Reports are generated locally under `playwright-report/` and screenshots/traces under `test-results/`, ignored by git. No commit, push, deployment, or production records were made. The pre-existing auth interceptor change was preserved.

## Limits and remaining checks

This is broad regression coverage, not a guarantee that every possible app state is bug-free. Fixture-based email/reset/upload checks do not verify real providers. LiveKit media, TURN/two-device WebRTC, real email delivery, Cloudinary upload delivery and GIPHY need separately configured test services/devices; no such credentials were used. No Firefox, WebKit, or physical-phone testing was performed. Existing deliberate design/tooling backlog items in HANDOFF (#10 and #14) remain outside these fixes.
