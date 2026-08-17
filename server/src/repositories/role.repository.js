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
exports.RoleRepository = void 0;
const role_model_1 = require("../framework/models/role.model");
const community_model_1 = require("../framework/models/community.model");
class RoleRepository {
    createRole(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure isDefault is set; if undefined, default to false.
            if (data.isDefault === undefined) {
                data.isDefault = false;
            }
            const role = new role_model_1.RoleModel(data);
            return yield role.save();
        });
    }
    getRoleById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield role_model_1.RoleModel.findById(id);
        });
    }
    getRolesByIds(roleIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield role_model_1.RoleModel.find({ _id: { $in: roleIds } });
        });
    }
    // Check for duplicate roles within a community.
    getRoleByName(name, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield role_model_1.RoleModel.findOne({ name, communityId });
        });
    }
    // List roles for a given community.
    getAllRoles(communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield role_model_1.RoleModel.find({ communityId });
        });
    }
    updateRole(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield role_model_1.RoleModel.findByIdAndUpdate(id, data, { new: true });
        });
    }
    deleteRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield role_model_1.RoleModel.findByIdAndDelete(id);
            return result ? true : false;
        });
    }
    /**
     * Assign a role to a user in a given community.
     * This creates an entry in the UserRole collection.
     */
    assignRole(userId, communityId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community)
                return false;
            // Find member entry for the user
            const member = community.members.find(m => m.userId.equals(userId));
            if (member) {
                // If role already exists in the member's roleIds, do nothing
                if (member.roleIds.some(rid => rid.equals(roleId))) {
                    return true;
                }
                // Otherwise, add the role to the member's roleIds array
                member.roleIds.push(roleId);
            }
            else {
                // If the user is not already a member, create a new member entry with the role
                community.members.push({
                    userId: userId,
                    roleIds: [roleId]
                });
            }
            yield community.save();
            return true;
        });
    }
    /**
     * Retrieve all roles assigned to a user in a specific community.
     */
    getUserRoles(userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch the community document
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community) {
                console.log("Community not found");
                return [];
            }
            // Find the member entry for the user. Explicitly type the member.
            const member = community.members.find((m) => m.userId.equals(userId));
            if (!member || member.roleIds.length === 0)
                return [];
            // Fetch full role details for all role IDs in the member entry.
            return yield role_model_1.RoleModel.find({ _id: { $in: member.roleIds } });
        });
    }
    /**
     * Remove a role assignment from a user in a specific community.
     */
    removeRole(userId, communityId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch the community document
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community)
                return false;
            // Find the index of the member entry for the user
            const memberIndex = community.members.findIndex(m => m.userId.equals(userId));
            if (memberIndex === -1)
                return false; // User is not a member
            // Filter out the specified role from the user's roleIds
            community.members[memberIndex].roleIds = community.members[memberIndex].roleIds.filter(id => !id.equals(roleId));
            // Optionally, if no roles remain for the member, remove the member entry
            if (community.members[memberIndex].roleIds.length === 0) {
                community.members.splice(memberIndex, 1);
            }
            yield community.save();
            return true;
        });
    }
}
exports.RoleRepository = RoleRepository;
