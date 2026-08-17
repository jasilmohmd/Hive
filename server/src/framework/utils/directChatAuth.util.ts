import { Types } from "mongoose";
import FriendRepository from "../../repositories/friends.repository";

const DIRECT_CHAT_REGEX = /^([a-fA-F0-9]{24})_([a-fA-F0-9]{24})$/;

export function parseDirectChatPeer(userId: string, chatId: string): string | null {
  const match = chatId.match(DIRECT_CHAT_REGEX);
  if (!match) return null;
  const [, id1, id2] = match;
  const normalized = [id1, id2].sort().join("_");
  if (normalized !== chatId) return null;
  if (userId !== id1 && userId !== id2) return null;
  return userId === id1 ? id2 : id1;
}

export async function assertDirectChatFriends(
  userId: string,
  chatId: string
): Promise<{ peerId: string }> {
  const peerId = parseDirectChatPeer(userId, chatId);
  if (!peerId) {
    throw new Error("Invalid direct chat");
  }
  const friendRepo = new FriendRepository();
  const uid = new Types.ObjectId(userId);
  const pid = new Types.ObjectId(peerId);
  const peerHasUser = await friendRepo.checkFriendshipStatus(uid, pid);
  const userHasPeer = await friendRepo.checkFriendshipStatus(pid, uid);
  if (peerHasUser !== "already_friends" || userHasPeer !== "already_friends") {
    throw new Error("You can only call friends");
  }
  return { peerId };
}
