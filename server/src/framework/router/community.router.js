"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const community_controller_1 = __importDefault(require("../../controller/community.controller"));
const jwt_service_1 = __importDefault(require("../utils/jwt.service"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const community_usecase_1 = require("../../usecase/community.usecase");
const community_repository_1 = require("../../repositories/community.repository");
const role_repository_1 = require("../../repositories/role.repository");
const RBACService_1 = require("../utils/RBACService");
const communityRouter = (0, express_1.Router)();
const communityRepository = new community_repository_1.CommunityRepository();
const roleRepository = new role_repository_1.RoleRepository();
const jwtService = new jwt_service_1.default();
const authMiddleware = new auth_middleware_1.default(jwtService);
const rbacService = new RBACService_1.RBACService(roleRepository, communityRepository);
const communityUsecase = new community_usecase_1.CommunityUseCase(communityRepository, roleRepository, rbacService);
const communityController = new community_controller_1.default(communityUsecase);
// Apply authentication middleware to all routes
communityRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));
// Define routes in a specific order to avoid conflicts with parameterized routes
communityRouter.route("/create").post(communityController.createCommunity.bind(communityController));
communityRouter.route("/search").get(communityController.searchCommunities.bind(communityController));
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
exports.default = communityRouter;
