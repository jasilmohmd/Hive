import { Types } from 'mongoose';

export interface IChannel {
  _id?: Types.ObjectId;           // Auto-assigned by MongoDB
  communityId: Types.ObjectId;     // The community this channel belongs to
  name: string;
  topic?: string;                  // Optional, short subject/topic for quick reference
  description?: string;            // Optional detailed description of the channel
  createdBy: Types.ObjectId;       // The user who created the channel
  type: 'info' | 'chatroom' | 'voiceroom';
  allowedRoles: Types.ObjectId[];  // Role IDs that can access this channel
  participants?: Types.ObjectId[];
  maxParticipants?: number;        // Optional: For voice channels, limit number of participants
  createdAt?: Date;
  updatedAt?: Date;
}
