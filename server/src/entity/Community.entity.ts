import { Types } from "mongoose";

export interface ICommunity {
  _id?: Types.ObjectId;  // Mongoose auto-generates this
  imageUrl: string;
  coverImageUrl: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  ownerId: Types.ObjectId;
  roles: Types.ObjectId[];
  channels: Types.ObjectId[];
  joinRequests: Types.ObjectId[];
  members: { userId: Types.ObjectId; roleIds: Types.ObjectId[] }[];
  tags: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
