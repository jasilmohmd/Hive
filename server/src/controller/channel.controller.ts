import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { IChannel } from "../entity/Channel.entity";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import IChannelController from "../interfaces/controllers/IChannel.controller.interface";
import IChannelUsecase from "../interfaces/usecase/IChannel.usecase.interface";
import StatusCodes from "../constants/auth/statusCodes";


export default class ChannelController implements IChannelController {
  constructor(private channelUseCase: IChannelUsecase) {}

  /**
   * Create a new channel.
   * Expects channel data and a communityId in req.body.
   * The authenticated user’s ID is assumed to be in req.userId.
   */
  public async createChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const { ...channelData } = req.body.data as Partial<IChannel>;

      console.log(channelData);
      

      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid or missing community ID" });
        return;
      }
      const createdChannel = await this.channelUseCase.createChannel(
        channelData as Partial<IChannel>,
        userId,
        communityId
      );
      res.status(StatusCodes.Created).json(createdChannel);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get a channel by its ID.
   */
  public async getChannelById(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid channel ID" });
        return;
      }
      const channel = await this.channelUseCase.getChannelById(userId, new Types.ObjectId(id));
      res.status(StatusCodes.Success).json(channel);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get accessible channels for a specific community.
   * Expects communityId in req.params.
   */
  public async getAccessibleChannels(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      const groupedChannels = await this.channelUseCase.getAccessibleChannels(
        communityId,
        userId
      );
      res.status(StatusCodes.Success).json({groupedChannels});
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Search accessible channels by name.
   * Expects communityId and searchTerm as query parameters.
   */
  public async searchAccessibleChannels(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      const { searchTerm } = req.query;
      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (typeof communityId !== "string" || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      if (!searchTerm || typeof searchTerm !== "string") {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid search term" });
        return;
      }
      const channels = await this.channelUseCase.searchAccessibleChannels(
        communityId,
        userId,
        searchTerm
      );
      res.status(StatusCodes.Success).json(channels);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update a channel.
   * Expects the channel ID in req.params and communityId in req.body.
   */
  public async updateChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const channelId = new Types.ObjectId(req.params.channelId); // channel ID
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      const { ...data } = req.body.data;
      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!channelId || !Types.ObjectId.isValid(channelId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid channel ID" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid or missing community ID" });
        return;
      }
      const updatedChannel = await this.channelUseCase.updateChannel(
        userId,
        communityId,
        channelId,
        data
      );
      res.status(StatusCodes.Success).json(updatedChannel);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete a channel.
   * Expects the channel ID in req.params and communityId in req.body.
   */
  public async deleteChannel(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const channelId = new Types.ObjectId(req.params.channelId); // channel ID
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId)

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!channelId || !Types.ObjectId.isValid(channelId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid channel ID" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid or missing community ID" });
        return;
      }
      const result = await this.channelUseCase.deleteChannel(
        userId,
        communityId,
        channelId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error: any) {
      next(error);
    }
  }
}
