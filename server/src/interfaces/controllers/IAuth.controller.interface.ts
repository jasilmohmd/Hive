import { NextFunction, Request, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IAuthController {
  register(req: Request, res: Response, next: NextFunction): void;
  login(req: Request, res: Response, next: NextFunction): void;
  logoutUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>
  isUserAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void>
  getRealtimeToken(req: Request, res: Response, next: NextFunction): Promise<void>
  sendVerificationOTP(req: Request, res: Response, next:NextFunction): Promise<void>
  verifyOTP(req: Request, res: Response, next:NextFunction): Promise<void>
  setNewPassword(req: Request, res: Response, next: NextFunction): Promise<void>
  getUserDetails(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>
  getUserDetailsById(req: Request, res: Response, next: NextFunction): Promise<void>
}