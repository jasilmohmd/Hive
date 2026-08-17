import { Response, NextFunction } from "express";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../constants/auth/statusCodes";
import { VoiceroomUseCase } from "../usecase/voiceroom.usecase";

export class VoiceroomController {
  constructor(private voiceroomUseCase: VoiceroomUseCase) {}

  async getToken(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const channelId = req.params.channelId;
      const result = await this.voiceroomUseCase.createJoinToken(
        req.userId.toString(),
        channelId
      );
      res.status(StatusCodes.Success).json(result);
    } catch (error) {
      const status = (error as Error & { statusCode?: number }).statusCode;
      if (status === 403) {
        res.status(403).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async getPresence(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const channelId = req.params.channelId;
      const result = await this.voiceroomUseCase.getPresence(
        req.userId.toString(),
        channelId
      );
      res.status(StatusCodes.Success).json(result);
    } catch (error) {
      next(error);
    }
  }
}
