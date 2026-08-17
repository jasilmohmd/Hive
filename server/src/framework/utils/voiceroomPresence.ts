import { Server, Socket } from "socket.io";
import { ChannelRepository } from "../../repositories/channel.repository";
import { CommunityRepository } from "../../repositories/community.repository";
import { assertVoiceroomChannelAccess } from "./channelAccess.util";
import Users from "../models/user.model";

export interface IVoiceroomParticipant {
  userId: string;
  userName: string;
  imageUrl?: string;
  muted: boolean;
  cameraOn: boolean;
  screenOn: boolean;
}

const channelPresence = new Map<string, Map<string, IVoiceroomParticipant>>();

function channelRoom(channelId: string): string {
  return `channel:${channelId}`;
}

export function getChannelPresenceList(channelId: string): IVoiceroomParticipant[] {
  const map = channelPresence.get(channelId);
  if (!map) return [];
  return Array.from(map.values());
}

function broadcastState(io: Server, channelId: string): void {
  io.to(channelRoom(channelId)).emit("room:state", {
    channelId,
    participants: getChannelPresenceList(channelId),
  });
}

const channelRepository = new ChannelRepository();
const communityRepository = new CommunityRepository();

export function registerVoiceroomPresence(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    socket.on("disconnect", () => {
      for (const [channelId, map] of channelPresence.entries()) {
        if (map.delete(userId)) {
          if (map.size === 0) channelPresence.delete(channelId);
          broadcastState(io, channelId);
        }
      }
    });

    socket.on("room:watch", async (data: { channelId?: string }) => {
      try {
        if (!data?.channelId) return;
        await assertVoiceroomChannelAccess(
          userId,
          data.channelId,
          channelRepository,
          communityRepository
        );
        socket.join(channelRoom(data.channelId));
        socket.emit("room:state", {
          channelId: data.channelId,
          participants: getChannelPresenceList(data.channelId),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not watch room";
        socket.emit("room:error", { message });
      }
    });

    socket.on("room:unwatch", (data: { channelId?: string }) => {
      if (!data?.channelId) return;
      socket.leave(channelRoom(data.channelId));
    });

    socket.on("room:join", async (data: { channelId?: string; muted?: boolean }) => {
      try {
        if (!data?.channelId) return;
        await assertVoiceroomChannelAccess(
          userId,
          data.channelId,
          channelRepository,
          communityRepository
        );
        socket.join(channelRoom(data.channelId));
        let map = channelPresence.get(data.channelId);
        if (!map) {
          map = new Map();
          channelPresence.set(data.channelId, map);
        }
        const user = await Users.findById(userId).select("userName imageUrl").lean();
        const row = user as { userName?: string; imageUrl?: string } | null;
        const existing = map.get(userId);
        map.set(userId, {
          userId,
          userName:
            row && typeof row.userName === "string" ? row.userName : "User",
          imageUrl:
            row && typeof row.imageUrl === "string" ? row.imageUrl : undefined,
          muted: !!data.muted,
          cameraOn: existing?.cameraOn ?? false,
          screenOn: existing?.screenOn ?? false,
        });
        broadcastState(io, data.channelId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not join room";
        socket.emit("room:error", { message });
      }
    });

    socket.on("room:leave", (data: { channelId?: string }) => {
      if (!data?.channelId) return;
      const map = channelPresence.get(data.channelId);
      if (map?.delete(userId)) {
        if (map.size === 0) channelPresence.delete(data.channelId);
      }
      /* Stay in channel room if still watching lobby — only room:unwatch leaves */
      broadcastState(io, data.channelId);
    });

    socket.on("room:mute", (data: { channelId?: string; muted?: boolean }) => {
      if (!data?.channelId) return;
      const map = channelPresence.get(data.channelId);
      const p = map?.get(userId);
      if (!p) return;
      p.muted = !!data.muted;
      broadcastState(io, data.channelId);
    });

    socket.on(
      "room:media",
      (data: { channelId?: string; cameraOn?: boolean; screenOn?: boolean }) => {
        if (!data?.channelId) return;
        const map = channelPresence.get(data.channelId);
        const p = map?.get(userId);
        if (!p) return;
        if (data.cameraOn !== undefined) p.cameraOn = !!data.cameraOn;
        if (data.screenOn !== undefined) p.screenOn = !!data.screenOn;
        broadcastState(io, data.channelId);
      }
    );
  });
}
