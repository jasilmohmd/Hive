"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
/**
 * If you have an extended request interface that includes a userId property,
 * you can import and use it. For example:
 *
 * import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
 * Then replace Request with IAuthRequest in method signatures.
 */
class RoleController {
    constructor(roleUsecase) {
        this.roleUsecase = roleUsecase;
    }
    /**
     * Create a new role.
     * Expects:
     *  - communityId, name, and permissions in req.body.
     *  - Authenticated user's ID on req.userId.
     */
    createRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                // Extract required values from the request.
                const { name, permissions } = req.body;
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid or missing community ID" });
                    return;
                }
                // Call the usecase to create the role.
                const role = yield this.roleUsecase.createRole(userId, communityId, { name, permissions });
                res.status(statusCodes_1.default.Created).json(role);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieve a role by its ID.
     * Expects:
     *  - Role ID in req.params.id.
     */
    getRoleById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid role ID" });
                    return;
                }
                const role = yield this.roleUsecase.getRoleById(new mongoose_1.Types.ObjectId(id));
                res.status(statusCodes_1.default.Success).json(role);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getUserRoles(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid community ID" });
                    return;
                }
                const roles = yield this.roleUsecase.getUserRoles(userId, communityId);
                res.status(statusCodes_1.default.Success).json({ roles });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update an existing role.
     * Expects:
     *  - communityId and roleId in req.params.
     *  - Update data in req.body.
     *  - Authenticated user's ID on req.userId.
     */
    updateRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                const roleId = new mongoose_1.Types.ObjectId(req.params.roleId);
                const updateData = req.body;
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid community ID" });
                    return;
                }
                if (!roleId || !mongoose_1.Types.ObjectId.isValid(roleId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid role ID" });
                    return;
                }
                const updatedRole = yield this.roleUsecase.updateRole(userId, communityId, roleId, updateData);
                res.status(statusCodes_1.default.Success).json(updatedRole);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a role.
     * Expects:
     *  - communityId and roleId in req.params.
     *  - Authenticated user's ID on req.userId.
     */
    deleteRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                const roleId = new mongoose_1.Types.ObjectId(req.params.roleId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid community ID" });
                    return;
                }
                if (!roleId || !mongoose_1.Types.ObjectId.isValid(roleId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid role ID" });
                    return;
                }
                const result = yield this.roleUsecase.deleteRole(userId, communityId, roleId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * List all roles for a given community.
     * Expects:
     *  - communityId in req.params.communityId.
     */
    listRoles(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid community ID" });
                    return;
                }
                const roles = yield this.roleUsecase.listRoles(new mongoose_1.Types.ObjectId(communityId));
                res.status(statusCodes_1.default.Success).json(roles);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = RoleController;
