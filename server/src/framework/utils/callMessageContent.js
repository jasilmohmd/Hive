"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCallMessageContent = buildCallMessageContent;
exports.parseCallMessageContent = parseCallMessageContent;
function buildCallMessageContent(payload) {
    return JSON.stringify({
        callType: payload.callType,
        outcome: payload.outcome,
        durationSeconds: Math.max(0, Math.floor(payload.durationSeconds)),
        callerId: payload.callerId,
        endedBy: payload.endedBy,
    });
}
function parseCallMessageContent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error("Invalid call message content");
    }
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid call message content");
    }
    const o = parsed;
    const callType = o.callType;
    const outcome = o.outcome;
    if (callType !== "audio" && callType !== "video") {
        throw new Error("Invalid call type in call message");
    }
    if (outcome !== "completed" &&
        outcome !== "missed" &&
        outcome !== "declined" &&
        outcome !== "cancelled" &&
        outcome !== "unavailable") {
        throw new Error("Invalid call outcome in call message");
    }
    const durationSeconds = typeof o.durationSeconds === "number" && Number.isFinite(o.durationSeconds)
        ? Math.max(0, Math.floor(o.durationSeconds))
        : 0;
    if (typeof o.callerId !== "string" || !o.callerId.trim()) {
        throw new Error("Invalid callerId in call message");
    }
    return {
        callType,
        outcome,
        durationSeconds,
        callerId: o.callerId.trim(),
        endedBy: typeof o.endedBy === "string" ? o.endedBy : undefined,
    };
}
