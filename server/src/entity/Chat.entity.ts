import { Types } from "mongoose";

export interface IChat {
  _id?: Types.ObjectId;
  chatId: string; // For group: channel ID; for DM: computed unique ID (e.g. "userA_userB")
  type: "direct" | "group";
  createdAt?: Date;
  updatedAt?: Date;
}