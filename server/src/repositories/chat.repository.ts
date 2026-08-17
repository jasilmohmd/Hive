import { IChat } from "../entity/Chat.entity";
import { ChatModel } from "../framework/models/chat.model";
import { IChatRepository } from "../interfaces/repository/IChat.repository.interface";

export class ChatRepository implements IChatRepository  {
  async createChat(chat: IChat): Promise<IChat> {
    const newChat = new ChatModel(chat);
    return await newChat.save();
  }

  async findChatById(chatId: string): Promise<IChat | null> {
    return ChatModel.findOne({ chatId });
  }

  async doesDirectChatExist(user1: string, user2: string): Promise<boolean> {
    const sortedIds = [user1, user2].sort().join('_');
    const chat = await ChatModel.findOne({ chatId: sortedIds });
    return !!chat;
  }
}