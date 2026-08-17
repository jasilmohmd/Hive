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

/**
 * Tracks which sockets a user has joined a given channel's voiceroom with,
 * so a user with multiple open tabs isn't dropped from presence when only
 * one of their sockets disconnects or leaves.
 */
const channelUserSockets = new Map<string, Map<string, Set<string>>>();
/** Reverse index: which channels a given socket has joined, for fast cleanup on disconnect. */
const socketChannels = new Map<string, Set<string>>();

function trackUserSocket(channelId: string, userId: string, socketId: string): void {
  let userMap = channelUserSockets.get(channelId);
  if (!userMap) {
    userMap = new Map();
    channelUserSockets.set(channelId, userMap);
  }
  let sockets = userMap.get(userId);
  if (!sockets) {
    sockets = new Set();
    userMap.set(userId, sockets);
  }
  sockets.add(socketId);

  let channels = socketChannels.get(socketId);
  if (!channels) {
    channels = new Set();
    socketChannels.set(socketId, channels);
  }
  channels.add(channelId);
}

/** Untracks this socket for the channel; returns true if it was the user's last socket there. */
function untrackUserSocket(channelId: string, userId: string, socketId: string): boolean {
  const userMap = channelUserSockets.get(channelId);
  const sockets = userMap?.get(userId);
  socketChannels.get(socketId)?.delete(channelId);

  if (!sockets) return true;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userMap!.delete(userId);
    if (userMap!.size === 0) channelUserSockets.delete(channelId);
    return true;
  }
  return false;
}

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
      const channels = socketChannels.get(socket.id);
      if (!channels) return;
      for (const channelId of [...channels]) {
        const wasLastSocket = untrackUserSocket(channelId, userId, socket.id);
        if (!wasLastSocket) continue; // user still connected via another tab/socket
        const map = channelPresence.get(channelId);
        if (map?.delete(userId)) {
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
        trackUserSocket(data.channelId, userId, socket.id);
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
      const wasLastSocket = untrackUserSocket(data.channelId, userId, socket.id);
      if (wasLastSocket) {
        const map = channelPresence.get(data.channelId);
        if (map?.delete(userId)) {
          if (map.size === 0) channelPresence.delete(data.channelId);
        }
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
