const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

let executable = chromium.executablePath();
// Use Playwright's minimal headless shell on Windows. The full Chrome binary
// can load machine-managed extensions and never connect to Karma.
if (process.platform === 'win32') {
  const revision = executable.match(/[\\/]chromium-(\d+)[\\/]/)?.[1];
  if (!revision) throw new Error('Could not locate Playwright Chromium revision. Set CHROME_BIN explicitly.');
  const cache = path.dirname(path.dirname(path.dirname(executable)));
  executable = path.join(cache, `chromium_headless_shell-${revision}`, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
}
const chromeBin = process.env.CHROME_BIN || executable;
if (!fs.existsSync(chromeBin)) throw new Error('Install the browser first: npx playwright install chromium');
const env = { ...process.env, CHROME_BIN: chromeBin };
const result = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm test --prefix client -- --watch=false --browsers=ChromeHeadless'], { env, stdio: 'inherit' })
  : spawnSync('npm', ['test', '--prefix', 'client', '--', '--watch=false', '--browsers=ChromeHeadless'], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
