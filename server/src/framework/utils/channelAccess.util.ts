import { Types } from "mongoose";
import { IChannel } from "../../entity/Channel.entity";
import { IChannelRepository } from "../../interfaces/repository/IChannel.repository.interface";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";

function communityObjectId(channel: IChannel): Types.ObjectId {
  const c = channel.communityId as unknown;
  if (c instanceof Types.ObjectId) return c;
  if (c && typeof c === "object" && "_id" in (c as object)) {
    return new Types.ObjectId(String((c as { _id: Types.ObjectId })._id));
  }
  return new Types.ObjectId(String(c));
}

export async function userHasChannelAccess(
  userId: Types.ObjectId,
  channel: IChannel,
  communityRepository: ICommunityRepository
): Promise<boolean> {
  const communityId = communityObjectId(channel);
  const userRoleIds = await communityRepository.getUserRoles(communityId, userId);
  return channel.allowedRoles.some((ar) => userRoleIds.some((ur) => ur.equals(ar)));
}

export async function assertVoiceroomChannelAccess(
  userId: string,
  channelId: string,
  channelRepository: IChannelRepository,
  communityRepository: ICommunityRepository
): Promise<{ channel: IChannel; maxParticipants: number }> {
  if (!Types.ObjectId.isValid(channelId)) {
    throw new Error("Invalid channel ID");
  }
  const channel = await channelRepository.getChannelById(new Types.ObjectId(channelId));
  if (!channel) {
    throw new Error("Channel not found");
  }
  if (channel.type !== "voiceroom") {
    throw new Error("Channel is not a voice room");
  }
  const userOid = new Types.ObjectId(userId);
  if (!(await userHasChannelAccess(userOid, channel, communityRepository))) {
    throw new Error("Unauthorized to join this voice room");
  }
  const cap = Math.min(6, channel.maxParticipants ?? 6);
  return { channel, maxParticipants: cap };
}
