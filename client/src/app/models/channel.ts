import { IUser } from "./user";

export interface IChannel {
  _id?: string;           // Auto-assigned by MongoDB
  communityId: string;     // The community this channel belongs to
  name: string;
  topic?: string;                  // Optional, short subject/topic for quick reference
  description?: string;            // Optional detailed description of the channel
  createdBy: string;       // The user who created the channel
  type: 'info' | 'chatroom' | 'voiceroom';
  allowedRoles: string[];  // Role IDs that can access this channel
  participants?: string[];
  participantDetails?: IUser[];
  maxParticipants?: number;        // Optional: For voice channels, limit number of participants
  isOpen?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
