import mongoose, { Schema, Document } from 'mongoose';
import { IChannel } from '../../entity/Channel.entity';

const ChannelSchema = new Schema<IChannel & Document>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    name: { type: String, required: true },
    topic: { type: String },  // Short subject/topic for quick reference.
    description: { type: String },  // Detailed description.
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['info', 'chatroom', 'voiceroom'], required: true },
    allowedRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxParticipants: { type: Number },  // Optional limit for voice channels.
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt.
);

export const ChannelModel = mongoose.model<IChannel & Document>('Channel', ChannelSchema);
