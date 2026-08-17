import { Types } from 'mongoose';
import { IChannelRepository } from '../interfaces/repository/IChannel.repository.interface';
import { IChannel } from '../entity/Channel.entity';
import { UnauthorizedError, NotFoundError, ValidationError, CustomError } from '../errors/customError.error';
import { channelValidator } from '../framework/utils/validators/channel.validator';
import { IRoleRepository } from '../interfaces/repository/IRole.repository.interface';
import IRBACService from '../interfaces/utils/IRBAC.service';
import IChannelUsecase from '../interfaces/usecase/IChannel.usecase.interface';
import { IChatRepository } from '../interfaces/repository/IChat.repository.interface';
import { ICommunityRepository } from '../interfaces/repository/ICommunity.repository.interface';
import { userHasChannelAccess } from '../framework/utils/channelAccess.util';

export class ChannelUseCase implements IChannelUsecase{
  constructor(
    private channelRepository: IChannelRepository,
    private roleRepository: IRoleRepository,
    private rbacService: IRBACService,
    private chatRepository: IChatRepository,
    private communityRepository: ICommunityRepository
  ) { }

  /**
   * Create a new channel.
   * Optionally, you could require RBAC checks here as well.
   */
  async createChannel(data: Partial<IChannel>, userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IChannel> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      // Check if the user has permission to create a channel.
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
      if (!allowed) throw new UnauthorizedError("Permission denied", "channel");

      const createdBy = userId.toString()

      // ✅ Validate input data using Zod
      const validatedData = channelValidator.parse({ createdBy , ...data });

      const createdChannel = await this.channelRepository.createChannel({communityId, ...validatedData});
      if (!createdChannel) {
        throw new CustomError({ statusCode: 500, message: "Failed to create channel", errorField: "channel" });
      }
      if (
        (createdChannel.type === "chatroom" || createdChannel.type === "voiceroom") &&
        createdChannel._id
      ) {
        const cid = createdChannel._id.toString();
        const existingChat = await this.chatRepository.findChatById(cid);
        if (!existingChat) {
          await this.chatRepository.createChat({ chatId: cid, type: "group" });
        }
      }
      return createdChannel;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error creating channel: ${error.message}`);
    }
  }

  /**
   * Get a channel by its ID. Only members of the channel's community with
   * access to that channel's allowedRoles may view it.
   */
  async getChannelById(userId: Types.ObjectId, id: Types.ObjectId): Promise<IChannel> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid channel ID", "channel");
      }
      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }
      const channel = await this.channelRepository.getChannelById(id);
      if (!channel) {
        throw new NotFoundError("Channel not found", "channel");
      }
      if (!(await userHasChannelAccess(userId, channel, this.communityRepository))) {
        throw new UnauthorizedError("Permission denied", "channel");
      }
      return channel;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error fetching channel: ${error.message}`);
    }
  }

  /**
   * Get accessible channels for a given community based on the user's role IDs.
   */
  async getAccessibleChannels(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<{ [key in 'info' | 'chatroom' | 'voice']?: IChannel[] }> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const userRoles = await this.roleRepository.getUserRoles(userId, communityId);
      if (!userRoles || userRoles.length === 0) {
        throw new NotFoundError("User has no roles in this community", "role");
      }

      const userRoleIds = userRoles
        .map(role => role._id)
        .filter((id): id is Types.ObjectId => Boolean(id));


      const groupedChannels = await this.channelRepository.getAccessibleChannels(communityId, userRoleIds);
      return groupedChannels;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error fetching accessible channels: ${error.message}`);
    }
  }


  /**
   * Search accessible channels by name (case-insensitive) for a specific community and user.
   */
  async searchAccessibleChannels(communityId: Types.ObjectId, userId: Types.ObjectId, searchTerm: string): Promise<IChannel[]> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const userRoles = await this.roleRepository.getUserRoles(userId, communityId);
      if (!userRoles || userRoles.length === 0) {
        throw new NotFoundError("User has no roles in this community", "role");
      }

      const userRoleIds = userRoles
        .map(role => role._id)
        .filter((id): id is Types.ObjectId => Boolean(id));

      const channels = await this.channelRepository.searchAccessibleChannels(communityId, userRoleIds, searchTerm);
      if (!channels || channels.length === 0) {
        throw new NotFoundError("No channels found", "channel");
      }
      return channels;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error searching channels: ${error.message}`);
    }
  }


  /**
   * Update a channel.
   * Only allowed for users with the "MANAGE_CHANNELS" permission.
   */
  async updateChannel(userId: Types.ObjectId, communityId: Types.ObjectId, channelId: Types.ObjectId, data: Partial<IChannel>): Promise<IChannel> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      if (!Types.ObjectId.isValid(channelId)) {
        throw new ValidationError("Invalid channel ID", "channel");
      }
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
      if (!allowed) throw new UnauthorizedError("Permission denied", "channel");

      const channel = await this.channelRepository.getChannelById(channelId);
      if(!channel){
        throw new NotFoundError("Channel not found", "channel");
      }
      const createdBy = channel.createdBy.toString()

      // ✅ Validate input data using Zod
      const validatedData = channelValidator.parse({createdBy,...data});

      const updatedChannel = await this.channelRepository.updateChannel(channelId, validatedData);
      if (!updatedChannel) {
        throw new NotFoundError("Channel not found or update failed", "channel");
      }
      return updatedChannel;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error updating channel: ${error.message}`);
    }
  }

  /**
   * Delete a channel.
   * Only allowed for users with the "MANAGE_CHANNELS" permission.
   */
  async deleteChannel(userId: Types.ObjectId, communityId: Types.ObjectId, channelId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      if (!Types.ObjectId.isValid(channelId)) {
        throw new ValidationError("Invalid channel ID", "channel");
      }
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_CHANNELS");
      if (!allowed) throw new UnauthorizedError("Permission denied", "channel");

      const result = await this.channelRepository.deleteChannel(channelId);
      if (!result) {
        throw new NotFoundError("Channel not found or deletion failed", "channel");
      }
      return result;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error deleting channel: ${error.message}`);
    }
  }


}
