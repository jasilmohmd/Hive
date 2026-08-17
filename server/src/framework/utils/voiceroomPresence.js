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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannelPresenceList = getChannelPresenceList;
exports.registerVoiceroomPresence = registerVoiceroomPresence;
const channel_repository_1 = require("../../repositories/channel.repository");
const community_repository_1 = require("../../repositories/community.repository");
const channelAccess_util_1 = require("./channelAccess.util");
const user_model_1 = __importDefault(require("../models/user.model"));
const channelPresence = new Map();
function channelRoom(channelId) {
    return `channel:${channelId}`;
}
function getChannelPresenceList(channelId) {
    const map = channelPresence.get(channelId);
    if (!map)
        return [];
    return Array.from(map.values());
}
function broadcastState(io, channelId) {
    io.to(channelRoom(channelId)).emit("room:state", {
        channelId,
        participants: getChannelPresenceList(channelId),
    });
}
const channelRepository = new channel_repository_1.ChannelRepository();
const communityRepository = new community_repository_1.CommunityRepository();
function registerVoiceroomPresence(io) {
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        if (!userId)
            return;
        socket.on("disconnect", () => {
            for (const [channelId, map] of channelPresence.entries()) {
                if (map.delete(userId)) {
                    if (map.size === 0)
                        channelPresence.delete(channelId);
                    broadcastState(io, channelId);
                }
            }
        });
        socket.on("room:watch", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(data === null || data === void 0 ? void 0 : data.channelId))
                    return;
                yield (0, channelAccess_util_1.assertVoiceroomChannelAccess)(userId, data.channelId, channelRepository, communityRepository);
                socket.join(channelRoom(data.channelId));
                socket.emit("room:state", {
                    channelId: data.channelId,
                    participants: getChannelPresenceList(data.channelId),
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Could not watch room";
                socket.emit("room:error", { message });
            }
        }));
        socket.on("room:unwatch", (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.channelId))
                return;
            socket.leave(channelRoom(data.channelId));
        });
        socket.on("room:join", (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                if (!(data === null || data === void 0 ? void 0 : data.channelId))
                    return;
                yield (0, channelAccess_util_1.assertVoiceroomChannelAccess)(userId, data.channelId, channelRepository, communityRepository);
                socket.join(channelRoom(data.channelId));
                let map = channelPresence.get(data.channelId);
                if (!map) {
                    map = new Map();
                    channelPresence.set(data.channelId, map);
                }
                const user = yield user_model_1.default.findById(userId).select("userName imageUrl").lean();
                const row = user;
                const existing = map.get(userId);
                map.set(userId, {
                    userId,
                    userName: row && typeof row.userName === "string" ? row.userName : "User",
                    imageUrl: row && typeof row.imageUrl === "string" ? row.imageUrl : undefined,
                    muted: !!data.muted,
                    cameraOn: (_a = existing === null || existing === void 0 ? void 0 : existing.cameraOn) !== null && _a !== void 0 ? _a : false,
                    screenOn: (_b = existing === null || existing === void 0 ? void 0 : existing.screenOn) !== null && _b !== void 0 ? _b : false,
                });
                broadcastState(io, data.channelId);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Could not join room";
                socket.emit("room:error", { message });
            }
        }));
        socket.on("room:leave", (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.channelId))
                return;
            const map = channelPresence.get(data.channelId);
            if (map === null || map === void 0 ? void 0 : map.delete(userId)) {
                if (map.size === 0)
                    channelPresence.delete(data.channelId);
            }
            /* Stay in channel room if still watching lobby — only room:unwatch leaves */
            broadcastState(io, data.channelId);
        });
        socket.on("room:mute", (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.channelId))
                return;
            const map = channelPresence.get(data.channelId);
            const p = map === null || map === void 0 ? void 0 : map.get(userId);
            if (!p)
                return;
            p.muted = !!data.muted;
            broadcastState(io, data.channelId);
        });
        socket.on("room:media", (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.channelId))
                return;
            const map = channelPresence.get(data.channelId);
            const p = map === null || map === void 0 ? void 0 : map.get(userId);
            if (!p)
                return;
            if (data.cameraOn !== undefined)
                p.cameraOn = !!data.cameraOn;
            if (data.screenOn !== undefined)
                p.screenOn = !!data.screenOn;
            broadcastState(io, data.channelId);
        });
    });
}
