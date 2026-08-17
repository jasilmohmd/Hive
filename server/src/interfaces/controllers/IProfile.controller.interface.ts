import { NextFunction, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IProfileController {
  editProfile(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  changePassword(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  updateAvatar(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
}