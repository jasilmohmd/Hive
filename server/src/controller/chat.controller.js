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
exports.ChatController = void 0;
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const chatMessageContent_1 = require("../framework/utils/chatMessageContent");
const linkPreview_1 = require("../framework/utils/linkPreview");
class ChatController {
    constructor(chatUseCase) {
        this.chatUseCase = chatUseCase;
    }
    getUploadedFile(req) {
        return req.file;
    }
    io(req) {
        return req.app.get("io");
    }
    broadcastNewMessage(req, chatId, message) {
        var _a;
        (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(chatId).emit("newMessage", message);
    }
    getMessageHistory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { chatId } = req.params;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 50;
                const messages = yield this.chatUseCase.getMessageHistory(chatId, page, limit, req.userId.toString());
                res.status(statusCodes_1.default.Success).json(messages);
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendImageMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this.getUploadedFile(req);
                const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                if (!chatId || !file) {
                    res.status(statusCodes_1.default.BadRequest).json({ message: "chatId and file are required" });
                    return;
                }
                if (!file.mimetype.startsWith("image/")) {
                    res.status(statusCodes_1.default.BadRequest).json({ message: "Only image files are allowed" });
                    return;
                }
                const message = yield this.chatUseCase.sendImageMessage(req.userId.toString(), chatId, file.buffer, file.originalname);
                this.broadcastNewMessage(req, chatId, message);
                res.status(statusCodes_1.default.Success).json(message);
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendVideoMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this.getUploadedFile(req);
                const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                if (!chatId || !file) {
                    res.status(statusCodes_1.default.BadRequest).json({ message: "chatId and file are required" });
                    return;
                }
                (0, chatMessageContent_1.assertAllowedMime)(file.mimetype, "video");
                const message = yield this.chatUseCase.sendVideoMessage(req.userId.toString(), chatId, file.buffer, file.originalname, file.mimetype);
                this.broadcastNewMessage(req, chatId, message);
                res.status(statusCodes_1.default.Success).json(message);
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendAudioMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this.getUploadedFile(req);
                const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                if (!chatId || !file) {
                    res.status(statusCodes_1.default.BadRequest).json({ message: "chatId and file are required" });
                    return;
                }
                (0, chatMessageContent_1.assertAllowedMime)(file.mimetype, "audio");
                const message = yield this.chatUseCase.sendAudioMessage(req.userId.toString(), chatId, file.buffer, file.originalname, file.mimetype);
                this.broadcastNewMessage(req, chatId, message);
                res.status(statusCodes_1.default.Success).json(message);
            }
            catch (error) {
                next(error);
            }
        });
    }
    sendFileMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this.getUploadedFile(req);
                const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                if (!chatId || !file) {
                    res.status(statusCodes_1.default.BadRequest).json({ message: "chatId and file are required" });
                    return;
                }
                (0, chatMessageContent_1.assertAllowedMime)(file.mimetype, "document");
                const message = yield this.chatUseCase.sendFileMessage(req.userId.toString(), chatId, file.buffer, file.originalname, file.mimetype, file.size);
                this.broadcastNewMessage(req, chatId, message);
                res.status(statusCodes_1.default.Success).json(message);
            }
            catch (error) {
                next(error);
            }
        });
    }
    patchMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const { messageId } = req.params;
                const content = typeof req.body.content === "string" ? req.body.content : "";
                const message = yield this.chatUseCase.editMessage(req.userId.toString(), messageId, content);
                (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(message.chatId).emit("messageEdited", message);
                res.status(statusCodes_1.default.Success).json(message);
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteMessage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const { messageId } = req.params;
                const message = yield this.chatUseCase.deleteMessage(req.userId.toString(), messageId);
                (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(message.chatId).emit("messageDeleted", { _id: messageId, chatId: message.chatId });
                res.status(statusCodes_1.default.Success).json({ _id: messageId });
            }
            catch (error) {
                next(error);
            }
        });
    }
    setReaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const { messageId } = req.params;
                const emoji = typeof req.body.emoji === "string" ? req.body.emoji : "";
                const result = yield this.chatUseCase.setReaction(req.userId.toString(), messageId, emoji);
                (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(result.chatId).emit("reactionUpdated", result);
                res.status(statusCodes_1.default.Success).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    removeReaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const { messageId } = req.params;
                const result = yield this.chatUseCase.removeReaction(req.userId.toString(), messageId);
                (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(result.chatId).emit("reactionUpdated", result);
                res.status(statusCodes_1.default.Success).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    votePoll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const { messageId } = req.params;
                const optionIndexes = Array.isArray(req.body.optionIndexes)
                    ? req.body.optionIndexes.filter((n) => typeof n === "number")
                    : [];
                const result = yield this.chatUseCase.votePoll(req.userId.toString(), messageId, optionIndexes);
                (_a = this.io(req)) === null || _a === void 0 ? void 0 : _a.to(result.chatId).emit("pollUpdated", result);
                res.status(statusCodes_1.default.Success).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getLinkPreview(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = typeof req.query.url === "string" ? req.query.url : "";
                (0, linkPreview_1.assertSafePreviewUrl)(url);
                const preview = yield this.chatUseCase.getLinkPreview(url);
                if (!preview) {
                    res.status(statusCodes_1.default.NotFound).json({ message: "Preview not available" });
                    return;
                }
                res.status(statusCodes_1.default.Success).json(preview);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getGifs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.proxyGiphyStickerOrGif(req, res, "gifs");
            }
            catch (error) {
                next(error);
            }
        });
    }
    getStickers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.proxyGiphyStickerOrGif(req, res, "stickers");
            }
            catch (error) {
                next(error);
            }
        });
    }
    proxyGiphyStickerOrGif(req, res, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const apiKey = (_a = process.env.GIPHY_API_KEY) === null || _a === void 0 ? void 0 : _a.trim();
            if (!apiKey) {
                res.status(503).json({
                    message: "Giphy is not configured. Set GIPHY_API_KEY in the server .env file (see https://developers.giphy.com/).",
                });
                return;
            }
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
            let limit = parseInt(String((_b = req.query.limit) !== null && _b !== void 0 ? _b : "24"), 10);
            if (Number.isNaN(limit))
                limit = 24;
            limit = Math.min(50, Math.max(1, limit));
            const base = kind === "gifs" ? "https://api.giphy.com/v1/gifs" : "https://api.giphy.com/v1/stickers";
            const giphyUrl = new URL(q.length > 0 ? `${base}/search` : `${base}/trending`);
            giphyUrl.searchParams.set("api_key", apiKey);
            giphyUrl.searchParams.set("limit", String(limit));
            if (q.length > 0) {
                giphyUrl.searchParams.set("q", q);
            }
            const upstream = yield fetch(giphyUrl);
            if (!upstream.ok) {
                yield upstream.json().catch(() => null);
                res.status(502).json({ message: "Giphy request failed" });
                return;
            }
            const body = yield upstream.json().catch(() => ({}));
            res.status(statusCodes_1.default.Success).json(body);
        });
    }
}
exports.ChatController = ChatController;
