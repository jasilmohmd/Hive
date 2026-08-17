/**
 * Run: npm run test:chat-message-content
 */
import assert from "assert";
import {
  assertAllowedMime,
  assertValidReactionEmoji,
  buildContactContent,
  buildFileContent,
  buildPollContent,
  parseContactContent,
  parseFileContent,
  parseLocationContent,
  parseMetadata,
  parsePollContent,
  stringifyLocationContent,
  stringifyMetadata,
} from "./chatMessageContent";

assert.throws(() => assertAllowedMime("application/x-msdownload", "document"));
assert.doesNotThrow(() => assertAllowedMime("application/pdf", "document"));
assert.doesNotThrow(() => assertAllowedMime("video/mp4", "video"));
assert.throws(() => assertAllowedMime("image/png", "video"));

const loc = parseLocationContent(
  JSON.stringify({ lat: 12.5, lng: -77.03, label: "Meet here", accuracy: 10 })
);
assert.strictEqual(loc.lat, 12.5);
assert.strictEqual(loc.lng, -77.03);
assert.strictEqual(loc.label, "Meet here");
assert.strictEqual(
  stringifyLocationContent(loc),
  JSON.stringify({ lat: 12.5, lng: -77.03, label: "Meet here", accuracy: 10 })
);
assert.throws(() => parseLocationContent(JSON.stringify({ lat: 999, lng: 0 })));
assert.throws(() => parseLocationContent("not-json"));

const fileJson = buildFileContent({
  url: "https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf",
  name: "doc.pdf",
  mime: "application/pdf",
  size: 1024,
});
const file = parseFileContent(fileJson);
assert.strictEqual(file.name, "doc.pdf");
assert.throws(() => parseFileContent(JSON.stringify({ url: "http://evil.com/x", name: "x", mime: "application/pdf", size: 1 })));

assert.doesNotThrow(() => assertAllowedMime("audio/webm", "audio"));
assert.throws(() => assertAllowedMime("image/png", "audio"));

assert.strictEqual(assertValidReactionEmoji("👍"), "👍");
assert.throws(() => assertValidReactionEmoji(""));

const contact = parseContactContent(
  buildContactContent({ userId: "507f1f77bcf86cd799439011", userName: "Ada" })
);
assert.strictEqual(contact.userName, "Ada");

const poll = parsePollContent(
  buildPollContent({ question: "Lunch?", options: ["Pizza", "Salad"], allowMultiple: false })
);
assert.strictEqual(poll.question, "Lunch?");
assert.throws(() => parsePollContent(JSON.stringify({ question: "x", options: ["only"] })));

const meta = parseMetadata(stringifyMetadata({ forwardedFrom: { chatId: "c1", messageId: "m1" } }));
assert.strictEqual(meta.forwardedFrom?.messageId, "m1");

console.log("chatMessageContent selftest ok");
