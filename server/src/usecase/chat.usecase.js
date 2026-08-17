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
exports.ChatUseCase = void 0;
const mongoose_1 = require("mongoose");
const chatMediaUrl_1 = require("../framework/utils/chatMediaUrl");
const chatMessageContent_1 = require("../framework/utils/chatMessageContent");
const callMessageContent_1 = require("../framework/utils/callMessageContent");
const linkPreview_1 = require("../framework/utils/linkPreview");
const user_model_1 = __importDefault(require("../framework/models/user.model"));
const DIRECT_CHAT_REGEX = /^([a-fA-F0-9]{24})_([a-fA-F0-9]{24})$/;
function channelSupportsTextChat(type) {
    return type === "chatroom" || type === "voiceroom";
}
function communityObjectId(channel) {
    const c = channel.communityId;
    if (c instanceof mongoose_1.Types.ObjectId)
        return c;
    if (c && typeof c === "object" && "_id" in c) {
        return new mongoose_1.Types.ObjectId(String(c._id));
    }
    return new mongoose_1.Types.ObjectId(String(c));
}
class ChatUseCase {
    constructor(messageRepository, chatRepository, channelRepository, communityRepository, friendRepository, imageUsecase, reactionRepository, pollVoteRepository) {
        this.messageRepository = messageRepository;
        this.chatRepository = chatRepository;
        this.channelRepository = channelRepository;
        this.communityRepository = communityRepository;
        this.friendRepository = friendRepository;
        this.imageUsecase = imageUsecase;
        this.reactionRepository = reactionRepository;
        this.pollVoteRepository = pollVoteRepository;
    }
    normalizeDirectChatId(userA, userB) {
        return [userA, userB].sort().join("_");
    }
    userHasChannelAccess(userId, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            const communityId = communityObjectId(channel);
            const userRoleIds = yield this.communityRepository.getUserRoles(communityId, userId);
            return channel.allowedRoles.some((ar) => userRoleIds.some((ur) => ur.equals(ar)));
        });
    }
    ensureGroupChatForChannel(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const idStr = channelId.toString();
            const existing = yield this.chatRepository.findChatById(idStr);
            if (existing)
                return;
            yield this.chatRepository.createChat({ chatId: idStr, type: "group" });
        });
    }
    assertCanAccessExistingChat(userId, chat) {
        return __awaiter(this, void 0, void 0, function* () {
            if (chat.type === "direct") {
                const [a, b] = chat.chatId.split("_");
                const uid = userId.toString();
                if (uid !== a && uid !== b) {
                    throw new Error("Unauthorized to access this chat");
                }
                return;
            }
            const channelId = new mongoose_1.Types.ObjectId(chat.chatId);
            const channel = yield this.channelRepository.getChannelById(channelId);
            if (!channel || !channelSupportsTextChat(channel.type)) {
                throw new Error("Invalid channel chat");
            }
            if (!(yield this.userHasChannelAccess(userId, channel))) {
                throw new Error("Unauthorized to access this channel chat");
            }
        });
    }
    getOrCreateChatForSend(senderId, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.chatRepository.findChatById(chatId);
            if (existing) {
                yield this.assertCanAccessExistingChat(senderId, existing);
                return existing;
            }
            const directMatch = chatId.match(DIRECT_CHAT_REGEX);
            if (directMatch) {
                const [, id1, id2] = directMatch;
                const normalized = this.normalizeDirectChatId(id1, id2);
                if (normalized !== chatId) {
                    throw new Error("Invalid direct chat id: ids must be sorted");
                }
                const uid = senderId.toString();
                if (uid !== id1 && uid !== id2) {
                    throw new Error("Unauthorized to send message to this chat");
                }
                const peer = uid === id1 ? id2 : id1;
                const status = yield this.friendRepository.checkFriendshipStatus(senderId, new mongoose_1.Types.ObjectId(peer));
                if (status !== "already_friends") {
                    throw new Error("You can only message users who are already friends");
                }
                let chat = yield this.chatRepository.findChatById(normalized);
                if (!chat) {
                    chat = yield this.chatRepository.createChat({ chatId: normalized, type: "direct" });
                }
                return chat;
            }
            if (!mongoose_1.Types.ObjectId.isValid(chatId)) {
                throw new Error("Chat does not exist");
            }
            const channelId = new mongoose_1.Types.ObjectId(chatId);
            const channel = yield this.channelRepository.getChannelById(channelId);
            if (!channel) {
                throw new Error("Chat does not exist");
            }
            if (!channelSupportsTextChat(channel.type)) {
                throw new Error("This channel does not support text chat");
            }
            if (!(yield this.userHasChannelAccess(senderId, channel))) {
                throw new Error("Unauthorized to send message to this channel");
            }
            yield this.ensureGroupChatForChannel(channelId);
            const created = yield this.chatRepository.findChatById(chatId);
            if (!created) {
                throw new Error("Failed to initialize channel chat");
            }
            return created;
        });
    }
    assertCanAccessMessage(userId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.deletedAt) {
                throw new Error("Message not found");
            }
            const chat = yield this.chatRepository.findChatById(message.chatId);
            if (!chat) {
                throw new Error("Chat not found");
            }
            yield this.assertCanAccessExistingChat(userId, chat);
        });
    }
    senderIdOf(message) {
        const s = message.sender;
        if (s instanceof mongoose_1.Types.ObjectId)
            return s.toString();
        if (s && typeof s === "object" && "_id" in s) {
            return String(s._id);
        }
        return String(s);
    }
    enrichMessages(messages, viewerUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = messages.map((m) => String(m._id)).filter(Boolean);
            const pollMsgs = messages
                .filter((m) => m.type === "poll")
                .map((m) => ({ _id: String(m._id), content: m.content }));
            const [reactionMap, pollMap] = yield Promise.all([
                this.reactionRepository.getSummariesForMessages(ids, viewerUserId),
                this.pollVoteRepository.getSummariesForPollMessages(pollMsgs, viewerUserId),
            ]);
            return messages.map((m) => {
                var _a;
                const id = String(m._id);
                const reactions = (_a = reactionMap.get(id)) !== null && _a !== void 0 ? _a : [];
                const poll = m.type === "poll" ? pollMap.get(id) : undefined;
                return Object.assign(Object.assign({}, m), { reactions, poll });
            });
        });
    }
    sendMessage(senderId_1, chatId_1, content_1, type_1) {
        return __awaiter(this, arguments, void 0, function* (senderId, chatId, content, type, options = {}) {
            var _a, _b;
            const senderOid = new mongoose_1.Types.ObjectId(senderId);
            yield this.getOrCreateChatForSend(senderOid, chatId);
            if (!chatMessageContent_1.ALLOWED_MESSAGE_TYPES.has(type)) {
                throw new Error("Invalid message type");
            }
            let resolvedContent = content;
            const resolvedType = type;
            let metadata = (0, chatMessageContent_1.parseMetadata)(options.metadata);
            if (type === "gif" || type === "sticker") {
                resolvedContent = (0, chatMediaUrl_1.assertValidChatMediaUrl)(content, type);
            }
            else if (type === "location") {
                const location = (0, chatMessageContent_1.parseLocationContent)(content);
                resolvedContent = (0, chatMessageContent_1.stringifyLocationContent)(location);
            }
            else if (type === "contact") {
                const contact = (0, chatMessageContent_1.parseContactContent)(content);
                const user = yield user_model_1.default.findById(contact.userId).select("_id userName imageUrl").lean();
                if (!user) {
                    throw new Error("Contact user not found");
                }
                resolvedContent = (0, chatMessageContent_1.buildContactContent)({
                    userId: contact.userId,
                    userName: contact.userName || String((_a = user.userName) !== null && _a !== void 0 ? _a : ""),
                    imageUrl: (_b = contact.imageUrl) !== null && _b !== void 0 ? _b : user.imageUrl,
                });
            }
            else if (type === "poll") {
                const poll = (0, chatMessageContent_1.parsePollContent)(content);
                resolvedContent = (0, chatMessageContent_1.buildPollContent)(poll);
            }
            else if (type === "call") {
                (0, callMessageContent_1.parseCallMessageContent)(content);
            }
            else if (type === "text") {
                const url = (0, linkPreview_1.extractFirstHttpUrl)(content);
                if (url) {
                    const preview = yield (0, linkPreview_1.fetchLinkPreview)(url);
                    if (preview) {
                        metadata = Object.assign(Object.assign({}, metadata), { linkPreview: preview });
                    }
                }
            }
            let replyToMessageId;
            if (options.replyToMessageId) {
                const reply = yield this.messageRepository.findById(options.replyToMessageId);
                if (!reply || reply.deletedAt || reply.chatId !== chatId) {
                    throw new Error("Reply message not found in this chat");
                }
                replyToMessageId = new mongoose_1.Types.ObjectId(options.replyToMessageId);
            }
            const message = {
                sender: senderOid,
                chatId,
                content: resolvedContent,
                type: resolvedType,
                timestamp: new Date(),
                replyToMessageId,
                metadata: Object.keys(metadata).length ? (0, chatMessageContent_1.stringifyMetadata)(metadata) : undefined,
            };
            const saved = yield this.messageRepository.saveMessage(message);
            const [enriched] = yield this.enrichMessages([saved], senderId);
            return enriched;
        });
    }
    sendImageMessage(senderId, chatId, fileBuffer, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageUrl = yield this.imageUsecase.upload(fileBuffer, fileName, true, "image");
            return this.sendMessage(senderId, chatId, imageUrl, "image");
        });
    }
    sendVideoMessage(senderId, chatId, fileBuffer, fileName, mime) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, chatMessageContent_1.assertAllowedMime)(mime, "video");
            const videoUrl = yield this.imageUsecase.upload(fileBuffer, fileName, true, "video");
            return this.sendMessage(senderId, chatId, videoUrl, "video");
        });
    }
    sendAudioMessage(senderId, chatId, fileBuffer, fileName, mime) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, chatMessageContent_1.assertAllowedMime)(mime, "audio");
            const audioUrl = yield this.imageUsecase.upload(fileBuffer, fileName, true, "video");
            return this.sendMessage(senderId, chatId, audioUrl, "audio");
        });
    }
    sendFileMessage(senderId, chatId, fileBuffer, fileName, mime, size) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, chatMessageContent_1.assertAllowedMime)(mime, "document");
            const fileUrl = yield this.imageUsecase.upload(fileBuffer, fileName, true, "raw");
            const content = (0, chatMessageContent_1.buildFileContent)({ url: fileUrl, name: fileName, mime, size });
            return this.sendMessage(senderId, chatId, content, "file");
        });
    }
    getMessageHistory(chatId_1) {
        return __awaiter(this, arguments, void 0, function* (chatId, page = 1, limit = 50, userId) {
            const userOid = new mongoose_1.Types.ObjectId(userId);
            let chat = yield this.chatRepository.findChatById(chatId);
            if (!chat) {
                const directMatch = chatId.match(DIRECT_CHAT_REGEX);
                if (directMatch) {
                    const [, id1, id2] = directMatch;
                    const normalized = this.normalizeDirectChatId(id1, id2);
                    if (normalized !== chatId) {
                        throw new Error("Invalid direct chat id: ids must be sorted");
                    }
                    const uid = userOid.toString();
                    if (uid !== id1 && uid !== id2) {
                        throw new Error("Unauthorized to read this chat");
                    }
                    const peer = uid === id1 ? id2 : id1;
                    const status = yield this.friendRepository.checkFriendshipStatus(userOid, new mongoose_1.Types.ObjectId(peer));
                    if (status !== "already_friends") {
                        throw new Error("You can only read chats with friends");
                    }
                    chat = yield this.chatRepository.findChatById(normalized);
                    if (!chat) {
                        return [];
                    }
                }
                else if (mongoose_1.Types.ObjectId.isValid(chatId)) {
                    const channelId = new mongoose_1.Types.ObjectId(chatId);
                    const channel = yield this.channelRepository.getChannelById(channelId);
                    if (!channel || !channelSupportsTextChat(channel.type)) {
                        throw new Error("Chat does not exist");
                    }
                    if (!(yield this.userHasChannelAccess(userOid, channel))) {
                        throw new Error("Unauthorized to read this channel chat");
                    }
                    yield this.ensureGroupChatForChannel(channelId);
                }
                else {
                    throw new Error("Chat does not exist");
                }
            }
            else {
                yield this.assertCanAccessExistingChat(userOid, chat);
            }
            const messages = yield this.messageRepository.getMessagesByChatId(chatId, page, limit);
            const enriched = yield this.enrichMessages(messages, userId);
            return enriched.slice().reverse();
        });
    }
    editMessage(userId, messageId, newContent) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.messageRepository.findById(messageId);
            if (!message || message.deletedAt) {
                throw new Error("Message not found");
            }
            if (this.senderIdOf(message) !== userId) {
                throw new Error("You can only edit your own messages");
            }
            if (!chatMessageContent_1.EDITABLE_MESSAGE_TYPES.has(message.type)) {
                throw new Error("This message type cannot be edited");
            }
            yield this.assertCanAccessMessage(new mongoose_1.Types.ObjectId(userId), message);
            let resolved = newContent.trim();
            if (message.type === "poll") {
                const existing = (0, chatMessageContent_1.parsePollContent)(message.content);
                const parsed = (0, chatMessageContent_1.parsePollContent)(JSON.stringify({
                    question: resolved,
                    options: existing.options,
                    allowMultiple: existing.allowMultiple,
                }));
                resolved = (0, chatMessageContent_1.buildPollContent)(parsed);
            }
            else if (!resolved) {
                throw new Error("Message cannot be empty");
            }
            const updated = yield this.messageRepository.editMessage(messageId, resolved);
            if (!updated) {
                throw new Error("Failed to edit message");
            }
            const [enriched] = yield this.enrichMessages([updated], userId);
            return enriched;
        });
    }
    deleteMessage(userId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.messageRepository.findById(messageId);
            if (!message || message.deletedAt) {
                throw new Error("Message not found");
            }
            if (this.senderIdOf(message) !== userId) {
                throw new Error("You can only delete your own messages");
            }
            yield this.assertCanAccessMessage(new mongoose_1.Types.ObjectId(userId), message);
            const deleted = yield this.messageRepository.softDeleteMessage(messageId);
            if (!deleted) {
                throw new Error("Failed to delete message");
            }
            return deleted;
        });
    }
    setReaction(userId, messageId, emoji) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.messageRepository.findById(messageId);
            if (!message || message.deletedAt) {
                throw new Error("Message not found");
            }
            yield this.assertCanAccessMessage(new mongoose_1.Types.ObjectId(userId), message);
            const validEmoji = (0, chatMessageContent_1.assertValidReactionEmoji)(emoji);
            const reactions = yield this.reactionRepository.setReaction(messageId, userId, validEmoji);
            return { chatId: message.chatId, messageId, reactions };
        });
    }
    removeReaction(userId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.messageRepository.findById(messageId);
            if (!message || message.deletedAt) {
                throw new Error("Message not found");
            }
            yield this.assertCanAccessMessage(new mongoose_1.Types.ObjectId(userId), message);
            const reactions = yield this.reactionRepository.removeReaction(messageId, userId);
            return { chatId: message.chatId, messageId, reactions };
        });
    }
    votePoll(userId, messageId, optionIndexes) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.messageRepository.findById(messageId);
            if (!message || message.deletedAt) {
                throw new Error("Message not found");
            }
            if (message.type !== "poll") {
                throw new Error("Not a poll message");
            }
            yield this.assertCanAccessMessage(new mongoose_1.Types.ObjectId(userId), message);
            const pollContent = (0, chatMessageContent_1.parsePollContent)(message.content);
            const { counts, myVotes, totalVotes } = yield this.pollVoteRepository.vote(messageId, userId, optionIndexes, pollContent.options.length, pollContent.allowMultiple === true);
            const poll = {
                question: pollContent.question,
                options: pollContent.options,
                allowMultiple: pollContent.allowMultiple === true,
                counts,
                myVotes,
                totalVotes,
            };
            return { chatId: message.chatId, messageId, poll };
        });
    }
    getLinkPreview(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, linkPreview_1.fetchLinkPreview)(url);
        });
    }
}
exports.ChatUseCase = ChatUseCase;
