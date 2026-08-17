import { Router } from "express";
import { IRoleRepository } from "../../interfaces/repository/IRole.repository.interface";
import { RoleRepository } from "../../repositories/role.repository";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";
import { CommunityRepository } from "../../repositories/community.repository";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import IRBACService from "../../interfaces/utils/IRBAC.service";
import { RBACService } from "../utils/RBACService";
import AuthMiddleware from "../middlewares/auth.middleware";
import JWTService from "../utils/jwt.service";
import IRoleUsecase from "../../interfaces/usecase/IRole.usecase.interface";
import { RoleUseCase } from "../../usecase/role.usecase";
import IRoleController from "../../interfaces/controllers/IRole.controller.interface";
import RoleController from "../../controller/role.controller";

const roleRouter: Router = Router();

const roleRepository: IRoleRepository = new RoleRepository();
const communityRepository: ICommunityRepository = new CommunityRepository();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const rbacService: IRBACService = new RBACService(roleRepository,communityRepository);

const roleUsecase: IRoleUsecase = new RoleUseCase(roleRepository, rbacService);

const roleController: IRoleController = new RoleController(roleUsecase);

roleRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));


roleRouter.route("/create/:communityId").post(roleController.createRole.bind(roleController));
roleRouter.route("/:id").get(roleController.getRoleById.bind(roleController));
roleRouter.route("/user/:communityId").get(roleController.getUserRoles.bind(roleController));
roleRouter.route("/update/:communityId/:roleId").put(roleController.updateRole.bind(roleController));
roleRouter.route("/delete/:communityId/:roleId").delete(roleController.deleteRole.bind(roleController));
roleRouter.route("/list/:communityId").get(roleController.listRoles.bind(roleController));

export default roleRouter;
