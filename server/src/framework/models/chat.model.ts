import mongoose, { Schema, Document, Types } from 'mongoose';
import { IChat } from '../../entity/Chat.entity';

const ChatSchema = new Schema<IChat>(
  {
    chatId: { type: String, required: true, unique: true },
    type: { type: String, enum: ['direct', 'group'], required: true },
  },
  { timestamps: true }
);

// Add indexes
ChatSchema.index({ type: 1 }); // If you need to query by chat type

export const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);
