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
exports.ChannelUseCase = void 0;
const mongoose_1 = require("mongoose");
const customError_error_1 = require("../errors/customError.error");
const channel_validator_1 = require("../framework/utils/validators/channel.validator");
class ChannelUseCase {
    constructor(channelRepository, roleRepository, rbacService, chatRepository) {
        this.channelRepository = channelRepository;
        this.roleRepository = roleRepository;
        this.rbacService = rbacService;
        this.chatRepository = chatRepository;
    }
    /**
     * Create a new channel.
     * Optionally, you could require RBAC checks here as well.
     */
    createChannel(data, userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                // Check if the user has permission to create a channel.
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "channel");
                const createdBy = userId.toString();
                // ✅ Validate input data using Zod
                const validatedData = channel_validator_1.channelValidator.parse(Object.assign({ createdBy }, data));
                const createdChannel = yield this.channelRepository.createChannel(Object.assign({ communityId }, validatedData));
                if (!createdChannel) {
                    throw new customError_error_1.CustomError({ statusCode: 500, message: "Failed to create channel", errorField: "channel" });
                }
                if ((createdChannel.type === "chatroom" || createdChannel.type === "voiceroom") &&
                    createdChannel._id) {
                    const cid = createdChannel._id.toString();
                    const existingChat = yield this.chatRepository.findChatById(cid);
                    if (!existingChat) {
                        yield this.chatRepository.createChat({ chatId: cid, type: "group" });
                    }
                }
                return createdChannel;
            }
            catch (error) {
                throw new Error(`Error creating channel: ${error.message}`);
            }
        });
    }
    /**
     * Get a channel by its ID.
     */
    getChannelById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    throw new customError_error_1.ValidationError("Invalid channel ID", "channel");
                }
                const channel = yield this.channelRepository.getChannelById(id);
                if (!channel) {
                    throw new customError_error_1.NotFoundError("Channel not found", "channel");
                }
                return channel;
            }
            catch (error) {
                throw new Error(`Error fetching channel: ${error.message}`);
            }
        });
    }
    /**
     * Get accessible channels for a given community based on the user's role IDs.
     */
    getAccessibleChannels(communityId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const userRoles = yield this.roleRepository.getUserRoles(userId, communityId);
                if (!userRoles || userRoles.length === 0) {
                    throw new customError_error_1.NotFoundError("User has no roles in this community", "role");
                }
                const userRoleIds = userRoles
                    .map(role => role._id)
                    .filter((id) => Boolean(id));
                const groupedChannels = yield this.channelRepository.getAccessibleChannels(communityId, userRoleIds);
                return groupedChannels;
            }
            catch (error) {
                throw new Error(`Error fetching accessible channels: ${error.message}`);
            }
        });
    }
    /**
     * Search accessible channels by name (case-insensitive) for a specific community and user.
     */
    searchAccessibleChannels(communityId, userId, searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const userRoles = yield this.roleRepository.getUserRoles(userId, communityId);
                if (!userRoles || userRoles.length === 0) {
                    throw new customError_error_1.NotFoundError("User has no roles in this community", "role");
                }
                const userRoleIds = userRoles
                    .map(role => role._id)
                    .filter((id) => Boolean(id));
                const channels = yield this.channelRepository.searchAccessibleChannels(communityId, userRoleIds, searchTerm);
                if (!channels || channels.length === 0) {
                    throw new customError_error_1.NotFoundError("No channels found", "channel");
                }
                return channels;
            }
            catch (error) {
                throw new Error(`Error searching channels: ${error.message}`);
            }
        });
    }
    /**
     * Update a channel.
     * Only allowed for users with the "MANAGE_CHANNELS" permission.
     */
    updateChannel(userId, communityId, channelId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                if (!mongoose_1.Types.ObjectId.isValid(channelId)) {
                    throw new customError_error_1.ValidationError("Invalid channel ID", "channel");
                }
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "channel");
                const channel = yield this.channelRepository.getChannelById(channelId);
                if (!channel) {
                    throw new customError_error_1.NotFoundError("Channel not found", "channel");
                }
                const createdBy = channel.createdBy.toString();
                // ✅ Validate input data using Zod
                const validatedData = channel_validator_1.channelValidator.parse(Object.assign({ createdBy }, data));
                const updatedChannel = yield this.channelRepository.updateChannel(channelId, validatedData);
                if (!updatedChannel) {
                    throw new customError_error_1.NotFoundError("Channel not found or update failed", "channel");
                }
                return updatedChannel;
            }
            catch (error) {
                throw new Error(`Error updating channel: ${error.message}`);
            }
        });
    }
    /**
     * Delete a channel.
     * Only allowed for users with the "MANAGE_CHANNELS" permission.
     */
    deleteChannel(userId, communityId, channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                if (!mongoose_1.Types.ObjectId.isValid(channelId)) {
                    throw new customError_error_1.ValidationError("Invalid channel ID", "channel");
                }
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "channel");
                const result = yield this.channelRepository.deleteChannel(channelId);
                if (!result) {
                    throw new customError_error_1.NotFoundError("Channel not found or deletion failed", "channel");
                }
                return result;
            }
            catch (error) {
                throw new Error(`Error deleting channel: ${error.message}`);
            }
        });
    }
}
exports.ChannelUseCase = ChannelUseCase;
