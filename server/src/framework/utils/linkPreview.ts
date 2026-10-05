import dns from "dns";
import https from "https";
import net from "net";
import type { IncomingMessage } from "http";
import { ValidationError } from "../../errors/customError.error";

const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512_000;
const MAX_REDIRECTS = 3;

export interface ILinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0"]);
const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

function ipv4Octets(host: string): number[] | null {
  if (!net.isIPv4(host)) return null;
  return host.split(".").map((p) => parseInt(p, 10));
}

function isPrivateIpv4(host: string): boolean {
  const o = ipv4Octets(host);
  if (!o) return false;
  const [a, b] = o;
  return (
    a === 0 || // "this network"
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && o[2] === 0) || // IETF protocol assignments
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast + reserved
  );
}

function isPrivateIpv6(host: string): boolean {
  if (!net.isIPv6(host)) return false;
  const h = host.toLowerCase();
  if (h === "::" || h === "::1") return true;
  // IPv4-mapped / -compatible (::ffff:10.0.0.1, ::10.0.0.1): judge the IPv4 part.
  const mapped = h.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  const first = parseInt(h.split(":")[0] || "0", 16);
  return (
    (first & 0xffc0) === 0xfe80 || // fe80::/10 link-local
    (first & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    (first & 0xff00) === 0xff00 // ff00::/8 multicast
  );
}

/** True for any address a server-side fetch must never reach. */
export function isPrivateAddress(address: string): boolean {
  return isPrivateIpv4(address) || isPrivateIpv6(address);
}

/**
 * Syntactic checks on a user-supplied preview URL: HTTPS only, no internal
 * hostnames, no private IP literals. This alone can't stop a public name that
 * *resolves* to a private address — `safeLookup` below handles that at
 * connect time.
 */
export function assertSafePreviewUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new ValidationError("Invalid URL", "url");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ValidationError("Invalid URL", "url");
  }
  if (url.protocol !== "https:") {
    throw new ValidationError("Preview URL must use HTTPS", "url");
  }
  if (url.username || url.password) {
    throw new ValidationError("URL host not allowed", "url");
  }
  // URL keeps IPv6 literals bracketed: [::1]
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s)) ||
    isPrivateAddress(host)
  ) {
    throw new ValidationError("URL host not allowed", "url");
  }
  return url;
}

/**
 * DNS lookup for the preview request itself. Every resolved address is
 * checked, and the socket connects to exactly the address that passed — so a
 * hostname can't resolve publicly for a pre-check and privately for the
 * connection (DNS rebinding).
 */
export function checkResolvedAddresses(addresses: dns.LookupAddress[]): void {
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new ValidationError("URL host not allowed", "url");
  }
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number
) => void;

export function safeLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as unknown as dns.LookupAddress[];
    try {
      checkResolvedAddresses(list);
    } catch (e) {
      return callback(e as NodeJS.ErrnoException, "", 0);
    }
    // Newer Node (autoSelectFamily) asks for every address; older asks for one.
    if (options?.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

type FetchResult =
  | { kind: "html"; html: string }
  | { kind: "redirect"; location: string }
  | { kind: "skip" };

/** One request, no redirect following, body capped while streaming. */
function fetchOnce(url: URL, signal: AbortSignal, lookup: typeof safeLookup): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        lookup: lookup as unknown as typeof dns.lookup,
        // No pooled keep-alive sockets: every preview connection goes through
        // the lookup above, so the address check can't be skipped by reusing
        // a connection opened for an earlier request.
        agent: false,
        headers: { "User-Agent": "HiveChatBot/1.0", Accept: "text/html" },
        signal,
      },
      (res: IncomingMessage) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          resolve({ kind: "redirect", location: res.headers.location });
          return;
        }
        const type = String(res.headers["content-type"] || "");
        if (status !== 200 || !type.includes("text/html")) {
          res.resume();
          resolve({ kind: "skip" });
          return;
        }
        const declared = Number(res.headers["content-length"] || 0);
        if (declared > MAX_HTML_BYTES) {
          res.destroy();
          resolve({ kind: "skip" });
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_HTML_BYTES) {
            // Stop downloading instead of buffering the whole body first.
            res.destroy();
            resolve({ kind: "skip" });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({ kind: "html", html: Buffer.concat(chunks).toString("utf8") })
        );
        res.on("error", reject);
      }
    );
    req.on("error", reject);
  });
}

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

export function extractFirstHttpUrl(text: string): string | null {
  const m = text.match(/https:\/\/[^\s<>"']+/i);
  return m ? m[0] : null;
}

/**
 * Best-effort Open Graph preview. Never throws: a URL that can't or mustn't be
 * previewed just gets no preview. (Previously the host check threw out of
 * here, and since sendMessage didn't catch it, a message containing e.g.
 * https://192.168.1.1 or https://localhost:4200 could not be sent at all.)
 */
export async function fetchLinkPreview(
  rawUrl: string,
  /** Test seam only — production always resolves through safeLookup. */
  lookup: typeof safeLookup = safeLookup
): Promise<ILinkPreview | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let url = assertSafePreviewUrl(rawUrl);
    for (let hop = 0; ; hop++) {
      const result = await fetchOnce(url, controller.signal, lookup);
      if (result.kind === "skip") return null;
      if (result.kind === "redirect") {
        if (hop >= MAX_REDIRECTS) return null;
        // Every hop is re-validated: a public page must not be able to bounce
        // the server onto an internal one.
        url = assertSafePreviewUrl(new URL(result.location, url).toString());
        continue;
      }
      const html = result.html;
      const title = extractMeta(html, "og:title") ?? extractMeta(html, "twitter:title");
      const description =
        extractMeta(html, "og:description") ?? extractMeta(html, "description");
      const image = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
      return {
        url: url.toString(),
        title: title || undefined,
        description: description || undefined,
        image: image?.startsWith("https://") ? image : undefined,
      };
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
