# Hive development rules

## Required testing after every feature or bug fix

- Every implemented feature and bug fix must be exercised with project-local Playwright before declaring it complete. Run `npm run test:e2e:all` from the repository root; for focused iterations run the relevant spec, then run both fixture and isolated live suites before handoff.
- Add meaningful Playwright regression coverage for changed user flows, including success, validation/error states, and desktop/mobile behavior where applicable. Inspect screenshots and browser errors for UI changes.
- Use `npx playwright-cli` for exploratory browser checks when useful. The CLI, test runner, and installed browser must actually execute; installed packages alone are not verification.
- Also run affected Angular unit tests (`npm run test:client`, uses Playwright's Chromium), app/spec typechecks, server self-tests/typecheck, and builds. Report the commands and actual results. A blocked or skipped check must be stated explicitly.
- Browser fixtures exercise the real Angular UI with intercepted API responses. Label this coverage accurately; it does not prove MongoDB, email, uploads, Socket.IO, WebRTC, or LiveKit integration. Use isolated test resources for live integration and never create synthetic records in production.
- Preserve existing user changes. Do not commit or push without an explicit request.

## Setup

`npm ci`, `npm ci --prefix client`, `npm ci --prefix server`, then `npx playwright install chromium` (CI: `npx playwright install --with-deps chromium`).

Playwright configuration is at the repository root and its `testDir` is `./e2e`, separate from Angular/Jasmine specs. See `e2e/README.md` for coverage and limitations.
