import { Request, Response, NextFunction } from "express";
import IFriendUsecase from "../interfaces/usecase/IFriends.usecase.interface";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import { Types } from "mongoose";

export default class FriendController {
  private friendUseCase: IFriendUsecase;

  constructor(friendUseCase: IFriendUsecase) {
    this.friendUseCase = friendUseCase;
  }

  /**
   * Search users by username.
   * Expected query parameter: ?username=someName
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.query;
      const users = await this.friendUseCase.searchUserByUsername(String(username));
      res.status(200).json({ users });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Send a friend request.
   * Expected body: { senderId: string, receiverId: string }
   */
  async sendFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.userId!
      const { receiverId } = req.body;
      await this.friendUseCase.sendFriendRequest(senderId, receiverId);
      res.status(200).json({ message: "Friend request sent" });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Accept a friend request.
   * Expected body: { userId: string, senderId: string }
   */
  async acceptFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId= req.userId!
      const { senderId } = req.body;
      await this.friendUseCase.acceptFriendRequest(userId, senderId);
      res.status(200).json({ message: "Friend request accepted" });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Reject a friend request.
   * Expected body: { userId: string, senderId: string }
   */
  async rejectFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { senderId } = req.body;
      await this.friendUseCase.rejectFriendRequest(userId, senderId);
      res.status(200).json({ message: "Friend request rejected" });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Remove a friend.
   * Expected body: { userId: string, friendId: string }
   */
  async removeFriend(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const friendId = new Types.ObjectId(req.params.friendId);  // Get friendId from params instead of body

      if (!friendId) {
        throw new Error("Friend ID is required");
      }

      await this.friendUseCase.removeFriend(userId, friendId);
      res.status(200).json({ message: "Friend removed" });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get pending friend requests for a user.
   * Expected parameter: userId (in request params)
   */
  async getPendingFriendRequests(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const pendingRequests = await this.friendUseCase.getPendingFriendRequests(userId);
      console.log(pendingRequests);
      res.status(200).json({ pendingRequests });
    } catch (error: any) {
      next(error);
    }
  }

  /**
 * Get all online friends of a user.
 * Expected request parameter: /friends/online/:userId
 */
async getOnlineFriends(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const onlineFriends = await this.friendUseCase.getOnlineFriends(userId);
    res.status(200).json({ onlineFriends });
  } catch (error: any) {
    next(error);
  }
}

  /**
   * Get all friends of a user.
   * Expected parameter: userId (in request params)
   */
  async getAllFriends(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const friends = await this.friendUseCase.getAllFriends(userId);
      res.status(200).json({ friends });
    } catch (error: any) {
      next(error);
    }
  }


  /**
   * Blocks a user.
   * Expected body: { blockedUserId: string }
   * The authenticated user's ID is assumed to be available in req.id.
   */
  async blockUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId! // Ensure your auth middleware sets req.id
      const { friendId } = req.body;
      console.log(friendId,userId);
      
      await this.friendUseCase.blockUser(userId, friendId);
      res.status(200).json({ message: "User blocked successfully." });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Unblocks a user.
   * Expected body: { blockedUserId: string }
   */
  async unblockUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { friendId } = req.body;
      await this.friendUseCase.unblockUser(userId, friendId);
      res.status(200).json({ message: "User unblocked successfully." });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieves all blocked users for the authenticated user.
   * Expected to have userId in req.id (set by authentication middleware).
   */
  async getAllBlockedUsers(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const blockedUsers = await this.friendUseCase.getAllBlockedUsers(userId);
      res.status(200).json({ blockedUsers });
    } catch (error: any) {
      next(error);
    }
  }

}
