import { Router } from "express";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import { ChannelRepository } from "../../repositories/channel.repository";
import { CommunityRepository } from "../../repositories/community.repository";
import { RoleRepository } from "../../repositories/role.repository";
import { UserRepository } from "../../repositories/user.repository";
import { RBACService } from "../utils/RBACService";
import { VoiceroomUseCase } from "../../usecase/voiceroom.usecase";
import { VoiceroomController } from "../../controller/voiceroom.controller";

const voiceroomRouter = Router();
const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const communityRepository = new CommunityRepository();
const voiceroomUseCase = new VoiceroomUseCase(
  new ChannelRepository(),
  communityRepository,
  new RBACService(new RoleRepository(), communityRepository),
  new UserRepository()
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
