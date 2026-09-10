import { Types } from "mongoose";
import { IChannel } from "../../entity/Channel.entity";
import { IChannelRepository } from "../../interfaces/repository/IChannel.repository.interface";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";
import IRBACService from "../../interfaces/utils/IRBAC.service";
import { PERMISSIONS } from "../../constants/permissions";

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
  communityRepository: ICommunityRepository,
  rbacService?: IRBACService
): Promise<boolean> {
  const communityId = communityObjectId(channel);
  const userRoleIds = await communityRepository.getUserRoles(communityId, userId);
  const inAllowedRole = channel.allowedRoles.some((ar) => userRoleIds.some((ur) => ur.equals(ar)));
  if (!inAllowedRole) return false;
  // A role also needs VIEW_CONTENT to see or enter any channel.
  if (rbacService) {
    return rbacService.hasPermission(userId, communityId, PERMISSIONS.VIEW_CONTENT);
  }
  return true;
}

export async function assertVoiceroomChannelAccess(
  userId: string,
  channelId: string,
  channelRepository: IChannelRepository,
  communityRepository: ICommunityRepository,
  rbacService?: IRBACService
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
  if (!(await userHasChannelAccess(userOid, channel, communityRepository, rbacService))) {
    throw new Error("Unauthorized to join this voice room");
  }
  const cap = Math.min(6, channel.maxParticipants ?? 6);
  return { channel, maxParticipants: cap };
}
