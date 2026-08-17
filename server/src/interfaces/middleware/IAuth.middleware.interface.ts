import { NextFunction, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IAuthMiddleware {
  isAuthenticated(req: IAuthRequest, res: Response, next: NextFunction): void;
}