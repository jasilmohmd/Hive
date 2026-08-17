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
exports.parseDirectChatPeer = parseDirectChatPeer;
exports.assertDirectChatFriends = assertDirectChatFriends;
const mongoose_1 = require("mongoose");
const friends_repository_1 = __importDefault(require("../../repositories/friends.repository"));
const DIRECT_CHAT_REGEX = /^([a-fA-F0-9]{24})_([a-fA-F0-9]{24})$/;
function parseDirectChatPeer(userId, chatId) {
    const match = chatId.match(DIRECT_CHAT_REGEX);
    if (!match)
        return null;
    const [, id1, id2] = match;
    const normalized = [id1, id2].sort().join("_");
    if (normalized !== chatId)
        return null;
    if (userId !== id1 && userId !== id2)
        return null;
    return userId === id1 ? id2 : id1;
}
function assertDirectChatFriends(userId, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const peerId = parseDirectChatPeer(userId, chatId);
        if (!peerId) {
            throw new Error("Invalid direct chat");
        }
        const friendRepo = new friends_repository_1.default();
        const uid = new mongoose_1.Types.ObjectId(userId);
        const pid = new mongoose_1.Types.ObjectId(peerId);
        const peerHasUser = yield friendRepo.checkFriendshipStatus(uid, pid);
        const userHasPeer = yield friendRepo.checkFriendshipStatus(pid, uid);
        if (peerHasUser !== "already_friends" || userHasPeer !== "already_friends") {
            throw new Error("You can only call friends");
        }
        return { peerId };
    });
}
