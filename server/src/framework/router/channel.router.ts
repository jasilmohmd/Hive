import { Router } from "express";
import { IChannelRepository } from "../../interfaces/repository/IChannel.repository.interface";
import { ChannelRepository } from "../../repositories/channel.repository";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import { ChannelUseCase } from "../../usecase/channel.usecase";
import IChannelUsecase from "../../interfaces/usecase/IChannel.usecase.interface";
import { IRoleRepository } from "../../interfaces/repository/IRole.repository.interface";
import { RoleRepository } from "../../repositories/role.repository";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";
import { CommunityRepository } from "../../repositories/community.repository";
import { RBACService } from "../utils/RBACService";
import IRBACService from "../../interfaces/utils/IRBAC.service";
import IChannelController from "../../interfaces/controllers/IChannel.controller.interface";
import ChannelController from "../../controller/channel.controller";
import { ChatRepository } from "../../repositories/chat.repository";

const channelRouter: Router = Router();

const channelRepository: IChannelRepository = new ChannelRepository;
const roleRepository: IRoleRepository = new RoleRepository;
const communityRepository: ICommunityRepository = new CommunityRepository();
const chatRepository = new ChatRepository();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const rbacService: IRBACService = new RBACService(roleRepository,communityRepository);

const channelUsecase: IChannelUsecase = new ChannelUseCase(channelRepository,roleRepository,rbacService,chatRepository);

const channelController: IChannelController = new ChannelController(channelUsecase);

channelRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));



channelRouter.route("/create/:communityId").post(channelController.createChannel.bind(channelController));
channelRouter.route("/:id").get(channelController.getChannelById.bind(channelController));
channelRouter.route("/list/:communityId").get(channelController.getAccessibleChannels.bind(channelController));
channelRouter.route("/search/:communityId").get(channelController.searchAccessibleChannels.bind(channelController));
channelRouter.route("/update/:communityId/:channelId").put(channelController.updateChannel.bind(channelController));
channelRouter.route("/delete/:communityId/:channelId").delete(channelController.deleteChannel.bind(channelController));

export default channelRouter;