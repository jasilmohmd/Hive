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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
class ChannelController {
    constructor(channelUseCase) {
        this.channelUseCase = channelUseCase;
    }
    /**
     * Create a new channel.
     * Expects channel data and a communityId in req.body.
     * The authenticated user’s ID is assumed to be in req.userId.
     */
    createChannel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelData = __rest(req.body.data, []);
                console.log(channelData);
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid or missing community ID" });
                    return;
                }
                const createdChannel = yield this.channelUseCase.createChannel(channelData, userId, communityId);
                res.status(statusCodes_1.default.Created).json(createdChannel);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get a channel by its ID.
     */
    getChannelById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid channel ID" });
                    return;
                }
                const channel = yield this.channelUseCase.getChannelById(new mongoose_1.Types.ObjectId(id));
                res.status(statusCodes_1.default.Success).json(channel);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get accessible channels for a specific community.
     * Expects communityId in req.params.
     */
    getAccessibleChannels(req, res, next) {
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
                const groupedChannels = yield this.channelUseCase.getAccessibleChannels(communityId, userId);
                res.status(statusCodes_1.default.Success).json({ groupedChannels });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Search accessible channels by name.
     * Expects communityId and searchTerm as query parameters.
     */
    searchAccessibleChannels(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                const { searchTerm } = req.query;
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (typeof communityId !== "string" || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid community ID" });
                    return;
                }
                if (!searchTerm || typeof searchTerm !== "string") {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid search term" });
                    return;
                }
                const channels = yield this.channelUseCase.searchAccessibleChannels(communityId, userId, searchTerm);
                res.status(statusCodes_1.default.Success).json(channels);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update a channel.
     * Expects the channel ID in req.params and communityId in req.body.
     */
    updateChannel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelId = new mongoose_1.Types.ObjectId(req.params.channelId); // channel ID
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                const data = __rest(req.body.data, []);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!channelId || !mongoose_1.Types.ObjectId.isValid(channelId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid channel ID" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid or missing community ID" });
                    return;
                }
                const updatedChannel = yield this.channelUseCase.updateChannel(userId, communityId, channelId, data);
                res.status(statusCodes_1.default.Success).json(updatedChannel);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a channel.
     * Expects the channel ID in req.params and communityId in req.body.
     */
    deleteChannel(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelId = new mongoose_1.Types.ObjectId(req.params.channelId); // channel ID
                const userId = req.userId;
                const communityId = new mongoose_1.Types.ObjectId(req.params.communityId);
                if (!userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ error: "Unauthorized" });
                    return;
                }
                if (!channelId || !mongoose_1.Types.ObjectId.isValid(channelId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid channel ID" });
                    return;
                }
                if (!communityId || !mongoose_1.Types.ObjectId.isValid(communityId)) {
                    res.status(statusCodes_1.default.BadRequest).json({ error: "Invalid or missing community ID" });
                    return;
                }
                const result = yield this.channelUseCase.deleteChannel(userId, communityId, channelId);
                res.status(statusCodes_1.default.Success).json({ success: result });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = ChannelController;
