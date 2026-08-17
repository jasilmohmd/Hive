import mongoose, { Schema } from "mongoose";
import { IPollVote } from "../../entity/PollVote.entity";

const PollVoteSchema = new Schema<IPollVote>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    optionIndexes: { type: [Number], required: true, default: [] },
  },
  { timestamps: true }
);

PollVoteSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const PollVoteModel = mongoose.model<IPollVote>("PollVote", PollVoteSchema);
