import { IMessage, IReactionSummary } from "../../entity/Message.entity";

export interface ISendMessageOptions {
  replyToMessageId?: string;
  metadata?: string;
}

export interface IChatUseCase {
  assertUserCanJoinChat(userId: string, chatId: string): Promise<void>;
  sendMessage(
    senderId: string,
    chatId: string,
    content: string,
    type: string,
    options?: ISendMessageOptions
  ): Promise<IMessage>;
  sendImageMessage(senderId: string, chatId: string, fileBuffer: Buffer, fileName: string): Promise<IMessage>;
  sendVideoMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string
  ): Promise<IMessage>;
  sendAudioMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string
  ): Promise<IMessage>;
  sendFileMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string,
    size: number
  ): Promise<IMessage>;
  getMessageHistory(chatId: string, page: number, limit: number, userId: string): Promise<IMessage[]>;
  editMessage(userId: string, messageId: string, newContent: string): Promise<IMessage>;
  deleteMessage(userId: string, messageId: string): Promise<IMessage>;
  setReaction(userId: string, messageId: string, emoji: string): Promise<{ chatId: string; messageId: string; reactions: IReactionSummary[] }>;
  removeReaction(userId: string, messageId: string): Promise<{ chatId: string; messageId: string; reactions: IReactionSummary[] }>;
  votePoll(userId: string, messageId: string, optionIndexes: number[]): Promise<{ chatId: string; messageId: string; poll: IMessage["poll"] }>;
  getLinkPreview(url: string): Promise<unknown>;
}
