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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleUseCase = void 0;
const mongoose_1 = require("mongoose");
const customError_error_1 = require("../errors/customError.error");
const role_validator_1 = require("../framework/utils/validators/role.validator");
class RoleUseCase {
    constructor(roleRepository, rbacService // Injected for possible permission checks
    ) {
        this.roleRepository = roleRepository;
        this.rbacService = rbacService;
    }
    /**
     * Create a new role for a community.
     * Throws a ValidationError if a role with the same name already exists.
     */
    createRole(userId, communityId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const validatedData = role_validator_1.roleValidator.parse(data);
                // Check if the role already exists in this community.
                const existingRole = yield this.roleRepository.getRoleByName(validatedData.name, communityId);
                if (existingRole) {
                    throw new customError_error_1.ValidationError("Role already exists", "role");
                }
                // Check if the user has permission to create a channel.
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "roles");
                const roleData = {
                    _id: undefined, // Will be assigned by MongoDB
                    communityId: communityId,
                    name: validatedData.name,
                    permissions: validatedData.permissions,
                    isDefault: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                return yield this.roleRepository.createRole(roleData);
            }
            catch (error) {
                throw new Error(`Error crating role: ${error.message}`);
            }
        });
    }
    /**
     * Get a role by its ID.
     */
    getRoleById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const role = yield this.roleRepository.getRoleById(id);
                if (!role) {
                    throw new customError_error_1.NotFoundError("Role not found", "role");
                }
                return role;
            }
            catch (error) {
                throw new Error(`Error geting role: ${error.message}`);
            }
        });
    }
    getUserRoles(userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const roles = yield this.roleRepository.getUserRoles(userId, communityId);
                return roles;
            }
            catch (error) {
                throw new Error(`Error geting roles: ${error.message}`);
            }
        });
    }
    /**
     * Update an existing role.
     * For security, default roles (Owner, Admin, etc.) might be non-editable.
     */
    updateRole(userId, communityId, roleId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const role = yield this.getRoleById(roleId);
                if (role.isDefault) {
                    throw new customError_error_1.UnauthorizedError("Cannot update default role", "role");
                }
                // Check if the user has permission to create a channel.
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "roles");
                const validatedData = role_validator_1.roleValidator.parse(data);
                const updatedRole = yield this.roleRepository.updateRole(roleId, validatedData);
                if (!updatedRole) {
                    throw new customError_error_1.NotFoundError("Role not found or update failed", "role");
                }
                return updatedRole;
            }
            catch (error) {
                throw new Error(`Error updating role: ${error.message}`);
            }
        });
    }
    /**
     * Delete a role.
     * Prevent deletion of default roles.
     */
    deleteRole(userId, communityId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const role = yield this.getRoleById(roleId);
                if (role.isDefault) {
                    throw new customError_error_1.UnauthorizedError("Cannot delete default role", "role");
                }
                // Check if the user has permission to create a channel.
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "roles");
                const result = yield this.roleRepository.deleteRole(roleId);
                if (!result) {
                    throw new Error("Failed to delete role");
                }
                return result;
            }
            catch (error) {
                throw new Error(`Error deleting role: ${error.message}`);
            }
        });
    }
    /**
     * List all roles for a given community.
     */
    listRoles(communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                return yield this.roleRepository.getAllRoles(communityId);
            }
            catch (error) {
                throw new Error(`Error listing roles: ${error.message}`);
            }
        });
    }
}
exports.RoleUseCase = RoleUseCase;
