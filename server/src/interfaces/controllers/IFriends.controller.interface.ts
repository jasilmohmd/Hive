import { NextFunction, Request, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IFriendController {
  searchUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
  sendFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  acceptFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  rejectFriendRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  removeFriend(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getPendingFriendRequests(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getOnlineFriends(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>
  getAllFriends(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  blockUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  unblockUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getAllBlockedUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
}