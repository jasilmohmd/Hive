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
exports.CommunityUseCase = void 0;
const customError_error_1 = require("../errors/customError.error");
const mongoose_1 = require("mongoose");
const community_validator_1 = require("../framework/utils/validators/community.validator");
const predifinedRoles_1 = require("../constants/predifinedRoles");
class CommunityUseCase {
    constructor(communityRepository, roleRepository, rbacService) {
        this.communityRepository = communityRepository;
        this.roleRepository = roleRepository;
        this.rbacService = rbacService;
    }
    /**
     * Create a new community and automatically generate default roles.
     */
    createCommunity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = community_validator_1.communityValidator.parse(data);
                // Check for duplicate community name.
                const existingCommunity = yield this.communityRepository.getCommunityByName(data.name);
                if (existingCommunity) {
                    throw new customError_error_1.ValidationError("Community with this name already exists", "community");
                }
                // Build new community object.
                const newCommunity = Object.assign(Object.assign({ _id: undefined }, validatedData), { roles: [], channels: [], members: [], joinRequests: [], createdAt: new Date(), updatedAt: new Date() });
                // Create the community.
                const createdCommunity = yield this.communityRepository.createCommunity(newCommunity);
                // Define default roles.
                const RolesData = predifinedRoles_1.defaultRolesData;
                // Create default roles for this community.
                const createdRoles = yield Promise.all(RolesData.map((roleData) => __awaiter(this, void 0, void 0, function* () {
                    return yield this.roleRepository.createRole({
                        _id: undefined,
                        communityId: createdCommunity._id,
                        name: roleData.name,
                        permissions: roleData.permissions,
                        isDefault: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                })));
                // Update the community document with the default role IDs.
                createdCommunity.roles = createdRoles.map(role => role._id);
                yield createdCommunity.save();
                // Assign the owner (community creator) the "Owner" role.
                const ownerRole = createdRoles.find(role => role.name === "Owner");
                if (ownerRole) {
                    yield this.roleRepository.assignRole(validatedData.ownerId, createdCommunity._id, ownerRole._id);
                }
                else {
                    throw new customError_error_1.CustomError({ statusCode: 500, message: "Owner role not created", errorField: "role" });
                }
                return createdCommunity;
            }
            catch (error) {
                throw new Error(`Failed to create community: ${error.message}`);
            }
        });
    }
    /**
     * Get a community by its ID.
     */
    getCommunityById(communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                return community;
            }
            catch (error) {
                throw new Error(`Error fetching community: ${error.message}`);
            }
        });
    }
    /**
     * Search communities by name.
     * Returns communities whose names match the search term (case-insensitive).
     */
    searchCommunitiesByName(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Assumes communityRepository.searchCommunities is implemented.
                const communities = yield this.communityRepository.searchCommunities(searchTerm);
                if (!communities || communities.length === 0) {
                    throw new customError_error_1.NotFoundError("No communities found", "community");
                }
                return communities;
            }
            catch (error) {
                throw new Error(`Error searching communities: ${error.message}`);
            }
        });
    }
    /**
     * Update a community.
     * Only allowed for users with the "MANAGE_COMMUNITY" permission.
     */
    updateCommunity(userId, communityId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_COMMUNITY");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                const validatedData = community_validator_1.communityUpdateValidator.parse(data);
                const updatedCommunity = yield this.communityRepository.updateCommunity(communityId, validatedData);
                if (!updatedCommunity)
                    throw new Error("Update failed");
                return updatedCommunity;
            }
            catch (error) {
                throw new Error(`Error updating community: ${error.message}`);
            }
        });
    }
    /**
     * Delete a community.
     * Only allowed for users with the "MANAGE_COMMUNITY" permission.
     */
    deleteCommunity(userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_COMMUNITY");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                const result = yield this.communityRepository.deleteCommunity(communityId);
                if (!result)
                    throw new Error("Deletion failed");
                return result;
            }
            catch (error) {
                throw new Error(`Error deleting community: ${error.message}`);
            }
        });
    }
    /**
     * List all communities.
     */
    listCommunities() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.communityRepository.getAllCommunities();
            }
            catch (error) {
                throw new Error(`Error listing communities: ${error.message}`);
            }
        });
    }
    /**
     * Get all communities a user is a member of.
     */
    getCommunitiesByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                const communities = yield this.communityRepository.getCommunitiesByUser(userId);
                if (!communities || communities.length === 0) {
                    throw new customError_error_1.NotFoundError("No communities found for the user", "community");
                }
                return communities;
            }
            catch (error) {
                throw new Error(`Error fetching communities for user: ${error.message}`);
            }
        });
    }
    requestToJoinCommunity(userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                // Check if user is already a member
                if (community.members.some(member => member.userId === userId)) {
                    throw new customError_error_1.ValidationError("User is already a member", "community");
                }
                // Prevent duplicate requests
                const existingRequests = yield this.communityRepository.getJoinRequests(communityId);
                if (existingRequests.includes(new mongoose_1.Types.ObjectId(userId))) {
                    throw new customError_error_1.ValidationError("Join request already sent", "community");
                }
                return yield this.communityRepository.addJoinRequest(communityId, userId);
            }
            catch (error) {
                throw new Error(`Error sending join request: ${error.message}`);
            }
        });
    }
    approveJoinRequest(userId, communityId, memberId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(memberId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                if (!mongoose_1.Types.ObjectId.isValid(roleId)) {
                    throw new customError_error_1.ValidationError("Invalid Role ID", "role");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                // Check if admin has permission
                const hasPermission = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
                if (!hasPermission)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                return yield this.communityRepository.approveJoinRequest(communityId, memberId, roleId);
            }
            catch (error) {
                throw new Error(`Error approving join request: ${error.message}`);
            }
        });
    }
    rejectJoinRequest(userId, communityId, memberId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(memberId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                // Check if admin has permission
                const hasPermission = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
                if (!hasPermission)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                return yield this.communityRepository.removeJoinRequest(communityId, memberId);
            }
            catch (error) {
                throw new Error(`Error rejecting join request: ${error.message}`);
            }
        });
    }
    /**
     * Leave a community.
     */
    leaveCommunity(userId, communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const result = yield this.communityRepository.removeMember(communityId, userId);
                if (!result)
                    throw new Error("Failed to leave community");
                return result;
            }
            catch (error) {
                throw new Error(`Error leaving community: ${error.message}`);
            }
        });
    }
    addMember(userId, communityId, memberId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(memberId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                if (!mongoose_1.Types.ObjectId.isValid(roleId)) {
                    throw new customError_error_1.ValidationError("Invalid Role ID", "role");
                }
                // const community = await this.communityRepository.getCommunityById(communityId);
                // if (!community) throw new NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                const result = yield this.communityRepository.addMember(communityId, memberId, roleId);
                if (!result)
                    throw new Error("Failed to add member");
                return result;
            }
            catch (error) {
                throw new Error(`Error adding member: ${error.message}`);
            }
        });
    }
    removeMember(userId, communityId, memberId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new customError_error_1.ValidationError("Invalid User ID", "user");
                }
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(memberId)) {
                    throw new customError_error_1.ValidationError("Invalid Admin ID", "admin");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "community");
                const result = yield this.communityRepository.removeMember(communityId, memberId);
                if (!result)
                    throw new Error("Failed to remove member");
                return result;
            }
            catch (error) {
                throw new Error(`Error removing member: ${error.message}`);
            }
        });
    }
    /**
     * Add a tag to a community.
     */
    addTag(userId, communityId, tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(tagId)) {
                    throw new customError_error_1.ValidationError("Invalid Tag ID", "tag");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_TAG");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "tag");
                const result = yield this.communityRepository.addTag(communityId, tagId);
                if (!result)
                    throw new Error("Failed to add tag to community");
                return result;
            }
            catch (error) {
                throw new Error(`Error adding tag to community: ${error.message}`);
            }
        });
    }
    /**
     * Remove a tag from a community.
     */
    removeTag(userId, communityId, tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(communityId)) {
                    throw new customError_error_1.ValidationError("Invalid Community ID", "community");
                }
                if (!mongoose_1.Types.ObjectId.isValid(tagId)) {
                    throw new customError_error_1.ValidationError("Invalid Tag ID", "tag");
                }
                const community = yield this.communityRepository.getCommunityById(communityId);
                if (!community)
                    throw new customError_error_1.NotFoundError("Community not found", "community");
                const allowed = yield this.rbacService.hasPermission(userId, communityId, "MANAGE_TAG");
                if (!allowed)
                    throw new customError_error_1.UnauthorizedError("Permission denied", "tag");
                const result = yield this.communityRepository.removeTag(communityId, tagId);
                if (!result)
                    throw new Error("Failed to remove tag from community");
                return result;
            }
            catch (error) {
                throw new Error(`Error removing tag from community: ${error.message}`);
            }
        });
    }
    /**
     * Filter communities by a specific tag.
     */
    filterCommunitiesByTag(tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(tagId)) {
                    throw new customError_error_1.ValidationError("Invalid Tag ID", "tag");
                }
                const communities = yield this.communityRepository.filterCommunitiesByTag(tagId);
                if (!communities || communities.length === 0) {
                    throw new customError_error_1.NotFoundError("No communities found for the given tag", "community");
                }
                return communities;
            }
            catch (error) {
                throw new Error(`Error filtering communities by tag: ${error.message}`);
            }
        });
    }
    /**
     * Filter communities by category.
     * Since categories are stored within Tag documents, this method finds tags with the given category,
     * then finds communities that reference those tags.
     */
    filterCommunitiesByCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
                    throw new customError_error_1.ValidationError("Invalid Category ID", "category");
                }
                const communities = yield this.communityRepository.filterCommunitiesByCategory(categoryId);
                if (!communities || communities.length === 0) {
                    throw new customError_error_1.NotFoundError("No communities found for the given category", "community");
                }
                return communities;
            }
            catch (error) {
                throw new Error(`Error filtering communities by category: ${error.message}`);
            }
        });
    }
    /**
     * List all Tags.
     */
    getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.communityRepository.getTags();
            }
            catch (error) {
                throw new Error(`Error listing tags: ${error.message}`);
            }
        });
    }
    getTagById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.communityRepository.getTagById(id);
            }
            catch (error) {
                throw new Error(`Error finding tag: ${error.message}`);
            }
        });
    }
    /**
     * List all Categories.
     */
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.communityRepository.getCategories();
            }
            catch (error) {
                throw new Error(`Error listing categories: ${error.message}`);
            }
        });
    }
}
exports.CommunityUseCase = CommunityUseCase;
