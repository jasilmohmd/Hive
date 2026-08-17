"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIceServers = buildIceServers;
const DEFAULT_STUN = { urls: "stun:stun.l.google.com:19302" };
function buildIceServers() {
    var _a, _b, _c;
    const servers = [DEFAULT_STUN];
    const turnUrl = (_a = process.env.TURN_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (turnUrl) {
        servers.push({
            urls: turnUrl,
            username: (_b = process.env.TURN_USERNAME) === null || _b === void 0 ? void 0 : _b.trim(),
            credential: (_c = process.env.TURN_CREDENTIAL) === null || _c === void 0 ? void 0 : _c.trim(),
        });
    }
    return servers;
}
