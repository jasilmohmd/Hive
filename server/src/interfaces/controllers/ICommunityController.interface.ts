import { NextFunction, Request, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface ICommunityController {
  createCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getCommunityById(req: Request, res: Response, next: NextFunction): Promise<void>;
  searchCommunities(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  deleteCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  listCommunities(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCommunitiesByUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  requestToJoinCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  approveJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  rejectJoinRequest(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  leaveCommunity(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  addMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  removeMember(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  addTag(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  removeTag(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  filterCommunitiesByTag(req: Request, res: Response, next: NextFunction): Promise<void>;
  filterCommunitiesByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAllTags(req: Request, res: Response, next: NextFunction): Promise<void>;
  getTagById(req: Request, res: Response, next: NextFunction): Promise<void>;
}