import { isObjectIdOrHexString, Types } from "mongoose";
import { ErrorCode } from "../constants/auth/errorCode";
import { ErrorField } from "../constants/auth/errorField";
import StatusCodes from "../constants/auth/statusCodes";
import ValidationError from "../errors/validationError.error";
import IFriendRepository from "../interfaces/repository/IFriends.repository.interface";
import ErrorMessage from "../constants/auth/errorMessage";
import IFriendUsecase from "../interfaces/usecase/IFriends.usecase.interface";
import IUser from "../entity/User.entity";

export default class FriendUseCase implements IFriendUsecase {
  private friendRepository: IFriendRepository;

  constructor(friendRepository: IFriendRepository) {
    this.friendRepository = friendRepository;
  }

  async searchUserByUsername(username: string): Promise<IUser[]> {
    if (!username || username.trim() === "") {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "Username cannot be empty",
        errorCode: ErrorCode.INVALID_INPUT
      });
    }
    return await this.friendRepository.searchUserByUsername(username);
  }

  async sendFriendRequest(senderId: Types.ObjectId, receiverId: Types.ObjectId): Promise<void> {
    if (!isObjectIdOrHexString(senderId) || !isObjectIdOrHexString(receiverId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    // Check if sender and receiver are the same
  if (senderId.equals(receiverId)) {
    throw new ValidationError({
      statusCode: StatusCodes.BadRequest,
      errorField: ErrorField.USER,
      message: ErrorMessage.CANNOT_FRIEND_SELF,
      errorCode: ErrorCode.INVALID_INPUT // Use an appropriate error code
    });
  }
  
    // Check if they are already friends or request is pending
    const status = await this.friendRepository.checkFriendshipStatus(senderId, receiverId);

    console.log(status);
    
  
    if (status === "already_friends") {
      throw new ValidationError({
        statusCode: StatusCodes.Conflict,
        errorField: ErrorField.USER,
        message: ErrorMessage.ALREADY_FRIENDS,
        errorCode: ErrorCode.ALREADY_FRIENDS// Now using a number (1003)
      });
    }
    
    if (status === "request_pending") {
      throw new ValidationError({
        statusCode: StatusCodes.Conflict,
        errorField: ErrorField.FRIEND_REQUEST,
        message: ErrorMessage.FRIEND_REQUEST_PENDING,
        errorCode: ErrorCode.FRIEND_REQUEST_ALREADY_SENT// 1003
      });
    }
  
    await this.friendRepository.addFriendRequest(senderId, receiverId);
  }
  

  async acceptFriendRequest(userId: Types.ObjectId, senderId: Types.ObjectId): Promise<void> {
    if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(senderId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    await this.friendRepository.acceptFriendRequest(userId, senderId);
  }

  async rejectFriendRequest(userId: Types.ObjectId, senderId: Types.ObjectId): Promise<void> {
    if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(senderId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    await this.friendRepository.rejectFriendRequest(userId, senderId);
  }

  async removeFriend(userId: Types.ObjectId, friendId: Types.ObjectId): Promise<void> {
    if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(friendId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    await this.friendRepository.removeFriend(userId, friendId);
  }

  /**
   * Retrieves pending friend requests for a given user.
   * The repository is expected to populate sender details if needed.
   */
  async getPendingFriendRequests(userId: Types.ObjectId): Promise<any[]> {
    if (!isObjectIdOrHexString(userId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }
    return await this.friendRepository.getPendingFriendRequests(userId);
  }


  async getOnlineFriends(userId: Types.ObjectId): Promise<IUser[]> {
    if (!isObjectIdOrHexString(userId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }
  
    return await this.friendRepository.getOnlineFriends(userId);
  }

  /**
   * Retrieves all friends for a given user.
   */
  async getAllFriends(userId: Types.ObjectId): Promise<IUser[]> {
    if (!isObjectIdOrHexString(userId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: ErrorMessage.INVALID_USER_ID,
        errorCode: ErrorCode.INVALID_INPUT
      });
    }
    return await this.friendRepository.getAllFriends(userId);
  }

  /**
   * Blocks a user by adding the blocked user's ID to the user's blocked array.
   */
  async blockUser(userId: Types.ObjectId, blockedUserId: Types.ObjectId): Promise<void> {
    // Validate IDs
    if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(blockedUserId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "Invalid user ID.",
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    // Prevent a user from blocking themselves
    if (userId.equals(blockedUserId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "You cannot block yourself.",
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    // Call repository to block the user. The repository method already checks if the user is already blocked.
    await this.friendRepository.blockUser(userId, blockedUserId);
  }

  /**
   * Unblocks a user by removing the blocked user's ID from the user's blocked array.
   */
  async unblockUser(userId: Types.ObjectId, blockedUserId: Types.ObjectId): Promise<void> {
    // Validate IDs
    if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(blockedUserId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "Invalid user ID.",
        errorCode: ErrorCode.INVALID_INPUT
      });
    }

    await this.friendRepository.unblockUser(userId, blockedUserId);
  }

  /**
   * Retrieves all blocked users for the given user.
   */
  async getAllBlockedUsers(userId: Types.ObjectId): Promise<any[]> {
    if (!isObjectIdOrHexString(userId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "Invalid user ID.",
        errorCode: ErrorCode.INVALID_INPUT
      });
    }
    return await this.friendRepository.getAllBlockedUsers(userId);
  }

}
