import { NextFunction, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IChannelController {
  createChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getChannelById(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getAccessibleChannels(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  searchAccessibleChannels(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  updateChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  deleteChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
}