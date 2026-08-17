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
class CommunityController {
    constructor(communityUsecase) {
        this.communityUsecase = communityUsecase;
    }
    // POST /communities
    createCommunity(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                const { name, description, type, tags, imageUrl, coverImageUrl } = req.body.data;
                console.log(req.body.data);
                const community = yield this.communityUsecase.createCommunity({
                    name,
                    description,
                    type,
                    imageUrl,
                    coverImageUrl,
                    ownerId: userId.toString(),
                    tags,
                });
                res.status(statusCodes_1.default.Created).json({ community });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /communities/:id
    getCommunityById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Validate that id is a valid 24-character hex string
                if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9A-Fa-f]+$/.test(id)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid Community ID" });
                    return;
                }
                const communityId = new mongoose_1.Types.ObjectId(id);
                const community = yield this.communityUsecase.getCommunityById(communityId);
                res.status(statusCodes_1.default.Success).json({ community });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /communities/search?searchTerm=...
    searchCommunities(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { searchTerm } = req.query;
                if (typeof searchTerm !== "string") {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid search term" });
                    return;
                }
                const communities = yield this.communityUsecase.searchCommunitiesByName(searchTerm);
                res.status(statusCodes_1.default.Success).json({ communities });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // PUT /communities/:id
    updateCommunity(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = req.body;
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const updatedCommunity = yield this.communityUsecase.updateCommunity(userId, communityId, data);
                res.status(statusCodes_1.default.Success).json({ updatedCommunity });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // DELETE /communities/:id
    deleteCommunity(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.deleteCommunity(userId, communityId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /communities
    listCommunities(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const communities = yield this.communityUsecase.listCommunities();
                res.status(statusCodes_1.default.Success).json({ communities });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /users/:userId/communities OR use req.user
    getCommunitiesByUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                const communities = yield this.communityUsecase.getCommunitiesByUser(userId);
                res.status(statusCodes_1.default.Success).json({ communities });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/:communityId/request
    requestToJoinCommunity(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.requestToJoinCommunity(communityId, userId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/join/approve
    approveJoinRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memberId = new mongoose_1.Types.ObjectId(String(req.body.memberId));
                const roleId = new mongoose_1.Types.ObjectId(String(req.body.roleId));
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                if (!memberId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Member ID is required" });
                    return;
                }
                if (!roleId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Role ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.approveJoinRequest(communityId, userId, memberId, roleId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/join/reject
    rejectJoinRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memberId = new mongoose_1.Types.ObjectId(String(req.body.memberId));
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.rejectJoinRequest(communityId, userId, memberId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/:communityId/leave
    leaveCommunity(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.leaveCommunity(communityId, userId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/member/add
    addMember(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memberId = new mongoose_1.Types.ObjectId(String(req.body.memberId));
                const roleId = new mongoose_1.Types.ObjectId(String(req.body.roleId));
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.addMember(userId, communityId, memberId, roleId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/member/remove
    removeMember(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const memberId = new mongoose_1.Types.ObjectId(String(req.body.memberId));
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const result = yield this.communityUsecase.removeMember(communityId, userId, memberId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // POST /communities/:communityId/tag/:tagId
    addTag(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const tagId = new mongoose_1.Types.ObjectId(req.params.tagId);
                const result = yield this.communityUsecase.addTag(userId, communityId, tagId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // DELETE /communities/:communityId/tag/:tagId
    removeTag(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!communityId) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Community ID is required" });
                    return;
                }
                const tagId = new mongoose_1.Types.ObjectId(req.params.tagId);
                const result = yield this.communityUsecase.removeTag(userId, communityId, tagId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /communities/tag/:tagId
    filterCommunitiesByTag(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tagId = new mongoose_1.Types.ObjectId(req.params.tagId);
                const communities = yield this.communityUsecase.filterCommunitiesByTag(tagId);
                res.status(statusCodes_1.default.Success).json({ communities });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /communities/category/:categoryId
    filterCommunitiesByCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const categoryId = new mongoose_1.Types.ObjectId(req.params.categoryId);
                const communities = yield this.communityUsecase.filterCommunitiesByCategory(categoryId);
                res.status(statusCodes_1.default.Success).json({ communities });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /all categories
    getCategories(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const categories = yield this.communityUsecase.getCategories();
                res.status(statusCodes_1.default.Success).json({ categories });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /All Tags
    getAllTags(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tags = yield this.communityUsecase.getAllTags();
                if (!tags || tags.length === 0) {
                    res.status(statusCodes_1.default.NotFound).json({ message: "No tags found" });
                    return;
                }
                res.status(statusCodes_1.default.Success).json({ tags });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // GET /tag by Id
    getTagById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const tag = yield this.communityUsecase.getTagById(new mongoose_1.Types.ObjectId(id));
                if (!tag) {
                    res.status(statusCodes_1.default.NotFound).json({ message: "No tag found" });
                    return;
                }
                res.status(statusCodes_1.default.Success).json({ tag });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = CommunityController;
