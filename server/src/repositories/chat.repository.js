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
exports.ChatRepository = void 0;
const chat_model_1 = require("../framework/models/chat.model");
class ChatRepository {
    createChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            const newChat = new chat_model_1.ChatModel(chat);
            return yield newChat.save();
        });
    }
    findChatById(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            return chat_model_1.ChatModel.findOne({ chatId });
        });
    }
    doesDirectChatExist(user1, user2) {
        return __awaiter(this, void 0, void 0, function* () {
            const sortedIds = [user1, user2].sort().join('_');
            const chat = yield chat_model_1.ChatModel.findOne({ chatId: sortedIds });
            return !!chat;
        });
    }
}
exports.ChatRepository = ChatRepository;
