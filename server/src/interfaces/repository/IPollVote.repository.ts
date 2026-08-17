import { IPollSummary } from "../../entity/Message.entity";

export interface IPollVoteRepository {
  vote(
    messageId: string,
    userId: string,
    optionIndexes: number[],
    optionCount: number,
    allowMultiple: boolean
  ): Promise<{ counts: number[]; myVotes: number[]; totalVotes: number }>;
  getSummariesForPollMessages(
    messages: { _id: string; content: string }[],
    viewerUserId: string
  ): Promise<Map<string, IPollSummary>>;
}
