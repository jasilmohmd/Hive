# Hive browser testing

Every feature and bug fix must run Playwright before handoff. See the mandatory rule in [AGENTS.md](../AGENTS.md).

## Install and run

Use Node.js 22 (testing tooling requires Node 20.19+). From the repository root:

```powershell
npm ci
npm ci --prefix client
npm ci --prefix server
npx playwright install chromium
npm run test:e2e:all
npm run test:client
```

On Linux CI, install the OS dependencies too: `npx playwright install --with-deps chromium`.

- `npm run test:e2e`: real Angular UI with deterministic API/Socket.IO fixtures, desktop 1440x900 and mobile 390x844 Chromium.
- `npm run test:e2e:live`: real Express, cookie authentication, Socket.IO and disposable MongoDB integration on both viewports.
- `npm run test:e2e:all`: both suites; required before handoff.
- `npm run test:e2e -- e2e/regressions.spec.ts`: focused iteration.
- `npm run test:e2e:ui`: interactive fixture test runner.
- `npm run test:e2e:report`: fixture HTML report; `npx playwright show-report playwright-report/live` for integration results.
- `npm run test:client`: Angular/Jasmine unit tests using Playwright's Chromium. On Windows this selects the matching headless shell; `CHROME_BIN` can override it.

Exploratory CLI (separate from the test runner):

```powershell
npm run browser:cli -- -s=hive-review open http://localhost:4200/auth/login --browser=chrome
npm run browser:cli -- -s=hive-review snapshot
npm run browser:cli -- -s=hive-review resize 390 844
npm run browser:cli -- -s=hive-review screenshot
npm run browser:cli -- -s=hive-review close
```

The CLI may need its own browser setup (`npm run browser:cli -- install-browser`) on a new machine. Its dependencies and browser selection are separate from `@playwright/test`; successful installation is not a successful test run.

## Isolation and evidence

The suite starts Angular on `localhost:4200`; an existing local Angular dev server can be reused outside CI. Stop any API using port 3000 before the live suite: it deliberately refuses to reuse an existing API. `start-api.cjs` uses MongoDB 8.2.6 (downloaded/cached on first run), seeds only disposable test accounts, uses test-only credentials, and never loads `server/.env`. Normal shutdown removes the temporary database. Do not point it at hosted or production resources.

Fixture tests reject unrecognized API routes, check runtime/console errors on rendered screens, verify horizontal overflow and scroll reachability, and save route screenshots. Reports are in `playwright-report/`, screenshots and failure traces in `test-results/`. These generated files and CLI artifacts are ignored by git. CI uploads browser evidence; the workflow must actually run to establish CI results.

Fixtures cover auth/reset, profile, friends, Discover, community creation/cropping, missing/error states, dialogs/polls, voice retry and socket rebinding. Live tests cover login/logout, protected access, DM/channel persistence and updates, community lifecycle, role CRUD and invalid request responses.

No fixture proves real email delivery, Cloudinary uploads, GIPHY, TURN connectivity, two-device WebRTC or LiveKit media. Those require dedicated configured test services and devices. Chromium mobile emulation is not a physical-device or Firefox/WebKit check.

Primary references: [Playwright web servers](https://playwright.dev/docs/test-webserver), [browser installation](https://playwright.dev/docs/browsers), [Playwright CLI](https://github.com/microsoft/playwright-cli).
