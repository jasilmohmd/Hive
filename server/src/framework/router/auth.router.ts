import { Router } from "express";
import AuthController from "../../controller/auth.controller";
import IAuthController from "../../interfaces/controllers/IAuth.controller.interface";
import IAuthUseCase from "../../interfaces/usecase/IAuth.usecase.interface";
import AuthUsecase from "../../usecase/auth.usecase";
import IAuthRepository from "../../interfaces/repository/IAuth.repository.interface";
import AuthRepository from "../../repositories/auth.repository";
import IHashingService from "../../interfaces/utils/IHashing.service";
import HashingService from "../utils/hashing.service";
import IJWTService from "../../interfaces/utils/IJwt.service";
import JWTService from "../utils/jwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import AuthMiddleware from "../middlewares/auth.middleware";


const authRouter: Router = Router();

const jwtService: IJWTService = new JWTService();
const hashingService: IHashingService = new HashingService();

// auth middleware
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);

const authRepository: IAuthRepository = new AuthRepository();
const authUsecase: IAuthUseCase = new AuthUsecase(authRepository,hashingService,jwtService);
const authController: IAuthController = new AuthController(authUsecase); 


authRouter.route("/register").post(authController.register.bind(authController));

authRouter.route("/login").post(authController.login.bind(authController));

authRouter.route("/logout").post(authMiddleware.isAuthenticated.bind(authMiddleware), authController.logoutUser.bind(authController));

authRouter.route("/isUserAuthenticated").post(authController.isUserAuthenticated.bind(authController));

authRouter.route("/realtime-token").get(authController.getRealtimeToken.bind(authController));

authRouter.route("/send-otp").post(authController.sendVerificationOTP.bind(authController));

authRouter.route("/otp_verify").post(authController.verifyOTP.bind(authController));

authRouter.route("/set_new_password").post(authController.setNewPassword.bind(authController));

authRouter.route("/details").get(authMiddleware.isAuthenticated.bind(authMiddleware), authController.getUserDetails.bind(authController))

authRouter.route("/userDetails/:id").get(authMiddleware.isAuthenticated.bind(authMiddleware), authController.getUserDetailsById.bind(authController))
 
export default authRouter;