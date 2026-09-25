import { Server, Socket } from "socket.io";
import { assertDirectChatFriends, parseDirectChatPeer } from "./directChatAuth.util";
import { IChatUseCase } from "../../interfaces/usecase/IChat.usecase.interface";
import {
  buildCallMessageContent,
  CallOutcome,
} from "./callMessageContent";

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended";

export interface ICallSession {
  callId: string;
  chatId: string;
  callerId: string;
  calleeId: string;
  callType: CallType;
  status: CallStatus;
  connectedAt?: number;
  /**
   * Per participant, the socket carrying the call (the tab that placed or
   * answered it). Unset for a callee whose phone is only ringing.
   */
  socketIds?: Record<string, string>;
}

const activeCalls = new Map<string, ICallSession>();
const userActiveCallId = new Map<string, string>();

/** An unanswered call gives up after this long and is logged as missed. */
export const RING_TIMEOUT_MS = 45_000;
/** A dropped socket gets this long to come back before its call is ended. */
export const DISCONNECT_GRACE_MS = 8_000;
const ringTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Client-generated call ids (crypto.randomUUID) — bounded and plain, and
 * never one already in use, so an invite can't overwrite a live session.
 */
export function isValidNewCallId(callId: unknown): callId is string {
  return (
    typeof callId === "string" &&
    callId.length > 0 &&
    callId.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(callId) &&
    !activeCalls.has(callId)
  );
}

function clearRingTimer(callId: string): void {
  const t = ringTimers.get(callId);
  if (t) {
    clearTimeout(t);
    ringTimers.delete(callId);
  }
}

function userHasSockets(io: Server, userId: string): boolean {
  const room = io.sockets.adapter.rooms.get(userRoom(userId));
  return !!room && room.size > 0;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function emitToUser(io: Server, userId: string, event: string, payload: unknown): void {
  io.to(userRoom(userId)).emit(event, payload);
}

function getPeerId(session: ICallSession, userId: string): string | null {
  if (session.callerId === userId) return session.calleeId;
  if (session.calleeId === userId) return session.callerId;
  return null;
}

function clearUserCall(userId: string, callId: string): void {
  if (userActiveCallId.get(userId) === callId) {
    userActiveCallId.delete(userId);
  }
}

function resolveCallOutcome(
  session: ICallSession,
  endedBy: string,
  reason: "end" | "reject"
): CallOutcome {
  if (reason === "reject") return "declined";
  if (session.connectedAt) return "completed";
  if (endedBy === session.callerId) return "cancelled";
  return "missed";
}

async function persistCallLog(
  io: Server,
  chatUseCase: IChatUseCase,
  session: ICallSession,
  outcome: CallOutcome,
  endedBy: string
): Promise<void> {
  const durationSeconds = session.connectedAt
    ? Math.max(0, Math.floor((Date.now() - session.connectedAt) / 1000))
    : 0;
  const content = buildCallMessageContent({
    callType: session.callType,
    outcome,
    durationSeconds,
    callerId: session.callerId,
    endedBy,
  });
  const message = await chatUseCase.sendMessage(
    session.callerId,
    session.chatId,
    content,
    "call"
  );
  io.to(session.chatId).emit("newMessage", message);
}

function endSession(io: Server, session: ICallSession, endedBy: string): void {
  session.status = "ended";
  clearRingTimer(session.callId);
  const payload = { callId: session.callId, chatId: session.chatId, endedBy };
  emitToUser(io, session.callerId, "call:ended", payload);
  emitToUser(io, session.calleeId, "call:ended", payload);
  clearUserCall(session.callerId, session.callId);
  clearUserCall(session.calleeId, session.callId);
  activeCalls.delete(session.callId);
}

async function finishCall(
  io: Server,
  chatUseCase: IChatUseCase,
  session: ICallSession,
  endedBy: string,
  reason: "end" | "reject"
): Promise<void> {
  if (session.status === "ended") return;
  const outcome = resolveCallOutcome(session, endedBy, reason);
  try {
    await persistCallLog(io, chatUseCase, session, outcome, endedBy);
  } catch (err) {
    console.error("[call] failed to persist call log", err);
  }
  if (reason === "reject") {
    emitToUser(io, session.callerId, "call:rejected", {
      callId: session.callId,
      chatId: session.chatId,
    });
    emitToUser(io, session.calleeId, "call:rejected", {
      callId: session.callId,
      chatId: session.chatId,
    });
  }
  endSession(io, session, endedBy);
}

function userBusy(userId: string): boolean {
  const callId = userActiveCallId.get(userId);
  if (!callId) return false;
  const session = activeCalls.get(callId);
  return !!session && session.status !== "ended";
}

export function registerCallSignaling(io: Server, chatUseCase: IChatUseCase): void {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    socket.join(userRoom(userId));

    // Any disconnect used to end the user's call, so closing an unrelated
    // second tab hung up a healthy peer-to-peer call. Now only the socket
    // that carries the call matters, and it gets a grace period: a client
    // that reconnects re-claims the call with call:resume.
    socket.on("disconnect", () => {
      const callId = userActiveCallId.get(userId);
      if (!callId) return;
      const session = activeCalls.get(callId);
      if (!session || session.status === "ended") return;
      const owner = session.socketIds?.[userId];
      if (owner && owner !== socket.id) return; // another tab closed — not this call's
      setTimeout(() => {
        const current = activeCalls.get(callId);
        if (!current || current.status === "ended") return;
        const nowOwner = current.socketIds?.[userId];
        if (nowOwner && nowOwner !== socket.id) return; // resumed on a new socket
        // A ringing callee has no owning socket: end only once every tab is gone.
        if (!nowOwner && userHasSockets(io, userId)) return;
        void finishCall(io, chatUseCase, current, userId, "end");
      }, DISCONNECT_GRACE_MS);
    });

    socket.on("call:resume", (data: { callId?: string }) => {
      if (typeof data?.callId !== "string") return;
      const session = activeCalls.get(data.callId);
      if (!session || session.status === "ended") return;
      if (session.callerId !== userId && session.calleeId !== userId) return;
      // Only a participant that already held the call can move it to this socket.
      if (!session.socketIds?.[userId]) return;
      session.socketIds[userId] = socket.id;
    });

    socket.on(
      "call:invite",
      async (data: { callId?: string; chatId?: string; callType?: CallType }) => {
        try {
          if (!data?.chatId || !data?.callType || !isValidNewCallId(data?.callId)) {
            socket.emit("call:error", { message: "Invalid call invite" });
            return;
          }
          if (data.callType !== "audio" && data.callType !== "video") {
            socket.emit("call:error", { message: "Invalid call type" });
            return;
          }
          if (userBusy(userId)) {
            socket.emit("call:busy", { callId: data.callId });
            return;
          }

          const { peerId } = await assertDirectChatFriends(userId, data.chatId);

          if (userBusy(peerId)) {
            socket.emit("call:busy", { callId: data.callId });
            return;
          }

          const room = io.sockets.adapter.rooms.get(userRoom(peerId));
          if (!room || room.size === 0) {
            const offlineSession: ICallSession = {
              callId: data.callId,
              chatId: data.chatId,
              callerId: userId,
              calleeId: peerId,
              callType: data.callType,
              status: "ended",
            };
            try {
              await persistCallLog(io, chatUseCase, offlineSession, "unavailable", userId);
            } catch (err) {
              console.error("[call] failed to persist offline call log", err);
            }
            socket.emit("call:unavailable", {
              callId: data.callId,
              chatId: data.chatId,
            });
            return;
          }

          const session: ICallSession = {
            callId: data.callId,
            chatId: data.chatId,
            callerId: userId,
            calleeId: peerId,
            callType: data.callType,
            status: "ringing",
            socketIds: { [userId]: socket.id },
          };
          activeCalls.set(data.callId, session);
          userActiveCallId.set(userId, data.callId);
          // The callee is busy while it rings, too: a second caller used to
          // replace the first call on the callee's screen, leaving the first
          // caller ringing forever. (It also means a callee who disconnects
          // while ringing now ends the call, via the disconnect handler.)
          userActiveCallId.set(peerId, data.callId);
          const callId = data.callId;
          ringTimers.set(
            callId,
            setTimeout(() => {
              ringTimers.delete(callId);
              const ringing = activeCalls.get(callId);
              if (ringing && ringing.status === "ringing") {
                // Ended "by" the callee without a connection: logged as missed.
                void finishCall(io, chatUseCase, ringing, ringing.calleeId, "end");
              }
            }, RING_TIMEOUT_MS)
          );

          emitToUser(io, peerId, "call:incoming", {
            callId: data.callId,
            chatId: data.chatId,
            callType: data.callType,
            callerId: userId,
          });
          socket.emit("call:ringing", { callId: data.callId });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Call failed";
          socket.emit("call:error", { message });
        }
      }
    );

    socket.on(
      "call:accept",
      async (data: { callId?: string; chatId?: string }) => {
        try {
          if (!data?.callId || !data?.chatId) return;
          const session = activeCalls.get(data.callId);
          if (!session || session.calleeId !== userId) {
            socket.emit("call:error", { message: "Call not found" });
            return;
          }
          // Only a ringing call can be answered, and only in its own chat.
          if (session.status !== "ringing" || session.chatId !== data.chatId) {
            socket.emit("call:error", { message: "This call can no longer be answered" });
            return;
          }
          await assertDirectChatFriends(userId, data.chatId);
          clearRingTimer(session.callId);
          session.status = "active";
          session.socketIds = { ...session.socketIds, [userId]: socket.id };
          session.connectedAt = Date.now();
          userActiveCallId.set(userId, data.callId);
          emitToUser(io, session.callerId, "call:accepted", {
            callId: data.callId,
            chatId: data.chatId,
          });
          emitToUser(io, session.calleeId, "call:accepted", {
            callId: data.callId,
            chatId: data.chatId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Call failed";
          socket.emit("call:error", { message });
        }
      }
    );

    socket.on(
      "call:reject",
      async (data: { callId?: string; chatId?: string }) => {
        try {
          if (typeof data?.callId !== "string") return;
          const session = activeCalls.get(data.callId);
          if (!session) return;
          if (session.calleeId !== userId && session.callerId !== userId) return;
          await finishCall(io, chatUseCase, session, userId, "reject");
        } catch (error) {
          socket.emit("call:error", { message: error instanceof Error ? error.message : "Call failed" });
        }
      }
    );

    socket.on(
      "call:end",
      async (data: { callId?: string; chatId?: string }) => {
        try {
          if (typeof data?.callId !== "string") return;
          const session = activeCalls.get(data.callId);
          if (!session) return;
          if (session.callerId !== userId && session.calleeId !== userId) return;
          await finishCall(io, chatUseCase, session, userId, "end");
        } catch (error) {
          socket.emit("call:error", { message: error instanceof Error ? error.message : "Call failed" });
        }
      }
    );

    const relayToPeer = (
      event: string,
      data: { callId?: string; sdp?: unknown; candidate?: unknown }
    ) => {
      if (!data?.callId) return;
      const session = activeCalls.get(data.callId);
      if (!session || session.status === "ended") return;
      const peerId = getPeerId(session, userId);
      if (!peerId) return;
      emitToUser(io, peerId, event, { ...data, fromUserId: userId });
    };

    socket.on("call:offer", (data) => relayToPeer("call:offer", data));
    socket.on("call:answer", (data) => relayToPeer("call:answer", data));
    socket.on("call:ice-candidate", (data) => relayToPeer("call:ice-candidate", data));
  });
}

/** Resolve peer for client-side validation helpers */
export function getDirectChatPeer(userId: string, chatId: string): string | null {
  return parseDirectChatPeer(userId, chatId);
}
