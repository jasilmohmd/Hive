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
exports.CommunityRepository = void 0;
const mongoose_1 = require("mongoose");
const community_model_1 = require("../framework/models/community.model");
const tag_model_1 = require("../framework/models/tag.model");
const communityCategory_model_1 = require("../framework/models/communityCategory.model");
class CommunityRepository {
    createCommunity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = new community_model_1.CommunityModel(data);
            return yield community.save();
        });
    }
    getCommunityById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.findById(id)
                .populate('ownerId roles channels members.userId members.roleIds tags'));
        });
    }
    getCommunityByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.findOne({ name })
                .populate('roles channels members.userId members.roleIds tags'));
        });
    }
    getAllCommunities() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.find()
                .populate('roles channels members.userId members.roleIds tags'));
        });
    }
    /**
     * Get all communities a user is a member of.
     */
    getCommunitiesByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.find({
                "members.userId": userId
            }).populate('roles channels members.userId members.roleIds tags'));
        });
    }
    /**
     * Search communities by name.
     * Returns communities whose names match the search term (case-insensitive).
     */
    searchCommunities(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.find({
                name: { $regex: searchTerm, $options: 'i' } // Case-insensitive search.
            }).populate('roles channels members.userId members.roleIds tags'));
        });
    }
    addJoinRequest(communityId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community)
                return false;
            if (community.joinRequests.includes(userId)) {
                return false; // User already requested to join
            }
            community.joinRequests.push(userId);
            yield community.save();
            return true;
        });
    }
    removeJoinRequest(communityId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield community_model_1.CommunityModel.updateOne({ _id: communityId }, { $pull: { joinRequests: userId } });
            return result.modifiedCount > 0;
        });
    }
    getJoinRequests(communityId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield community_model_1.CommunityModel.findById(communityId);
            return community ? community.joinRequests : [];
        });
    }
    approveJoinRequest(communityId, userId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community)
                return false;
            // Ensure the user has a pending request
            if (!community.joinRequests.includes(userId))
                return false;
            // Add the user to members and remove from joinRequests
            community.members.push({
                userId: userId,
                roleIds: [roleId],
            });
            community.joinRequests = community.joinRequests.filter(id => !id.equals(userId));
            yield community.save();
            return true;
        });
    }
    updateCommunity(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.findByIdAndUpdate(id, data, { new: true }));
        });
    }
    deleteCommunity(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield community_model_1.CommunityModel.findByIdAndDelete(id);
            return result ? true : false;
        });
    }
    getUserRoles(communityId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield this.getCommunityById(communityId);
            if (!community)
                return [];
            return community.members
                .filter(member => member.userId.equals(userId))
                .flatMap(member => member.roleIds);
        });
    }
    addMember(communityId, userId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield this.getCommunityById(communityId);
            if (!community)
                return false;
            // Prevent adding the same member twice.
            if (community.members.some(member => member.userId === userId))
                return false;
            community.members.push({
                userId: userId,
                roleIds: [roleId],
            });
            yield community.save();
            return true;
        });
    }
    removeMember(communityId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield this.getCommunityById(communityId);
            if (!community)
                return false;
            const initialLength = community.members.length;
            community.members = community.members.filter(member => member.userId !== userId);
            yield community.save();
            return community.members.length < initialLength;
        });
    }
    /**
     * Add a tag to a community.
     */
    addTag(communityId, tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield this.getCommunityById(communityId);
            if (!community)
                return false;
            // Check if the tag already exists.
            if (community.tags.some(t => t === tagId))
                return false;
            community.tags.push(new mongoose_1.Types.ObjectId(tagId));
            yield community.save();
            return true;
        });
    }
    /**
     * Remove a tag from a community.
     */
    removeTag(communityId, tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            const community = yield this.getCommunityById(communityId);
            if (!community)
                return false;
            const initialLength = community.tags.length;
            community.tags = community.tags.filter(t => t !== tagId);
            yield community.save();
            return community.tags.length < initialLength;
        });
    }
    /**
    * Filter communities by a specific tag.
    */
    filterCommunitiesByTag(tagId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield community_model_1.CommunityModel.find({
                tags: { $in: [tagId] }
            }).populate('roles channels members.userId members.roleIds tags'));
        });
    }
    /**
     * Filter communities by category.
     * Since categories are stored in Tag documents, first retrieve all tags having the category,
     * then find communities that reference any of those tags.
     */
    filterCommunitiesByCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Import TagModel to query tags.
            const tags = yield tag_model_1.TagModel.find({ categories: new mongoose_1.Types.ObjectId(categoryId) });
            const tagIds = tags.map(tag => tag._id);
            return (yield community_model_1.CommunityModel.find({ tags: { $in: tagIds } })
                .populate('roles channels members.userId members.roleId tags'));
        });
    }
    /**
    * Retrieve all tags.
    */
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tag_model_1.TagModel.find({});
        });
    }
    getTagById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tag_model_1.TagModel.findOne({ _id: id });
        });
    }
    /**
     * Retrieve all categories.
     */
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield communityCategory_model_1.CategoryModel.find({});
        });
    }
}
exports.CommunityRepository = CommunityRepository;
