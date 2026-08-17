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
exports.ChannelRepository = void 0;
const mongoose_1 = require("mongoose");
const channel_model_1 = require("../framework/models/channel.model");
const community_model_1 = require("../framework/models/community.model");
class ChannelRepository {
    createChannel(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const communityId = data.communityId;
            // Find the community
            const community = yield community_model_1.CommunityModel.findById(communityId);
            if (!community) {
                throw new Error("Community not found");
            }
            // Create the channel
            const channel = new channel_model_1.ChannelModel(data);
            const savedChannel = yield channel.save();
            // Update the community's channels array with the new channel ID
            community.channels.push(channel._id);
            yield community.save();
            return savedChannel;
        });
    }
    getChannelById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield channel_model_1.ChannelModel.findById(id).populate('communityId');
        });
    }
    getAccessibleChannels(communityId, userRoleIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield channel_model_1.ChannelModel.aggregate([
                {
                    $match: {
                        communityId: communityId,
                        allowedRoles: { $in: userRoleIds }
                    }
                },
                {
                    $group: {
                        _id: "$type", // Grouping by type
                        channels: { $push: "$$ROOT" }
                    }
                }
            ]);
            const grouped = {};
            result.forEach((group) => {
                grouped[group._id] = group.channels;
            });
            return grouped;
        });
    }
    /**
   * Search accessible channels by name (case-insensitive).
   */
    searchAccessibleChannels(communityId, userRoleIds, searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield channel_model_1.ChannelModel.find({
                communityId: new mongoose_1.Types.ObjectId(communityId),
                allowedRoles: { $in: userRoleIds },
                name: { $regex: searchTerm, $options: 'i' }
            })
                .populate('communityId')
                .populate('createdBy')
                .populate('allowedRoles');
        });
    }
    updateChannel(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield channel_model_1.ChannelModel.findByIdAndUpdate(id, data, { new: true });
        });
    }
    deleteChannel(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield channel_model_1.ChannelModel.findByIdAndDelete(id);
            return result ? true : false;
        });
    }
}
exports.ChannelRepository = ChannelRepository;
