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
exports.MessageReactionRepository = void 0;
const mongoose_1 = require("mongoose");
const messageReaction_model_1 = require("../framework/models/messageReaction.model");
function toSummaries(rows, viewerUserId) {
    var _a;
    const byEmoji = new Map();
    for (const row of rows) {
        const uid = row.userId.toString();
        const entry = (_a = byEmoji.get(row.emoji)) !== null && _a !== void 0 ? _a : { count: 0, userIds: [] };
        entry.count += 1;
        entry.userIds.push(uid);
        byEmoji.set(row.emoji, entry);
    }
    return Array.from(byEmoji.entries()).map(([emoji, { count, userIds }]) => ({
        emoji,
        count,
        userIds,
        reactedByMe: userIds.includes(viewerUserId),
    }));
}
class MessageReactionRepository {
    setReaction(messageId, userId, emoji) {
        return __awaiter(this, void 0, void 0, function* () {
            yield messageReaction_model_1.MessageReactionModel.findOneAndUpdate({ messageId: new mongoose_1.Types.ObjectId(messageId), userId: new mongoose_1.Types.ObjectId(userId) }, { emoji }, { upsert: true, new: true });
            return this.getSummariesForMessage(messageId, userId);
        });
    }
    removeReaction(messageId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield messageReaction_model_1.MessageReactionModel.deleteOne({
                messageId: new mongoose_1.Types.ObjectId(messageId),
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            return this.getSummariesForMessage(messageId, userId);
        });
    }
    getSummariesForMessage(messageId, viewerUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield messageReaction_model_1.MessageReactionModel.find({ messageId: new mongoose_1.Types.ObjectId(messageId) })
                .select("emoji userId")
                .lean()
                .exec();
            return toSummaries(rows, viewerUserId);
        });
    }
    getSummariesForMessages(messageIds, viewerUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const result = new Map();
            if (!messageIds.length)
                return result;
            const oids = messageIds.map((id) => new mongoose_1.Types.ObjectId(id));
            const rows = yield messageReaction_model_1.MessageReactionModel.find({ messageId: { $in: oids } })
                .select("messageId emoji userId")
                .lean()
                .exec();
            const grouped = new Map();
            for (const row of rows) {
                const mid = row.messageId.toString();
                const list = (_a = grouped.get(mid)) !== null && _a !== void 0 ? _a : [];
                list.push({ emoji: row.emoji, userId: row.userId });
                grouped.set(mid, list);
            }
            for (const id of messageIds) {
                result.set(id, toSummaries((_b = grouped.get(id)) !== null && _b !== void 0 ? _b : [], viewerUserId));
            }
            return result;
        });
    }
}
exports.MessageReactionRepository = MessageReactionRepository;
