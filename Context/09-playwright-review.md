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

## PR #27 merge validation — 2026-10-06

Merged main `278e80d` into `review/playwright-app-audit`, combining the responsive UI, accessible dialogs, socket/presence lifecycle and multi-tab call fixes with the audit regressions. Main's phone channel drawer replaces the audit's collapsed-column workaround: it starts closed and does not persist its open state. Desktop collapse preferences still persist. Default `/main` navigation retains main's Friends destination; signed-in public/auth navigation still opens Discover.

Media reservation remains synchronous during setup, while an incoming DM call may ring in a connected voice room so the existing confirmation can leave that room before accepting. Added a unit regression for this handoff. Friend search now cancels immediately during the debounce window and keeps main's request feedback. Updated browser locators for responsive cards, searchboxes, current error/dialog wording and the phone Create button. Socket fixtures wait for a handshake heartbeat before testing re-login calls. Fixture font CSS is intercepted so third-party font delivery cannot fail UI regressions.

Validation in the managed Linux environment:

- Client and server production builds passed (`npm run build:client`, `npm run build:server`).
- App, spec and server TypeScript checks passed (`tsc --noEmit` with each project config).
- `npm run test:client`: 118 Jasmine tests passed using installed system Chromium via `CHROME_BIN` and an uncommitted no-sandbox wrapper.
- All three server self-tests passed: `test:chat-media-url`, `test:chat-message-content`, `test:link-preview`.
- The focused friend-search and re-login Playwright checks passed on desktop and mobile (4 tests).
- `npm run test:e2e -- --config=.hive-runtime/playwright.config.ts`: all 94 desktop/mobile fixture tests passed (3.8 minutes), with no skips or retries. The root `test:e2e:all` command was attempted first; because bundled-browser installation and live API startup were blocked, the suites were subsequently invoked separately with environment-only browser configs.
- Isolated live suite attempted with `npm run test:e2e:live -- --config=.hive-runtime/playwright.live.config.ts`: API startup blocked by HTTP 403 downloading MongoDB 8.2.6 from `fastdl.mongodb.org`. No live integration tests ran.
- Playwright's bundled Chromium download was also blocked (HTTP 403 from `cdn.playwright.dev`). Fixture checks instead use system Chromium 151 through an uncommitted config. This does not verify the exact bundled browser revision used by CI.
- Project-local Playwright CLI executed navigation, mobile resize, screenshot and close. Its unmocked login smoke saw environment errors for external-font certificate trust and the unavailable local API; deterministic fixture checks intercept those dependencies. Representative desktop/mobile route screenshots were visually inspected.

`.hive-runtime`, work logs/caches and generated browser artifacts are locally excluded, never committed. Real email, Cloudinary, GIPHY, LiveKit/TURN/two-device media, physical-device and Firefox/WebKit checks remain unverified; no configured test services were available. GitHub Actions was not run locally.
