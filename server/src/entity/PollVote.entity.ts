import { Types } from "mongoose";

export interface IPollVote {
  _id?: Types.ObjectId;
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  optionIndexes: number[];
  createdAt?: Date;
  updatedAt?: Date;
}
