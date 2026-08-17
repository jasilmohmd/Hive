import { Types } from "mongoose";
import { IChannel } from "../../entity/Channel.entity";

export interface IChannelRepository {
  createChannel(data: IChannel): Promise<IChannel>;
  getChannelById(id: Types.ObjectId): Promise<IChannel | null>;
  getAccessibleChannels(communityId: Types.ObjectId, userRoleIds: Types.ObjectId[]): Promise<{ [key in 'info' | 'chatroom' | 'voice']?: IChannel[] }>;
  searchAccessibleChannels(communityId: Types.ObjectId, userRoleIds: Types.ObjectId[], searchTerm: string): Promise<IChannel[]>;
  updateChannel(id: Types.ObjectId, data: Partial<IChannel>): Promise<IChannel | null>;
  deleteChannel(id: Types.ObjectId): Promise<boolean>;
}
