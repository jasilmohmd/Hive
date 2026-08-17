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
exports.MessageRepository = void 0;
const mongoose_1 = require("mongoose");
const message_model_1 = require("../framework/models/message.model");
function chatIdFilter(chatId) {
    const canonical = mongoose_1.Types.ObjectId.isValid(chatId) && new mongoose_1.Types.ObjectId(chatId).toString() === chatId;
    if (canonical) {
        return { $or: [{ chatId }, { chatId: new mongoose_1.Types.ObjectId(chatId) }] };
    }
    return { chatId };
}
class MessageRepository {
    populateMessage(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const populated = yield message_model_1.MessageModel.findById(messageId)
                .populate("sender", "_id userName imageUrl")
                .populate({
                path: "replyToMessageId",
                select: "content type sender deletedAt",
                populate: { path: "sender", select: "_id userName imageUrl" },
            })
                .exec();
            if (!populated) {
                throw new Error("Message not found after save");
            }
            const obj = populated.toObject();
            if (obj.replyToMessageId && typeof obj.replyToMessageId === "object") {
                obj.replyTo = {
                    _id: obj.replyToMessageId._id,
                    content: obj.replyToMessageId.content,
                    type: obj.replyToMessageId.type,
                    sender: obj.replyToMessageId.sender,
                    deletedAt: obj.replyToMessageId.deletedAt,
                };
            }
            return obj;
        });
    }
    saveMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const newMessage = new message_model_1.MessageModel(message);
            const saved = yield newMessage.save();
            return this.populateMessage(String(saved._id));
        });
    }
    getMessagesByChatId(chatId_1) {
        return __awaiter(this, arguments, void 0, function* (chatId, page = 1, limit = 50) {
            const rows = yield message_model_1.MessageModel.find(Object.assign(Object.assign({}, chatIdFilter(chatId)), { deletedAt: { $exists: false } }))
                .populate("sender", "_id userName imageUrl")
                .populate({
                path: "replyToMessageId",
                select: "content type sender deletedAt",
                populate: { path: "sender", select: "_id userName imageUrl" },
            })
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec();
            return rows.map((row) => {
                if (row.replyToMessageId && typeof row.replyToMessageId === "object") {
                    row.replyTo = {
                        _id: row.replyToMessageId._id,
                        content: row.replyToMessageId.content,
                        type: row.replyToMessageId.type,
                        sender: row.replyToMessageId.sender,
                        deletedAt: row.replyToMessageId.deletedAt,
                    };
                }
                return row;
            });
        });
    }
    findById(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield message_model_1.MessageModel.findById(messageId)
                .populate("sender", "_id userName imageUrl")
                .lean()
                .exec();
            return doc;
        });
    }
    editMessage(messageId, newContent) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield message_model_1.MessageModel.findByIdAndUpdate(messageId, { content: newContent, edited: true }, { new: true });
            if (!updated)
                return null;
            return this.populateMessage(messageId);
        });
    }
    softDeleteMessage(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield message_model_1.MessageModel.findByIdAndUpdate(messageId, { deletedAt: new Date() }, { new: true });
            if (!updated)
                return null;
            return this.populateMessage(messageId);
        });
    }
}
exports.MessageRepository = MessageRepository;
