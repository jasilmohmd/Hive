import { Types } from "mongoose";
import { IChannelRepository } from "../interfaces/repository/IChannel.repository.interface";
import { ICommunityRepository } from "../interfaces/repository/ICommunity.repository.interface";
import { assertVoiceroomChannelAccess } from "../framework/utils/channelAccess.util";
import { loadLiveKitSdk } from "../framework/utils/livekitSdk.js";
import {
  getChannelPresenceList,
  IVoiceroomParticipant,
} from "../framework/utils/voiceroomPresence";
import Users from "../framework/models/user.model";

function livekitApiHost(): string {
  const raw = process.env.LIVEKIT_URL?.trim() ?? "";
  if (!raw) throw new Error("LiveKit is not configured");
  return raw.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
}

export class VoiceroomUseCase {
  constructor(
    private channelRepository: IChannelRepository,
    private communityRepository: ICommunityRepository
  ) {}

  async createJoinToken(
    userId: string,
    channelId: string
  ): Promise<{ token: string; livekitUrl: string; maxParticipants: number }> {
    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
    const livekitUrl = process.env.LIVEKIT_URL?.trim();
    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error("LiveKit is not configured on the server");
    }

    const { maxParticipants } = await assertVoiceroomChannelAccess(
      userId,
      channelId,
      this.channelRepository,
      this.communityRepository
    );

    const { AccessToken, RoomServiceClient } = await loadLiveKitSdk();
    const host = livekitApiHost();
    const roomService = new RoomServiceClient(host, apiKey, apiSecret);
    try {
      const participants = await roomService.listParticipants(channelId);
      if (participants.length >= maxParticipants) {
        const err = new Error("Voice room is full");
        (err as Error & { statusCode?: number }).statusCode = 403;
        throw err;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("not found") || msg.includes("does not exist")) {
        /* room will be created on first join */
      } else if ((e as Error & { statusCode?: number }).statusCode === 403) {
        throw e;
      }
    }

    const user = await Users.findById(userId).select("userName").lean();
    const displayName =
      user && typeof (user as { userName?: string }).userName === "string"
        ? (user as { userName: string }).userName
        : "User";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName,
      ttl: "2h",
    });
    at.addGrant({
      roomJoin: true,
      room: channelId,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await at.toJwt(),
      livekitUrl,
      maxParticipants,
    };
  }

  async getPresence(
    userId: string,
    channelId: string
  ): Promise<{ participants: IVoiceroomParticipant[]; maxParticipants: number }> {
    const { maxParticipants } = await assertVoiceroomChannelAccess(
      userId,
      channelId,
      this.channelRepository,
      this.communityRepository
    );
    return {
      participants: getChannelPresenceList(channelId),
      maxParticipants,
    };
  }
}
