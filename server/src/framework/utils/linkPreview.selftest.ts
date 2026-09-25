/**
 * Run: npm run test:link-preview
 *
 * No network needed: every case here is rejected before a request is made.
 */
import assert from "assert";
import {
  assertSafePreviewUrl,
  checkResolvedAddresses,
  extractFirstHttpUrl,
  fetchLinkPreview,
  isPrivateAddress,
} from "./linkPreview";
import { isClientSendableMessageType } from "./chatMessageContent";
import { ValidationError } from "../../errors/customError.error";

// --- private / reserved addresses -----------------------------------------
for (const ip of [
  "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1",
  "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1",
  "::1", "::", "fe80::1", "fd12:3456::1", "::ffff:10.0.0.1", "::ffff:127.0.0.1",
]) {
  assert.ok(isPrivateAddress(ip), `${ip} should be private`);
}
for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
  assert.ok(!isPrivateAddress(ip), `${ip} should be public`);
}

// --- URL checks: 400-class errors, not generic ones ------------------------
const rejects = (url: string) =>
  assert.throws(() => assertSafePreviewUrl(url), (e: unknown) => e instanceof ValidationError, url);
rejects("http://example.com");
rejects("https://localhost:4200/x");
rejects("https://printer.local/");
rejects("https://metadata.google.internal/");
rejects("https://192.168.1.1/admin");
rejects("https://[::1]/");
rejects("https://[fd00::5]/");
rejects("https://user:pass@example.com/");
rejects("not a url");
assert.strictEqual(assertSafePreviewUrl("https://example.com/a?b=1").hostname, "example.com");

// --- a hostname resolving privately is refused at connect time -------------
assert.throws(() => checkResolvedAddresses([{ address: "10.0.0.8", family: 4 }]));
assert.throws(() => checkResolvedAddresses([
  { address: "93.184.216.34", family: 4 },
  { address: "127.0.0.1", family: 4 },
]));
assert.throws(() => checkResolvedAddresses([]));
assert.doesNotThrow(() => checkResolvedAddresses([{ address: "93.184.216.34", family: 4 }]));

// --- extraction ---------------------------------------------------------------
assert.strictEqual(extractFirstHttpUrl("see https://example.com/x and more"), "https://example.com/x");
assert.strictEqual(extractFirstHttpUrl("no links here"), null);

// --- message types clients may send ------------------------------------------
assert.ok(isClientSendableMessageType("text"));
assert.ok(isClientSendableMessageType("poll"));
assert.ok(!isClientSendableMessageType("call"), "call logs are server-only");
assert.ok(!isClientSendableMessageType("nonsense"));

// --- previews are best-effort: never throw, just no preview ---------------------
(async () => {
  for (const url of ["https://localhost:4200", "https://192.168.1.1/", "https://[::1]/", "garbage"]) {
    const preview = await fetchLinkPreview(url);
    assert.strictEqual(preview, null, url);
  }
  console.log("linkPreview selftest: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
