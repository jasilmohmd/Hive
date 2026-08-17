import { Types } from "mongoose";
import { PollVoteModel } from "../framework/models/pollVote.model";
import { IPollSummary } from "../entity/Message.entity";
import { IPollVoteRepository } from "../interfaces/repository/IPollVote.repository";
import { parsePollContent } from "../framework/utils/chatMessageContent";

export class PollVoteRepository implements IPollVoteRepository {
  async vote(
    messageId: string,
    userId: string,
    optionIndexes: number[],
    optionCount: number,
    allowMultiple: boolean
  ): Promise<{ counts: number[]; myVotes: number[]; totalVotes: number }> {
    const unique = [...new Set(optionIndexes)].filter(
      (i) => Number.isInteger(i) && i >= 0 && i < optionCount
    );
    if (!unique.length) {
      throw new Error("Select at least one option");
    }
    if (!allowMultiple && unique.length > 1) {
      throw new Error("This poll allows only one choice");
    }

    await PollVoteModel.findOneAndUpdate(
      { messageId: new Types.ObjectId(messageId), userId: new Types.ObjectId(userId) },
      { optionIndexes: unique },
      { upsert: true, new: true }
    );

    return this.aggregateCounts(messageId, userId, optionCount);
  }

  private async aggregateCounts(
    messageId: string,
    viewerUserId: string,
    optionCount: number
  ): Promise<{ counts: number[]; myVotes: number[]; totalVotes: number }> {
    const votes = await PollVoteModel.find({ messageId: new Types.ObjectId(messageId) })
      .select("userId optionIndexes")
      .lean()
      .exec();

    const counts = new Array(optionCount).fill(0);
    let myVotes: number[] = [];
    for (const v of votes as { userId: Types.ObjectId; optionIndexes: number[] }[]) {
      if (v.userId.toString() === viewerUserId) {
        myVotes = v.optionIndexes;
      }
      for (const idx of v.optionIndexes) {
        if (idx >= 0 && idx < optionCount) {
          counts[idx] += 1;
        }
      }
    }
    return { counts, myVotes, totalVotes: votes.length };
  }

  async getSummariesForPollMessages(
    messages: { _id: string; content: string }[],
    viewerUserId: string
  ): Promise<Map<string, IPollSummary>> {
    const result = new Map<string, IPollSummary>();
    if (!messages.length) return result;

    const oids = messages.map((m) => new Types.ObjectId(m._id));
    const votes = await PollVoteModel.find({ messageId: { $in: oids } })
      .select("messageId userId optionIndexes")
      .lean()
      .exec();

    const votesByMessage = new Map<string, { userId: Types.ObjectId; optionIndexes: number[] }[]>();
    for (const v of votes as { messageId: Types.ObjectId; userId: Types.ObjectId; optionIndexes: number[] }[]) {
      const mid = v.messageId.toString();
      const list = votesByMessage.get(mid) ?? [];
      list.push({ userId: v.userId, optionIndexes: v.optionIndexes });
      votesByMessage.set(mid, list);
    }

    for (const m of messages) {
      const poll = parsePollContent(m.content);
      const counts = new Array(poll.options.length).fill(0);
      let myVotes: number[] = [];
      const msgVotes = votesByMessage.get(m._id) ?? [];
      for (const v of msgVotes) {
        if (v.userId.toString() === viewerUserId) {
          myVotes = v.optionIndexes;
        }
        for (const idx of v.optionIndexes) {
          if (idx >= 0 && idx < counts.length) {
            counts[idx] += 1;
          }
        }
      }
      result.set(m._id, {
        question: poll.question,
        options: poll.options,
        allowMultiple: poll.allowMultiple ?? false,
        counts,
        myVotes,
        totalVotes: msgVotes.length,
      });
    }
    return result;
  }
}
