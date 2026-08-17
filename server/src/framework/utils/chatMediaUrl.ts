const MAX_URL_LENGTH = 2048;

/** Giphy CDN hosts used for downsized/full GIF URLs from the API. */
function isGiphyMediaHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "media.giphy.com" || h === "i.giphy.com") return true;
  return /^media\d+\.giphy\.com$/.test(h);
}

/** Twemoji on jsDelivr (legacy / optional) or same Giphy media hosts as GIFs. */
function isAllowedStickerUrl(url: URL): boolean {
  const h = url.hostname.toLowerCase();
  if (h !== "cdn.jsdelivr.net") return false;
  const p = url.pathname.toLowerCase();
  return p.includes("/twemoji@") || p.includes("/twitter/twemoji");
}

function isAllowedGifUrl(url: URL): boolean {
  return isGiphyMediaHost(url.hostname);
}

/**
 * Validates and returns trimmed HTTPS URL for chat gif/sticker messages.
 * @throws Error with a short message if invalid
 */
export function assertValidChatMediaUrl(raw: string, kind: "gif" | "sticker"): string {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new Error("Invalid media URL");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid media URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Media URL must use HTTPS");
  }
  if (kind === "gif") {
    if (!isAllowedGifUrl(url)) {
      throw new Error("GIF URL is not from an allowed host");
    }
  } else if (!isAllowedStickerUrl(url) && !isGiphyMediaHost(url.hostname)) {
    throw new Error("Sticker URL is not from an allowed host");
  }
  return trimmed;
}
