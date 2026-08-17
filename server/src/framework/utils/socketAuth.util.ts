import { Socket } from "socket.io";

/**
 * Prefer explicit auth.token (needed when API runs on another origin than the SPA).
 * Falls back to parsing the HTTP-only cookie from the handshake.
 */
export function extractSocketToken(socket: Socket): string | undefined {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth.trim()) {
    return fromAuth.trim();
  }

  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(";").map((c) => c.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== "token") continue;
    return decodeURIComponent(part.slice(eq + 1));
  }

  return undefined;
}
