/**
 * Run: npx ts-node --transpile-only src/framework/utils/chatMediaUrl.selftest.ts
 */
import assert from "assert";
import { assertValidChatMediaUrl } from "./chatMediaUrl";

assert.strictEqual(
  assertValidChatMediaUrl("https://media3.giphy.com/media/x/giphy.gif", "gif"),
  "https://media3.giphy.com/media/x/giphy.gif"
);
assert.strictEqual(
  assertValidChatMediaUrl("https://media.giphy.com/media/x/giphy.gif", "gif"),
  "https://media.giphy.com/media/x/giphy.gif"
);
assert.throws(() => assertValidChatMediaUrl("http://media.giphy.com/media/x/giphy.gif", "gif"));
assert.throws(() => assertValidChatMediaUrl("https://evil.com/x.gif", "gif"));
const sticker =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f600.png";
assert.strictEqual(assertValidChatMediaUrl(sticker, "sticker"), sticker);
assert.throws(() => assertValidChatMediaUrl("https://evil.com/1f600.png", "sticker"));
assert.strictEqual(
  assertValidChatMediaUrl("https://media1.giphy.com/media/abc123/sticker.gif", "sticker"),
  "https://media1.giphy.com/media/abc123/sticker.gif"
);
console.log("chatMediaUrl selftest ok");
