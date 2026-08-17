import mongoose, { Schema, Document, Types } from "mongoose";
import { ICommunity } from "../../entity/Community.entity"; // Ensure correct import

const CommunitySchema = new Schema<ICommunity & Document>(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['public', 'private'], required: true },
    imageUrl: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }], // Role references
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }], // Channel references
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role', required: true }],
      },
    ],
    joinRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', default: [] }] // Tag references
  },
  { timestamps: true }
);

export const CommunityModel = mongoose.model<ICommunity & Document>('Community', CommunitySchema);

export type ICommunityDocument = ICommunity & Document;
