import { Router } from "express";
import FriendController from "../../controller/friends.controller";
import IFriendController from "../../interfaces/controllers/IFriends.controller.interface";
import IFriendRepository from "../../interfaces/repository/IFriends.repository.interface";
import IFriendUsecase from "../../interfaces/usecase/IFriends.usecase.interface";
import FriendRepository from "../../repositories/friends.repository";
import FriendUseCase from "../../usecase/friends.usecase";
import IJWTService from "../../interfaces/utils/IJwt.service";
import JWTService from "../utils/jwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import AuthMiddleware from "../middlewares/auth.middleware";

const friendRouter: Router = Router();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const friendRepository: IFriendRepository = new FriendRepository();
const friendUseCase: IFriendUsecase = new FriendUseCase(friendRepository);
const friendController: IFriendController = new FriendController(friendUseCase);

// Apply authMiddleware to all routes
friendRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));

friendRouter.get("/search", friendController.searchUsers.bind(friendController));
friendRouter.post("/request", friendController.sendFriendRequest.bind(friendController));
friendRouter.post("/accept_request", friendController.acceptFriendRequest.bind(friendController));
friendRouter.post("/reject_request", friendController.rejectFriendRequest.bind(friendController));
friendRouter.delete("/remove_friend/:friendId", friendController.removeFriend.bind(friendController));
friendRouter.get("/pending_requests", friendController.getPendingFriendRequests.bind(friendController));
friendRouter.get("/online", friendController.getOnlineFriends.bind(friendController));
friendRouter.get("/all", friendController.getAllFriends.bind(friendController));
friendRouter.post("/block_user", friendController.blockUser.bind(friendController));
friendRouter.post("/unblock_user", friendController.unblockUser.bind(friendController));
friendRouter.get("/blocked", friendController.getAllBlockedUsers.bind(friendController));


export default friendRouter;
