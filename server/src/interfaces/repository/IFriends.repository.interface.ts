import { Types } from "mongoose";
import IUser from "../../entity/User.entity";

export default interface IFriendRepository {
  searchUserByUsername(username: string): Promise<IUser[]>;
  checkFriendshipStatus(senderId: Types.ObjectId, receiverId: Types.ObjectId): Promise<string>;
  addFriendRequest(senderId: Types.ObjectId, receiverId: Types.ObjectId): Promise<string>;
  acceptFriendRequest(userId: Types.ObjectId, senderId: Types.ObjectId): Promise<void>;
  rejectFriendRequest(userId: Types.ObjectId, senderId: Types.ObjectId): Promise<void>;
  removeFriend(userId: Types.ObjectId, friendId: Types.ObjectId): Promise<void>;
  getPendingFriendRequests(userId: Types.ObjectId): Promise<any[]>;
  getOnlineFriends(userId: Types.ObjectId): Promise<IUser[]>;
  getAllFriends(userId: Types.ObjectId): Promise<IUser[]>;
  blockUser(userId: Types.ObjectId, blockedUserId: Types.ObjectId): Promise<void>;
  unblockUser(userId: Types.ObjectId, blockedUserId: Types.ObjectId): Promise<void>;
  getAllBlockedUsers(userId: Types.ObjectId): Promise<IUser[]>;
}
