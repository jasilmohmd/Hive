
import { Types } from 'mongoose';
import { IChannelRepository } from '../interfaces/repository/IChannel.repository.interface';
import { IChannel } from '../entity/Channel.entity';
import { ChannelModel } from '../framework/models/channel.model';
import { CommunityModel } from '../framework/models/community.model';

interface GroupResult {
  _id: 'info' | 'chatroom' | 'voiceroom';
  channels: IChannel[];
}

export class ChannelRepository implements IChannelRepository {
  async createChannel(data: IChannel): Promise<IChannel> {
    const communityId = data.communityId;

    // Find the community
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      throw new Error("Community not found");
    }

    // Create the channel
    const channel = new ChannelModel(data);
    const savedChannel = await channel.save();

    // Update the community's channels array with the new channel ID
    community.channels.push(channel._id);
    await community.save();

    return savedChannel;
  }

  async getChannelById(id: Types.ObjectId): Promise<IChannel | null> {
    return await ChannelModel.findById(id).populate('communityId');
  }



  async getAccessibleChannels(
    communityId: Types.ObjectId,
    userRoleIds: Types.ObjectId[]
  ): Promise<{ [key in 'info' | 'chatroom' | 'voiceroom']?: IChannel[] }> {
    const result = await ChannelModel.aggregate([
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
    ]) as GroupResult[];

    const grouped: { [key in 'info' | 'chatroom' | 'voiceroom']?: IChannel[] } = {};
    result.forEach((group: GroupResult) => {
      grouped[group._id] = group.channels;
    });
    return grouped;
  }

  /**
 * Search accessible channels by name (case-insensitive).
 */
  async searchAccessibleChannels(communityId: Types.ObjectId, userRoleIds: Types.ObjectId[], searchTerm: string): Promise<IChannel[]> {
    return await ChannelModel.find({
      communityId: new Types.ObjectId(communityId),
      allowedRoles: { $in: userRoleIds },
      name: { $regex: searchTerm, $options: 'i' }
    })
      .populate('communityId')
      .populate('createdBy')
      .populate('allowedRoles');
  }

  async updateChannel(id: Types.ObjectId, data: Partial<IChannel>): Promise<IChannel | null> {
    return await ChannelModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteChannel(id: Types.ObjectId): Promise<boolean> {
    const result = await ChannelModel.findByIdAndDelete(id);
    return result ? true : false;
  }
}
