"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSafePreviewUrl = assertSafePreviewUrl;
exports.extractFirstHttpUrl = extractFirstHttpUrl;
exports.fetchLinkPreview = fetchLinkPreview;
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512000;
const BLOCKED_HOSTNAMES = new Set([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
]);
function isPrivateIpv4(host) {
    const parts = host.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n)))
        return false;
    if (parts[0] === 10)
        return true;
    if (parts[0] === 127)
        return true;
    if (parts[0] === 169 && parts[1] === 254)
        return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
        return true;
    if (parts[0] === 192 && parts[1] === 168)
        return true;
    return false;
}
function assertSafePreviewUrl(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 2048) {
        throw new Error("Invalid URL");
    }
    let url;
    try {
        url = new URL(trimmed);
    }
    catch (_a) {
        throw new Error("Invalid URL");
    }
    if (url.protocol !== "https:") {
        throw new Error("Preview URL must use HTTPS");
    }
    const host = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".local")) {
        throw new Error("URL host not allowed");
    }
    if (isPrivateIpv4(host)) {
        throw new Error("URL host not allowed");
    }
    return url;
}
function extractMeta(html, property) {
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m === null || m === void 0 ? void 0 : m[1])
            return m[1].trim();
    }
    return undefined;
}
function extractFirstHttpUrl(text) {
    const m = text.match(/https:\/\/[^\s<>"']+/i);
    return m ? m[0] : null;
}
function fetchLinkPreview(rawUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const url = assertSafePreviewUrl(rawUrl);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = yield fetch(url.toString(), {
                signal: controller.signal,
                headers: { "User-Agent": "HiveChatBot/1.0", Accept: "text/html" },
                redirect: "follow",
            });
            if (!res.ok)
                return null;
            const buf = yield res.arrayBuffer();
            if (buf.byteLength > MAX_HTML_BYTES)
                return null;
            const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
            const title = (_a = extractMeta(html, "og:title")) !== null && _a !== void 0 ? _a : extractMeta(html, "twitter:title");
            const description = (_b = extractMeta(html, "og:description")) !== null && _b !== void 0 ? _b : extractMeta(html, "description");
            const image = (_c = extractMeta(html, "og:image")) !== null && _c !== void 0 ? _c : extractMeta(html, "twitter:image");
            return {
                url: url.toString(),
                title: title || undefined,
                description: description || undefined,
                image: (image === null || image === void 0 ? void 0 : image.startsWith("https://")) ? image : undefined,
            };
        }
        catch (_d) {
            return null;
        }
        finally {
            clearTimeout(timer);
        }
    });
}
