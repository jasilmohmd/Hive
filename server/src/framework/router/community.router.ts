import { Router } from "express";
import CommunityController from "../../controller/community.controller";


import ICommunityUsecase from "../../interfaces/usecase/ICommunity.usecase.interface";

import IJWTService from "../../interfaces/utils/IJwt.service";
import JWTService from "../utils/jwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import AuthMiddleware from "../middlewares/auth.middleware";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";
import ICommunityController from "../../interfaces/controllers/ICommunityController.interface";
import { CommunityUseCase } from "../../usecase/community.usecase";
import { CommunityRepository } from "../../repositories/community.repository";
import { IRoleRepository } from "../../interfaces/repository/IRole.repository.interface";
import { RoleRepository } from "../../repositories/role.repository";
import IRBACService from "../../interfaces/utils/IRBAC.service";
import { RBACService } from "../utils/RBACService";

const communityRouter: Router = Router();



const communityRepository: ICommunityRepository = new CommunityRepository();
const roleRepository: IRoleRepository = new RoleRepository();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const rbacService: IRBACService = new RBACService(roleRepository,communityRepository);

const communityUsecase: ICommunityUsecase = new CommunityUseCase(communityRepository,roleRepository,rbacService);
const communityController: ICommunityController = new CommunityController(communityUsecase);

// Apply authentication middleware to all routes
communityRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));

// Define routes in a specific order to avoid conflicts with parameterized routes
communityRouter.route("/create").post(communityController.createCommunity.bind(communityController));
communityRouter.route("/search").get( communityController.searchCommunities.bind(communityController));
communityRouter.route("/").get(communityController.listCommunities.bind(communityController));
communityRouter.route("/user").get(communityController.getCommunitiesByUser.bind(communityController));

// Tags and Categories
communityRouter.route("/tags").get(communityController.getAllTags.bind(communityController));
communityRouter.route("/categories").get(communityController.getCategories.bind(communityController));

// parameterized routes
communityRouter.route("/:id").get(communityController.getCommunityById.bind(communityController));
communityRouter.route("/update/:communityId").put(communityController.updateCommunity.bind(communityController));
communityRouter.route("/delete/:communityId").delete(communityController.deleteCommunity.bind(communityController));
communityRouter.route("/tag/:id").get(communityController.getTagById.bind(communityController));


// Community join and membership routes
communityRouter.route("/request/:communityId").post(communityController.requestToJoinCommunity.bind(communityController));
communityRouter.route("/approve_request/:communityId").post(communityController.approveJoinRequest.bind(communityController));
communityRouter.route("/reject_request/:communityId").post(communityController.rejectJoinRequest.bind(communityController));
communityRouter.route("/leave/:communityId").post(communityController.leaveCommunity.bind(communityController));
communityRouter.route("/member/add/:communityId").post(communityController.addMember.bind(communityController));
communityRouter.route("/member/remove/:communityId").post(communityController.removeMember.bind(communityController));

// Community tag routes
communityRouter.route("/add_tag/:communityId/:tagId").post(communityController.addTag.bind(communityController));
communityRouter.route("/remove_tag/:communityId/:tagId").delete(communityController.removeTag.bind(communityController));

// Community filtering
communityRouter.route("/filter_by_tag/:tagId").get(communityController.filterCommunitiesByTag.bind(communityController));
communityRouter.route("/filter_by_category/:categoryId").get(communityController.filterCommunitiesByCategory.bind(communityController));

export default communityRouter;
