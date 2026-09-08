import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { IChannel } from "../entity/Channel.entity";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import IChannelController from "../interfaces/controllers/IChannel.controller.interface";
import IChannelUsecase from "../interfaces/usecase/IChannel.usecase.interface";
import StatusCodes from "../constants/auth/statusCodes";


/**
 * Parse a route param into an ObjectId. On a missing or malformed value it
 * sends a 400 and returns null so the caller can `return` early. Guards the
 * raw string before construction, since `new Types.ObjectId()` mints a
 * random id for `undefined` and throws for other malformed input.
 */
function parseObjectId(res: Response, raw: unknown, label: string): Types.ObjectId | null {
  if (typeof raw !== "string" || !Types.ObjectId.isValid(raw)) {
    res.status(StatusCodes.BadRequest).json({ error: `Invalid or missing ${label}` });
    return null;
  }
  return new Types.ObjectId(raw);
}


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

      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "community ID");
      if (!communityId) return;

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

      const channelId = parseObjectId(res, req.params.id, "channel ID");
      if (!channelId) return;

      const channel = await this.channelUseCase.getChannelById(userId, channelId);
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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "community ID");
      if (!communityId) return;

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

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }

      const communityId = parseObjectId(res, req.params.communityId, "community ID");
      if (!communityId) return;

      const { searchTerm } = req.query;
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
      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }

      const channelId = parseObjectId(res, req.params.channelId, "channel ID");
      if (!channelId) return;

      const communityId = parseObjectId(res, req.params.communityId, "community ID");
      if (!communityId) return;

      const { ...data } = req.body.data;

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
      const userId = req.userId!;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }

      const channelId = parseObjectId(res, req.params.channelId, "channel ID");
      if (!channelId) return;

      const communityId = parseObjectId(res, req.params.communityId, "community ID");
      if (!communityId) return;

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
