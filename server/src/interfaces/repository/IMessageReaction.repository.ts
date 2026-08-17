import { IReactionSummary } from "../../entity/Message.entity";

export interface IMessageReactionRepository {
  setReaction(messageId: string, userId: string, emoji: string): Promise<IReactionSummary[]>;
  removeReaction(messageId: string, userId: string): Promise<IReactionSummary[]>;
  getSummariesForMessages(messageIds: string[], viewerUserId: string): Promise<Map<string, IReactionSummary[]>>;
}
