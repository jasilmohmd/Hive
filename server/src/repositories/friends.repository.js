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
const errorCode_1 = require("../constants/auth/errorCode");
const errorField_1 = require("../constants/auth/errorField");
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const user_model_1 = __importDefault(require("../framework/models/user.model"));
class FriendRepository {
    searchUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield user_model_1.default.find({
                userName: { $regex: username, $options: "i" } // 'i' for case-insensitive search
            });
        });
    }
    checkFriendshipStatus(senderId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            const receiver = yield user_model_1.default.findOne({ _id: receiverId }, { friends: 1, friendRequests: 1 });
            if (!receiver) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: "Receiver not found.",
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND
                });
            }
            if (receiver.friends.includes(senderId.toString())) {
                return "already_friends";
            }
            const requestExists = receiver.friendRequests.some(req => req.sender.toString() === senderId.toString());
            if (requestExists) {
                return "request_pending";
            }
            return "not_friends";
        });
    }
    /**
   * Adds a friend request only if the sender is not already a friend or hasn't sent a request.
   */
    addFriendRequest(senderId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch receiver's document to check existing friends & requests
            const receiver = yield user_model_1.default.findOne({ _id: receiverId }, { friends: 1, friendRequests: 1 });
            if (!receiver) {
                return "Receiver not found.";
            }
            // Check if already friends
            if (receiver.friends.includes(senderId.toString())) {
                return "You are already friends.";
            }
            // Check if a friend request has already been sent
            const requestExists = receiver.friendRequests.some((req) => req.sender.toString() === senderId.toString());
            if (requestExists) {
                return "Friend request already sent.";
            }
            // If all checks pass, add the friend request
            yield user_model_1.default.updateOne({ _id: receiverId }, { $push: { friendRequests: { sender: senderId, status: "pending" } } });
            return "Friend request sent successfully.";
        });
    }
    /**
   * Accepts a friend request by updating the friendRequests status,
   * adding each user to the other's friends list, and removing the request.
   */
    acceptFriendRequest(userId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Accept the friend request: update status and add sender to user's friends list
            yield user_model_1.default.updateOne({ _id: userId, "friendRequests.sender": senderId }, {
                $push: { friends: senderId },
                $pull: { friendRequests: { sender: senderId } } // Remove the request after acceptance
            });
            // Add the user to the sender's friends list
            yield user_model_1.default.updateOne({ _id: senderId }, { $push: { friends: userId } });
        });
    }
    /**
     * Rejects a friend request by removing it from the friendRequests array.
     */
    rejectFriendRequest(userId, senderId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_model_1.default.updateOne({ _id: userId }, { $pull: { friendRequests: { sender: senderId } } });
        });
    }
    /**
     * Removes a friend from both users' friends list.
     */
    removeFriend(userId, friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_model_1.default.updateOne({ _id: userId }, { $pull: { friends: friendId } });
            yield user_model_1.default.updateOne({ _id: friendId }, { $pull: { friends: userId } });
        });
    }
    /**
    * Retrieves the pending friend requests for the given user.
    * The result includes populated sender details.
    */
    getPendingFriendRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the user and populate the sender details from friendRequests.
            const user = yield user_model_1.default.findById(userId)
                .populate('friendRequests.sender', 'userName email status'); // adjust fields as needed
            if (!user) {
                throw new Error("User not found");
            }
            // Filter requests with status "pending"
            return user.friendRequests.filter((req) => req.status === "pending");
        });
    }
    /**
    * Retrieves only online friends of a user.
    * @param userId - The ID of the user whose online friends we want to fetch.
    */
    getOnlineFriends(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the user's friends (assuming `friends` is an array of user IDs)
            const user = yield user_model_1.default.findById(userId).select("friends");
            if (!user)
                throw new Error("User not found");
            // Retrieve only the friends who are online
            return yield user_model_1.default.find({ _id: { $in: user.friends }, status: "online" });
        });
    }
    /**
     * Retrieves all friends for the given user.
     */
    getAllFriends(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the user and get the friends array.
            const user = yield user_model_1.default.findById(userId).select('friends');
            if (!user) {
                throw new Error("User not found");
            }
            // Return all users whose _id is in the friends array.
            return yield user_model_1.default.find({ _id: { $in: user.friends } });
        });
    }
    /**
    * Blocks a user by adding the blocked user's ID to the user's blocked array.
    * This method first checks if the user is already blocked.
    */
    blockUser(userId, blockedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch the user document
            const user = yield user_model_1.default.findById(userId).select("blocked");
            if (user && user.blocked.includes(blockedUserId.toString())) {
                // Optional: throw an error if already blocked, or simply return
                return;
            }
            yield user_model_1.default.updateOne({ _id: userId }, { $push: { blocked: blockedUserId } });
        });
    }
    /**
     * Unblocks a user by removing the blocked user's ID from the user's blocked array.
     */
    unblockUser(userId, blockedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_model_1.default.updateOne({ _id: userId }, { $pull: { blocked: blockedUserId } });
        });
    }
    /**
   * Retrieves all blocked users for the given user.
   * It finds the user by userId, selects the 'blocked' field, and fetches the full user details.
   */
    getAllBlockedUsers(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the user and retrieve only the blocked user IDs
            const user = yield user_model_1.default.findById(userId).select("blocked");
            if (!user) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: "User not found.",
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND
                });
            }
            // Retrieve the full details of blocked users
            return yield user_model_1.default.find({ _id: { $in: user.blocked } });
        });
    }
}
exports.default = FriendRepository;
