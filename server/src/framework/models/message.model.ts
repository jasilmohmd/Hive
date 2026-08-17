import mongoose, { Schema } from "mongoose";
import { IMessage } from "../../entity/Message.entity";

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chatId: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "text",
        "emoji",
        "image",
        "video",
        "audio",
        "file",
        "gif",
        "sticker",
        "location",
        "contact",
        "poll",
        "call",
      ],
      default: "text",
    },
    edited: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    replyToMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
    deletedAt: { type: Date },
    metadata: { type: String },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, timestamp: -1 });
MessageSchema.index({ sender: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
