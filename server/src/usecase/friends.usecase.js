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
const mongoose_1 = require("mongoose");
const errorCode_1 = require("../constants/auth/errorCode");
const errorField_1 = require("../constants/auth/errorField");
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const errorMessage_1 = __importDefault(require("../constants/auth/errorMessage"));
class FriendUseCase {
    constructor(friendRepository) {
        this.friendRepository = friendRepository;
    }
    searchUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!username || username.trim() === "") {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "Username cannot be empty",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            return yield this.friendRepository.searchUserByUsername(username);
        });
    }
    sendFriendRequest(senderId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(senderId) || !(0, mongoose_1.isObjectIdOrHexString)(receiverId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            // Check if sender and receiver are the same
            if (senderId === receiverId) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.CANNOT_FRIEND_SELF,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT // Use an appropriate error code
                });
            }
            // Check if they are already friends or request is pending
            const status = yield this.friendRepository.checkFriendshipStatus(senderId, receiverId);
            console.log(status);
            if (status === "already_friends") {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.Conflict,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.ALREADY_FRIENDS,
                    errorCode: errorCode_1.ErrorCode.ALREADY_FRIENDS // Now using a number (1003)
                });
            }
            if (status === "request_pending") {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.Conflict,
                    errorField: errorField_1.ErrorField.FRIEND_REQUEST,
                    message: errorMessage_1.default.FRIEND_REQUEST_PENDING,
                    errorCode: errorCode_1.ErrorCode.FRIEND_REQUEST_ALREADY_SENT // 1003
                });
            }
            yield this.friendRepository.addFriendRequest(senderId, receiverId);
        });
    }
    acceptFriendRequest(userId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !(0, mongoose_1.isObjectIdOrHexString)(senderId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            yield this.friendRepository.acceptFriendRequest(userId, senderId);
        });
    }
    rejectFriendRequest(userId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !(0, mongoose_1.isObjectIdOrHexString)(senderId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            yield this.friendRepository.rejectFriendRequest(userId, senderId);
        });
    }
    removeFriend(userId, friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !(0, mongoose_1.isObjectIdOrHexString)(friendId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            yield this.friendRepository.removeFriend(userId, friendId);
        });
    }
    /**
     * Retrieves pending friend requests for a given user.
     * The repository is expected to populate sender details if needed.
     */
    getPendingFriendRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            return yield this.friendRepository.getPendingFriendRequests(userId);
        });
    }
    getOnlineFriends(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            return yield this.friendRepository.getOnlineFriends(userId);
        });
    }
    /**
     * Retrieves all friends for a given user.
     */
    getAllFriends(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.INVALID_USER_ID,
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            return yield this.friendRepository.getAllFriends(userId);
        });
    }
    /**
     * Blocks a user by adding the blocked user's ID to the user's blocked array.
     */
    blockUser(userId, blockedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate IDs
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !(0, mongoose_1.isObjectIdOrHexString)(blockedUserId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "Invalid user ID.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            // Prevent a user from blocking themselves
            if (userId === blockedUserId) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "You cannot block yourself.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            // Call repository to block the user. The repository method already checks if the user is already blocked.
            yield this.friendRepository.blockUser(userId, blockedUserId);
        });
    }
    /**
     * Unblocks a user by removing the blocked user's ID from the user's blocked array.
     */
    unblockUser(userId, blockedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate IDs
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !(0, mongoose_1.isObjectIdOrHexString)(blockedUserId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "Invalid user ID.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            yield this.friendRepository.unblockUser(userId, blockedUserId);
        });
    }
    /**
     * Retrieves all blocked users for the given user.
     */
    getAllBlockedUsers(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "Invalid user ID.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                });
            }
            return yield this.friendRepository.getAllBlockedUsers(userId);
        });
    }
}
exports.default = FriendUseCase;
