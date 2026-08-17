import mongoose, { Schema } from "mongoose";
import { IMessageReaction } from "../../entity/MessageReaction.entity";

const MessageReactionSchema = new Schema<IMessageReaction>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageReactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const MessageReactionModel = mongoose.model<IMessageReaction>(
  "MessageReaction",
  MessageReactionSchema
);
