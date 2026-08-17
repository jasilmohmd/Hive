import { Router } from "express";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import { CallController } from "../../controller/call.controller";

const callRouter = Router();
const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const callController = new CallController();

callRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));
callRouter.get("/ice-config", callController.getIceConfig.bind(callController));

export default callRouter;
