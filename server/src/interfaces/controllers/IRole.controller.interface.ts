import { NextFunction, Response } from "express";
import IAuthRequest from "../common/IAuthRequest.interface";

export default interface IRoleController {
  createRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getRoleById(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  getUserRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  updateRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  deleteRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  listRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
}