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
const mongoose_1 = require("mongoose");
class FriendController {
    constructor(friendUseCase) {
        this.friendUseCase = friendUseCase;
    }
    /**
     * Search users by username.
     * Expected query parameter: ?username=someName
     */
    searchUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.query;
                const users = yield this.friendUseCase.searchUserByUsername(String(username));
                res.status(200).json({ users });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Send a friend request.
     * Expected body: { senderId: string, receiverId: string }
     */
    sendFriendRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const senderId = req.userId;
                const { receiverId } = req.body;
                yield this.friendUseCase.sendFriendRequest(senderId, receiverId);
                res.status(200).json({ message: "Friend request sent" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Accept a friend request.
     * Expected body: { userId: string, senderId: string }
     */
    acceptFriendRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { senderId } = req.body;
                yield this.friendUseCase.acceptFriendRequest(userId, senderId);
                res.status(200).json({ message: "Friend request accepted" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Reject a friend request.
     * Expected body: { userId: string, senderId: string }
     */
    rejectFriendRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { senderId } = req.body;
                yield this.friendUseCase.rejectFriendRequest(userId, senderId);
                res.status(200).json({ message: "Friend request rejected" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Remove a friend.
     * Expected body: { userId: string, friendId: string }
     */
    removeFriend(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const friendId = new mongoose_1.Types.ObjectId(req.params.friendId); // Get friendId from params instead of body
                if (!friendId) {
                    throw new Error("Friend ID is required");
                }
                yield this.friendUseCase.removeFriend(userId, friendId);
                res.status(200).json({ message: "Friend removed" });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get pending friend requests for a user.
     * Expected parameter: userId (in request params)
     */
    getPendingFriendRequests(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const pendingRequests = yield this.friendUseCase.getPendingFriendRequests(userId);
                console.log(pendingRequests);
                res.status(200).json({ pendingRequests });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
   * Get all online friends of a user.
   * Expected request parameter: /friends/online/:userId
   */
    getOnlineFriends(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const onlineFriends = yield this.friendUseCase.getOnlineFriends(userId);
                res.status(200).json({ onlineFriends });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all friends of a user.
     * Expected parameter: userId (in request params)
     */
    getAllFriends(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const friends = yield this.friendUseCase.getAllFriends(userId);
                res.status(200).json({ friends });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Blocks a user.
     * Expected body: { blockedUserId: string }
     * The authenticated user's ID is assumed to be available in req.id.
     */
    blockUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId; // Ensure your auth middleware sets req.id
                const { friendId } = req.body;
                console.log(friendId, userId);
                yield this.friendUseCase.blockUser(userId, friendId);
                res.status(200).json({ message: "User blocked successfully." });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Unblocks a user.
     * Expected body: { blockedUserId: string }
     */
    unblockUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { friendId } = req.body;
                yield this.friendUseCase.unblockUser(userId, friendId);
                res.status(200).json({ message: "User unblocked successfully." });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves all blocked users for the authenticated user.
     * Expected to have userId in req.id (set by authentication middleware).
     */
    getAllBlockedUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const blockedUsers = yield this.friendUseCase.getAllBlockedUsers(userId);
                res.status(200).json({ blockedUsers });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = FriendController;
