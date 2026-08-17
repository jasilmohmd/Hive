import { Types } from "mongoose";

export interface IMessageReaction {
  _id?: Types.ObjectId;
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  emoji: string;
  createdAt?: Date;
}
