import { Router } from "express";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import { ChannelRepository } from "../../repositories/channel.repository";
import { CommunityRepository } from "../../repositories/community.repository";
import { VoiceroomUseCase } from "../../usecase/voiceroom.usecase";
import { VoiceroomController } from "../../controller/voiceroom.controller";

const voiceroomRouter = Router();
const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const voiceroomUseCase = new VoiceroomUseCase(
  new ChannelRepository(),
  new CommunityRepository()
);
const voiceroomController = new VoiceroomController(voiceroomUseCase);

voiceroomRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));
voiceroomRouter.get(
  "/:channelId/presence",
  voiceroomController.getPresence.bind(voiceroomController)
);
voiceroomRouter.post(
  "/:channelId/token",
  voiceroomController.getToken.bind(voiceroomController)
);

export default voiceroomRouter;
