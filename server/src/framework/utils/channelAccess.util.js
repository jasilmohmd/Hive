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
exports.userHasChannelAccess = userHasChannelAccess;
exports.assertVoiceroomChannelAccess = assertVoiceroomChannelAccess;
const mongoose_1 = require("mongoose");
function communityObjectId(channel) {
    const c = channel.communityId;
    if (c instanceof mongoose_1.Types.ObjectId)
        return c;
    if (c && typeof c === "object" && "_id" in c) {
        return new mongoose_1.Types.ObjectId(String(c._id));
    }
    return new mongoose_1.Types.ObjectId(String(c));
}
function userHasChannelAccess(userId, channel, communityRepository) {
    return __awaiter(this, void 0, void 0, function* () {
        const communityId = communityObjectId(channel);
        const userRoleIds = yield communityRepository.getUserRoles(communityId, userId);
        return channel.allowedRoles.some((ar) => userRoleIds.some((ur) => ur.equals(ar)));
    });
}
function assertVoiceroomChannelAccess(userId, channelId, channelRepository, communityRepository) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!mongoose_1.Types.ObjectId.isValid(channelId)) {
            throw new Error("Invalid channel ID");
        }
        const channel = yield channelRepository.getChannelById(new mongoose_1.Types.ObjectId(channelId));
        if (!channel) {
            throw new Error("Channel not found");
        }
        if (channel.type !== "voiceroom") {
            throw new Error("Channel is not a voice room");
        }
        const userOid = new mongoose_1.Types.ObjectId(userId);
        if (!(yield userHasChannelAccess(userOid, channel, communityRepository))) {
            throw new Error("Unauthorized to join this voice room");
        }
        const cap = Math.min(6, (_a = channel.maxParticipants) !== null && _a !== void 0 ? _a : 6);
        return { channel, maxParticipants: cap };
    });
}
