"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_service_1 = __importDefault(require("../utils/jwt.service"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const profile_repository_1 = __importDefault(require("../../repositories/profile.repository"));
const profile_usecase_1 = __importDefault(require("../../usecase/profile.usecase"));
const profile_controller_1 = __importDefault(require("../../controller/profile.controller"));
const profileRouter = (0, express_1.Router)();
const jwtService = new jwt_service_1.default();
const authMiddleware = new auth_middleware_1.default(jwtService);
const profileRepository = new profile_repository_1.default();
const profileUseCase = new profile_usecase_1.default(profileRepository);
const profileController = new profile_controller_1.default(profileUseCase);
// Apply authMiddleware to all routes
profileRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));
profileRouter.put("/edit_profile", profileController.editProfile.bind(profileController));
profileRouter.put("/change_password", profileController.changePassword.bind(profileController));
profileRouter.put("/avatar", profileController.updateAvatar.bind(profileController));
exports.default = profileRouter;
