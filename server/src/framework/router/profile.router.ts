import { Router } from "express";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IProfileRepository from "../../interfaces/repository/IProfile.repository.interface";
import IProfileUsecase from "../../interfaces/usecase/IProfile.usecase.interface";
import IProfileController from "../../interfaces/controllers/IProfile.controller.interface";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import ProfileRepository from "../../repositories/profile.repository";
import ProfileUSecase from "../../usecase/profile.usecase";
import ProfileController from "../../controller/profile.controller";

const profileRouter: Router = Router();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const profileRepository: IProfileRepository = new ProfileRepository();
const profileUseCase: IProfileUsecase = new ProfileUSecase(profileRepository);
const profileController: IProfileController = new ProfileController(profileUseCase);

// Apply authMiddleware to all routes
profileRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));


profileRouter.put("/edit_profile", profileController.editProfile.bind(profileController));

profileRouter.put("/change_password", profileController.changePassword.bind(profileController));

profileRouter.put("/avatar", profileController.updateAvatar.bind(profileController));


export default profileRouter;