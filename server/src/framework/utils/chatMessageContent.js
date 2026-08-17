"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDITABLE_MESSAGE_TYPES = exports.ALLOWED_MESSAGE_TYPES = exports.AUDIO_MIME_ALLOWLIST = exports.VIDEO_MIME_ALLOWLIST = exports.DOCUMENT_MIME_ALLOWLIST = void 0;
exports.assertAllowedMime = assertAllowedMime;
exports.assertValidReactionEmoji = assertValidReactionEmoji;
exports.parseContactContent = parseContactContent;
exports.buildContactContent = buildContactContent;
exports.parsePollContent = parsePollContent;
exports.buildPollContent = buildPollContent;
exports.parseMetadata = parseMetadata;
exports.stringifyMetadata = stringifyMetadata;
exports.parseFileContent = parseFileContent;
exports.buildFileContent = buildFileContent;
exports.parseLocationContent = parseLocationContent;
exports.stringifyLocationContent = stringifyLocationContent;
const MAX_LABEL_LENGTH = 200;
const MAX_FILE_NAME_LENGTH = 255;
const MAX_URL_LENGTH = 2048;
exports.DOCUMENT_MIME_ALLOWLIST = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
]);
exports.VIDEO_MIME_ALLOWLIST = new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
]);
exports.AUDIO_MIME_ALLOWLIST = new Set([
    "audio/mpeg",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
]);
const MAX_POLL_OPTIONS = 10;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_QUESTION = 300;
const MAX_POLL_OPTION_LEN = 100;
const MAX_EMOJI_LEN = 8;
function assertAllowedMime(mime, kind) {
    const normalized = (mime || "").toLowerCase().split(";")[0].trim();
    const allowed = kind === "video"
        ? exports.VIDEO_MIME_ALLOWLIST
        : kind === "audio"
            ? exports.AUDIO_MIME_ALLOWLIST
            : exports.DOCUMENT_MIME_ALLOWLIST;
    if (!allowed.has(normalized)) {
        throw new Error(`File type not allowed for ${kind} upload`);
    }
}
function assertValidReactionEmoji(emoji) {
    const trimmed = emoji.trim();
    if (!trimmed || trimmed.length > MAX_EMOJI_LEN) {
        throw new Error("Invalid reaction emoji");
    }
    return trimmed;
}
function parseContactContent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error("Invalid contact message content");
    }
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid contact message content");
    }
    const o = parsed;
    const userId = typeof o.userId === "string" ? o.userId.trim() : "";
    const userName = typeof o.userName === "string" ? o.userName.trim() : "";
    if (!userId)
        throw new Error("Invalid contact userId");
    if (!userName || userName.length > 100)
        throw new Error("Invalid contact userName");
    const result = { userId, userName };
    if (typeof o.imageUrl === "string" && o.imageUrl.trim()) {
        result.imageUrl = o.imageUrl.trim();
    }
    return result;
}
function buildContactContent(payload) {
    return JSON.stringify(payload);
}
function parsePollContent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error("Invalid poll message content");
    }
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid poll message content");
    }
    const o = parsed;
    const question = typeof o.question === "string" ? o.question.trim() : "";
    if (!question || question.length > MAX_POLL_QUESTION) {
        throw new Error("Invalid poll question");
    }
    if (!Array.isArray(o.options)) {
        throw new Error("Invalid poll options");
    }
    const options = o.options
        .filter((x) => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    if (options.length < MIN_POLL_OPTIONS || options.length > MAX_POLL_OPTIONS) {
        throw new Error("Poll must have 2–10 options");
    }
    for (const opt of options) {
        if (opt.length > MAX_POLL_OPTION_LEN) {
            throw new Error("Poll option too long");
        }
    }
    return {
        question,
        options,
        allowMultiple: o.allowMultiple === true,
    };
}
function buildPollContent(payload) {
    return JSON.stringify({
        question: payload.question,
        options: payload.options,
        allowMultiple: payload.allowMultiple === true,
    });
}
function parseMetadata(raw) {
    if (!(raw === null || raw === void 0 ? void 0 : raw.trim()))
        return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    }
    catch (_a) {
        return {};
    }
}
function stringifyMetadata(meta) {
    return JSON.stringify(meta);
}
function parseFileContent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error("Invalid file message content");
    }
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid file message content");
    }
    const o = parsed;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const mime = typeof o.mime === "string" ? o.mime.trim() : "";
    const size = typeof o.size === "number" ? o.size : NaN;
    if (!url || url.length > MAX_URL_LENGTH) {
        throw new Error("Invalid file URL");
    }
    if (!url.startsWith("https://")) {
        throw new Error("File URL must use HTTPS");
    }
    if (!name || name.length > MAX_FILE_NAME_LENGTH) {
        throw new Error("Invalid file name");
    }
    if (!mime) {
        throw new Error("Invalid file MIME type");
    }
    assertAllowedMime(mime, "document");
    if (!Number.isFinite(size) || size < 0) {
        throw new Error("Invalid file size");
    }
    return { url, name, mime, size };
}
function buildFileContent(payload) {
    return JSON.stringify({
        url: payload.url,
        name: payload.name,
        mime: payload.mime,
        size: payload.size,
    });
}
function parseLocationContent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error("Invalid location message content");
    }
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid location message content");
    }
    const o = parsed;
    const lat = typeof o.lat === "number" ? o.lat : NaN;
    const lng = typeof o.lng === "number" ? o.lng : NaN;
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error("Invalid latitude");
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new Error("Invalid longitude");
    }
    const result = { lat, lng };
    if (o.label !== undefined) {
        if (typeof o.label !== "string") {
            throw new Error("Invalid location label");
        }
        const label = o.label.trim();
        if (label.length > MAX_LABEL_LENGTH) {
            throw new Error("Location label is too long");
        }
        if (label) {
            result.label = label;
        }
    }
    if (o.accuracy !== undefined) {
        const accuracy = typeof o.accuracy === "number" ? o.accuracy : NaN;
        if (!Number.isFinite(accuracy) || accuracy < 0) {
            throw new Error("Invalid location accuracy");
        }
        result.accuracy = accuracy;
    }
    return result;
}
function stringifyLocationContent(payload) {
    return JSON.stringify(payload);
}
exports.ALLOWED_MESSAGE_TYPES = new Set([
    "text",
    "emoji",
    "image",
    "video",
    "audio",
    "file",
    "gif",
    "sticker",
    "location",
    "contact",
    "poll",
    "call",
]);
exports.EDITABLE_MESSAGE_TYPES = new Set(["text", "poll"]);
