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
exports.RBACService = void 0;
const customError_error_1 = require("../../errors/customError.error");
class RBACService {
    constructor(roleRepository, communityRepository) {
        this.roleRepository = roleRepository;
        this.communityRepository = communityRepository;
    }
    hasPermission(userId, communityId, requiredPermission) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch community with member roleIds
            const community = yield this.communityRepository.getCommunityById(communityId);
            if (!community)
                throw new customError_error_1.NotFoundError("Community not found", "community");
            // Find the member entry for the user
            const member = community.members.find(m => m.userId.equals(userId));
            if (!member || !member.roleIds.length)
                return false; // No roles assigned
            // Fetch roles in a single query to optimize performance
            const roles = yield this.roleRepository.getRolesByIds(member.roleIds);
            // Check if any of the user's roles contain the required permission
            return roles.some(role => role.permissions.includes(requiredPermission));
        });
    }
}
exports.RBACService = RBACService;
