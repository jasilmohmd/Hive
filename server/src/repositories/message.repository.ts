import { Types } from "mongoose";
import { MessageModel } from "../framework/models/message.model";
import { IMessage } from "../entity/Message.entity";
import { IMessageRepository } from "../interfaces/repository/IMessage.repository";

function chatIdFilter(
  chatId: string
): { chatId: string } | { $or: ({ chatId: string } | { chatId: Types.ObjectId })[] } {
  const canonical =
    Types.ObjectId.isValid(chatId) && new Types.ObjectId(chatId).toString() === chatId;
  if (canonical) {
    return { $or: [{ chatId }, { chatId: new Types.ObjectId(chatId) }] };
  }
  return { chatId };
}

export class MessageRepository implements IMessageRepository {
  private async populateMessage(messageId: string): Promise<IMessage> {
    const populated = await MessageModel.findById(messageId)
      .populate("sender", "_id userName imageUrl")
      .populate({
        path: "replyToMessageId",
        select: "content type sender deletedAt",
        populate: { path: "sender", select: "_id userName imageUrl" },
      })
      .exec();
    if (!populated) {
      throw new Error("Message not found after save");
    }
    const obj = populated.toObject() as IMessage & { replyToMessageId?: IMessage };
    if (obj.replyToMessageId && typeof obj.replyToMessageId === "object") {
      obj.replyTo = {
        _id: obj.replyToMessageId._id as Types.ObjectId,
        content: obj.replyToMessageId.content,
        type: obj.replyToMessageId.type,
        sender: obj.replyToMessageId.sender,
        deletedAt: obj.replyToMessageId.deletedAt,
      };
    }
    return obj;
  }

  async saveMessage(message: IMessage): Promise<IMessage> {
    const newMessage = new MessageModel(message);
    const saved = await newMessage.save();
    return this.populateMessage(String(saved._id));
  }

  async getMessagesByChatId(chatId: string, page: number = 1, limit: number = 50): Promise<IMessage[]> {
    const rows = await MessageModel.find({
      ...chatIdFilter(chatId),
      deletedAt: { $exists: false },
    })
      .populate("sender", "_id userName imageUrl")
      .populate({
        path: "replyToMessageId",
        select: "content type sender deletedAt",
        populate: { path: "sender", select: "_id userName imageUrl" },
      })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    return (rows as (IMessage & { replyToMessageId?: IMessage })[]).map((row) => {
      if (row.replyToMessageId && typeof row.replyToMessageId === "object") {
        row.replyTo = {
          _id: row.replyToMessageId._id as Types.ObjectId,
          content: row.replyToMessageId.content,
          type: row.replyToMessageId.type,
          sender: row.replyToMessageId.sender,
          deletedAt: row.replyToMessageId.deletedAt,
        };
      }
      return row;
    });
  }

  async findById(messageId: string): Promise<IMessage | null> {
    const doc = await MessageModel.findById(messageId)
      .populate("sender", "_id userName imageUrl")
      .lean()
      .exec();
    return doc as IMessage | null;
  }

  async editMessage(messageId: string, newContent: string): Promise<IMessage | null> {
    const updated = await MessageModel.findByIdAndUpdate(
      messageId,
      { content: newContent, edited: true },
      { new: true }
    );
    if (!updated) return null;
    return this.populateMessage(messageId);
  }

  async softDeleteMessage(messageId: string): Promise<IMessage | null> {
    const updated = await MessageModel.findByIdAndUpdate(
      messageId,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!updated) return null;
    return this.populateMessage(messageId);
  }
}
