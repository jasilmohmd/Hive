import { IMessage } from "../../entity/Message.entity";

export interface IMessageRepository {
  saveMessage(message: IMessage): Promise<IMessage>;
  getMessagesByChatId(chatId: string, page: number, limit: number): Promise<IMessage[]>;
  findById(messageId: string): Promise<IMessage | null>;
  editMessage(messageId: string, newContent: string): Promise<IMessage | null>;
  softDeleteMessage(messageId: string): Promise<IMessage | null>;
}
