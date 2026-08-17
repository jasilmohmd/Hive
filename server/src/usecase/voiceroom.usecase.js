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
exports.VoiceroomUseCase = void 0;
const channelAccess_util_1 = require("../framework/utils/channelAccess.util");
const livekitSdk_js_1 = require("../framework/utils/livekitSdk.js");
const voiceroomPresence_1 = require("../framework/utils/voiceroomPresence");
const user_model_1 = __importDefault(require("../framework/models/user.model"));
function livekitApiHost() {
    var _a, _b;
    const raw = (_b = (_a = process.env.LIVEKIT_URL) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    if (!raw)
        throw new Error("LiveKit is not configured");
    return raw.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
}
class VoiceroomUseCase {
    constructor(channelRepository, communityRepository) {
        this.channelRepository = channelRepository;
        this.communityRepository = communityRepository;
    }
    createJoinToken(userId, channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const apiKey = (_a = process.env.LIVEKIT_API_KEY) === null || _a === void 0 ? void 0 : _a.trim();
            const apiSecret = (_b = process.env.LIVEKIT_API_SECRET) === null || _b === void 0 ? void 0 : _b.trim();
            const livekitUrl = (_c = process.env.LIVEKIT_URL) === null || _c === void 0 ? void 0 : _c.trim();
            if (!apiKey || !apiSecret || !livekitUrl) {
                throw new Error("LiveKit is not configured on the server");
            }
            const { maxParticipants } = yield (0, channelAccess_util_1.assertVoiceroomChannelAccess)(userId, channelId, this.channelRepository, this.communityRepository);
            const { AccessToken, RoomServiceClient } = yield (0, livekitSdk_js_1.loadLiveKitSdk)();
            const host = livekitApiHost();
            const roomService = new RoomServiceClient(host, apiKey, apiSecret);
            try {
                const participants = yield roomService.listParticipants(channelId);
                if (participants.length >= maxParticipants) {
                    const err = new Error("Voice room is full");
                    err.statusCode = 403;
                    throw err;
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : "";
                if (msg.includes("not found") || msg.includes("does not exist")) {
                    /* room will be created on first join */
                }
                else if (e.statusCode === 403) {
                    throw e;
                }
            }
            const user = yield user_model_1.default.findById(userId).select("userName").lean();
            const displayName = user && typeof user.userName === "string"
                ? user.userName
                : "User";
            const at = new AccessToken(apiKey, apiSecret, {
                identity: userId,
                name: displayName,
                ttl: "2h",
            });
            at.addGrant({
                roomJoin: true,
                room: channelId,
                canPublish: true,
                canSubscribe: true,
            });
            return {
                token: yield at.toJwt(),
                livekitUrl,
                maxParticipants,
            };
        });
    }
    getPresence(userId, channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { maxParticipants } = yield (0, channelAccess_util_1.assertVoiceroomChannelAccess)(userId, channelId, this.channelRepository, this.communityRepository);
            return {
                participants: (0, voiceroomPresence_1.getChannelPresenceList)(channelId),
                maxParticipants,
            };
        });
    }
}
exports.VoiceroomUseCase = VoiceroomUseCase;
