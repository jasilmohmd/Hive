"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatUseCase = createChatUseCase;
const chat_usecase_1 = require("../usecase/chat.usecase");
const chat_repository_1 = require("../repositories/chat.repository");
const message_repository_1 = require("../repositories/message.repository");
const messageReaction_repository_1 = require("../repositories/messageReaction.repository");
const pollVote_repository_1 = require("../repositories/pollVote.repository");
const channel_repository_1 = require("../repositories/channel.repository");
const community_repository_1 = require("../repositories/community.repository");
const friends_repository_1 = __importDefault(require("../repositories/friends.repository"));
const imageUpload_usecase_1 = __importDefault(require("../usecase/imageUpload.usecase"));
function createChatUseCase() {
    return new chat_usecase_1.ChatUseCase(new message_repository_1.MessageRepository(), new chat_repository_1.ChatRepository(), new channel_repository_1.ChannelRepository(), new community_repository_1.CommunityRepository(), new friends_repository_1.default(), new imageUpload_usecase_1.default(), new messageReaction_repository_1.MessageReactionRepository(), new pollVote_repository_1.PollVoteRepository());
}
