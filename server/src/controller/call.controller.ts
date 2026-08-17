import { Response, NextFunction } from "express";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../constants/auth/statusCodes";
import { buildIceServers } from "../framework/utils/iceConfig";

export class CallController {
  async getIceConfig(_req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(StatusCodes.Success).json({ iceServers: buildIceServers() });
    } catch (error) {
      next(error);
    }
  }
}
