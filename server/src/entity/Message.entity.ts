import { Types } from "mongoose";

export type MessageType =
  | "text"
  | "emoji"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "gif"
  | "sticker"
  | "location"
  | "contact"
  | "poll"
  | "call";

export interface IMessageReplyTo {
  _id: Types.ObjectId;
  content: string;
  type: MessageType;
  sender?: Types.ObjectId | { _id: Types.ObjectId; userName: string; imageUrl?: string };
  deletedAt?: Date;
}

export interface IReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
  reactedByMe: boolean;
}

export interface IPollSummary {
  question: string;
  options: string[];
  allowMultiple: boolean;
  counts: number[];
  myVotes: number[];
  totalVotes: number;
}

export interface IMessage {
  _id?: Types.ObjectId;
  sender: Types.ObjectId | { _id: Types.ObjectId; userName: string; imageUrl?: string };
  chatId: string;
  content: string;
  type: MessageType;
  edited?: boolean;
  timestamp: Date;
  replyToMessageId?: Types.ObjectId;
  replyTo?: IMessageReplyTo;
  deletedAt?: Date;
  metadata?: string;
  reactions?: IReactionSummary[];
  poll?: IPollSummary;
}
