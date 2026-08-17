import { Types } from "mongoose";
import { IChannel } from "../../entity/Channel.entity";

export default interface IChannelUsecase {
  createChannel(data: Partial<IChannel>, userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IChannel>;
  getChannelById(userId: Types.ObjectId, id: Types.ObjectId): Promise<IChannel>;
  getAccessibleChannels(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<{ [key in 'info' | 'chatroom' | 'voice']?: IChannel[] }>;
  searchAccessibleChannels(communityId: Types.ObjectId, userId: Types.ObjectId, searchTerm: string): Promise<IChannel[]>;
  updateChannel(userId: Types.ObjectId, communityId: Types.ObjectId, channelId: Types.ObjectId, data: Partial<IChannel>): Promise<IChannel>;
  deleteChannel(userId: Types.ObjectId, communityId: Types.ObjectId, channelId: Types.ObjectId): Promise<boolean>;
}