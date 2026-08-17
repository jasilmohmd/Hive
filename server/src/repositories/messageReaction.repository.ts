import { Types } from "mongoose";
import { MessageReactionModel } from "../framework/models/messageReaction.model";
import { IReactionSummary } from "../entity/Message.entity";
import { IMessageReactionRepository } from "../interfaces/repository/IMessageReaction.repository";

function toSummaries(
  rows: { emoji: string; userId: Types.ObjectId }[],
  viewerUserId: string
): IReactionSummary[] {
  const byEmoji = new Map<string, { count: number; userIds: string[] }>();
  for (const row of rows) {
    const uid = row.userId.toString();
    const entry = byEmoji.get(row.emoji) ?? { count: 0, userIds: [] };
    entry.count += 1;
    entry.userIds.push(uid);
    byEmoji.set(row.emoji, entry);
  }
  return Array.from(byEmoji.entries()).map(([emoji, { count, userIds }]) => ({
    emoji,
    count,
    userIds,
    reactedByMe: userIds.includes(viewerUserId),
  }));
}

export class MessageReactionRepository implements IMessageReactionRepository {
  async setReaction(messageId: string, userId: string, emoji: string): Promise<IReactionSummary[]> {
    await MessageReactionModel.findOneAndUpdate(
      { messageId: new Types.ObjectId(messageId), userId: new Types.ObjectId(userId) },
      { emoji },
      { upsert: true, new: true }
    );
    return this.getSummariesForMessage(messageId, userId);
  }

  async removeReaction(messageId: string, userId: string): Promise<IReactionSummary[]> {
    await MessageReactionModel.deleteOne({
      messageId: new Types.ObjectId(messageId),
      userId: new Types.ObjectId(userId),
    });
    return this.getSummariesForMessage(messageId, userId);
  }

  private async getSummariesForMessage(messageId: string, viewerUserId: string): Promise<IReactionSummary[]> {
    const rows = await MessageReactionModel.find({ messageId: new Types.ObjectId(messageId) })
      .select("emoji userId")
      .lean()
      .exec();
    return toSummaries(rows as { emoji: string; userId: Types.ObjectId }[], viewerUserId);
  }

  async getSummariesForMessages(
    messageIds: string[],
    viewerUserId: string
  ): Promise<Map<string, IReactionSummary[]>> {
    const result = new Map<string, IReactionSummary[]>();
    if (!messageIds.length) return result;

    const oids = messageIds.map((id) => new Types.ObjectId(id));
    const rows = await MessageReactionModel.find({ messageId: { $in: oids } })
      .select("messageId emoji userId")
      .lean()
      .exec();

    const grouped = new Map<string, { emoji: string; userId: Types.ObjectId }[]>();
    for (const row of rows as { messageId: Types.ObjectId; emoji: string; userId: Types.ObjectId }[]) {
      const mid = row.messageId.toString();
      const list = grouped.get(mid) ?? [];
      list.push({ emoji: row.emoji, userId: row.userId });
      grouped.set(mid, list);
    }

    for (const id of messageIds) {
      result.set(id, toSummaries(grouped.get(id) ?? [], viewerUserId));
    }
    return result;
  }
}
