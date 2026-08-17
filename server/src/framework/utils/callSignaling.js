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
exports.registerCallSignaling = registerCallSignaling;
exports.getDirectChatPeer = getDirectChatPeer;
const directChatAuth_util_1 = require("./directChatAuth.util");
const callMessageContent_1 = require("./callMessageContent");
const activeCalls = new Map();
const userActiveCallId = new Map();
function userRoom(userId) {
    return `user:${userId}`;
}
function emitToUser(io, userId, event, payload) {
    io.to(userRoom(userId)).emit(event, payload);
}
function getPeerId(session, userId) {
    if (session.callerId === userId)
        return session.calleeId;
    if (session.calleeId === userId)
        return session.callerId;
    return null;
}
function clearUserCall(userId, callId) {
    if (userActiveCallId.get(userId) === callId) {
        userActiveCallId.delete(userId);
    }
}
function resolveCallOutcome(session, endedBy, reason) {
    if (reason === "reject")
        return "declined";
    if (session.connectedAt)
        return "completed";
    if (endedBy === session.callerId)
        return "cancelled";
    return "missed";
}
function persistCallLog(io, chatUseCase, session, outcome, endedBy) {
    return __awaiter(this, void 0, void 0, function* () {
        const durationSeconds = session.connectedAt
            ? Math.max(0, Math.floor((Date.now() - session.connectedAt) / 1000))
            : 0;
        const content = (0, callMessageContent_1.buildCallMessageContent)({
            callType: session.callType,
            outcome,
            durationSeconds,
            callerId: session.callerId,
            endedBy,
        });
        const message = yield chatUseCase.sendMessage(session.callerId, session.chatId, content, "call");
        io.to(session.chatId).emit("newMessage", message);
    });
}
function endSession(io, session, endedBy) {
    session.status = "ended";
    const payload = { callId: session.callId, chatId: session.chatId, endedBy };
    emitToUser(io, session.callerId, "call:ended", payload);
    emitToUser(io, session.calleeId, "call:ended", payload);
    clearUserCall(session.callerId, session.callId);
    clearUserCall(session.calleeId, session.callId);
    activeCalls.delete(session.callId);
}
function finishCall(io, chatUseCase, session, endedBy, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        if (session.status === "ended")
            return;
        const outcome = resolveCallOutcome(session, endedBy, reason);
        try {
            yield persistCallLog(io, chatUseCase, session, outcome, endedBy);
        }
        catch (err) {
            console.error("[call] failed to persist call log", err);
        }
        if (reason === "reject") {
            emitToUser(io, session.callerId, "call:rejected", {
                callId: session.callId,
                chatId: session.chatId,
            });
            emitToUser(io, session.calleeId, "call:rejected", {
                callId: session.callId,
                chatId: session.chatId,
            });
        }
        endSession(io, session, endedBy);
    });
}
function userBusy(userId) {
    const callId = userActiveCallId.get(userId);
    if (!callId)
        return false;
    const session = activeCalls.get(callId);
    return !!session && session.status !== "ended";
}
function registerCallSignaling(io, chatUseCase) {
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        if (!userId)
            return;
        socket.join(userRoom(userId));
        socket.on("disconnect", () => {
            const callId = userActiveCallId.get(userId);
            if (!callId)
                return;
            const session = activeCalls.get(callId);
            if (!session || session.status === "ended")
                return;
            void finishCall(io, chatUseCase, session, userId, "end");
        });
        socket.on("call:invite", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.info(`[call] invite from ${userId}`, data === null || data === void 0 ? void 0 : data.callId, data === null || data === void 0 ? void 0 : data.chatId, data === null || data === void 0 ? void 0 : data.callType);
                if (!(data === null || data === void 0 ? void 0 : data.callId) || !(data === null || data === void 0 ? void 0 : data.chatId) || !(data === null || data === void 0 ? void 0 : data.callType)) {
                    socket.emit("call:error", { message: "Invalid call invite" });
                    return;
                }
                if (data.callType !== "audio" && data.callType !== "video") {
                    socket.emit("call:error", { message: "Invalid call type" });
                    return;
                }
                if (userBusy(userId)) {
                    socket.emit("call:busy", { callId: data.callId });
                    return;
                }
                const { peerId } = yield (0, directChatAuth_util_1.assertDirectChatFriends)(userId, data.chatId);
                if (userBusy(peerId)) {
                    socket.emit("call:busy", { callId: data.callId });
                    return;
                }
                const room = io.sockets.adapter.rooms.get(userRoom(peerId));
                if (!room || room.size === 0) {
                    const offlineSession = {
                        callId: data.callId,
                        chatId: data.chatId,
                        callerId: userId,
                        calleeId: peerId,
                        callType: data.callType,
                        status: "ended",
                    };
                    try {
                        yield persistCallLog(io, chatUseCase, offlineSession, "unavailable", userId);
                    }
                    catch (err) {
                        console.error("[call] failed to persist offline call log", err);
                    }
                    socket.emit("call:unavailable", {
                        callId: data.callId,
                        chatId: data.chatId,
                    });
                    return;
                }
                const session = {
                    callId: data.callId,
                    chatId: data.chatId,
                    callerId: userId,
                    calleeId: peerId,
                    callType: data.callType,
                    status: "ringing",
                };
                activeCalls.set(data.callId, session);
                userActiveCallId.set(userId, data.callId);
                emitToUser(io, peerId, "call:incoming", {
                    callId: data.callId,
                    chatId: data.chatId,
                    callType: data.callType,
                    callerId: userId,
                });
                socket.emit("call:ringing", { callId: data.callId });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Call failed";
                socket.emit("call:error", { message });
            }
        }));
        socket.on("call:accept", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(data === null || data === void 0 ? void 0 : data.callId) || !(data === null || data === void 0 ? void 0 : data.chatId))
                    return;
                const session = activeCalls.get(data.callId);
                if (!session || session.calleeId !== userId) {
                    socket.emit("call:error", { message: "Call not found" });
                    return;
                }
                yield (0, directChatAuth_util_1.assertDirectChatFriends)(userId, data.chatId);
                session.status = "active";
                session.connectedAt = Date.now();
                userActiveCallId.set(userId, data.callId);
                emitToUser(io, session.callerId, "call:accepted", {
                    callId: data.callId,
                    chatId: data.chatId,
                });
                emitToUser(io, session.calleeId, "call:accepted", {
                    callId: data.callId,
                    chatId: data.chatId,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Call failed";
                socket.emit("call:error", { message });
            }
        }));
        socket.on("call:reject", (data) => __awaiter(this, void 0, void 0, function* () {
            if (!(data === null || data === void 0 ? void 0 : data.callId))
                return;
            const session = activeCalls.get(data.callId);
            if (!session)
                return;
            if (session.calleeId !== userId && session.callerId !== userId)
                return;
            yield finishCall(io, chatUseCase, session, userId, "reject");
        }));
        socket.on("call:end", (data) => __awaiter(this, void 0, void 0, function* () {
            if (!(data === null || data === void 0 ? void 0 : data.callId))
                return;
            const session = activeCalls.get(data.callId);
            if (!session)
                return;
            if (session.callerId !== userId && session.calleeId !== userId)
                return;
            yield finishCall(io, chatUseCase, session, userId, "end");
        }));
        const relayToPeer = (event, data) => {
            if (!(data === null || data === void 0 ? void 0 : data.callId))
                return;
            const session = activeCalls.get(data.callId);
            if (!session || session.status === "ended")
                return;
            const peerId = getPeerId(session, userId);
            if (!peerId)
                return;
            emitToUser(io, peerId, event, Object.assign(Object.assign({}, data), { fromUserId: userId }));
        };
        socket.on("call:offer", (data) => relayToPeer("call:offer", data));
        socket.on("call:answer", (data) => relayToPeer("call:answer", data));
        socket.on("call:ice-candidate", (data) => relayToPeer("call:ice-candidate", data));
    });
}
/** Resolve peer for client-side validation helpers */
function getDirectChatPeer(userId, chatId) {
    return (0, directChatAuth_util_1.parseDirectChatPeer)(userId, chatId);
}
