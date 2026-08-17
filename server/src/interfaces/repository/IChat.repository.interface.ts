import { IChat } from "../../entity/Chat.entity";


export interface IChatRepository {
  createChat(chat: IChat): Promise<IChat>;
  findChatById(chatId: string): Promise<IChat | null>;
  doesDirectChatExist(user1: string, user2: string): Promise<boolean>;
}