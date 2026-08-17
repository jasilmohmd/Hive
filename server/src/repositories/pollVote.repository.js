"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollVoteRepository = void 0;
const mongoose_1 = require("mongoose");
const pollVote_model_1 = require("../framework/models/pollVote.model");
const chatMessageContent_1 = require("../framework/utils/chatMessageContent");
class PollVoteRepository {
    vote(messageId, userId, optionIndexes, optionCount, allowMultiple) {
        return __awaiter(this, void 0, void 0, function* () {
            const unique = [...new Set(optionIndexes)].filter((i) => Number.isInteger(i) && i >= 0 && i < optionCount);
            if (!unique.length) {
                throw new Error("Select at least one option");
            }
            if (!allowMultiple && unique.length > 1) {
                throw new Error("This poll allows only one choice");
            }
            yield pollVote_model_1.PollVoteModel.findOneAndUpdate({ messageId: new mongoose_1.Types.ObjectId(messageId), userId: new mongoose_1.Types.ObjectId(userId) }, { optionIndexes: unique }, { upsert: true, new: true });
            return this.aggregateCounts(messageId, userId, optionCount);
        });
    }
    aggregateCounts(messageId, viewerUserId, optionCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const votes = yield pollVote_model_1.PollVoteModel.find({ messageId: new mongoose_1.Types.ObjectId(messageId) })
                .select("userId optionIndexes")
                .lean()
                .exec();
            const counts = new Array(optionCount).fill(0);
            let myVotes = [];
            for (const v of votes) {
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
        });
    }
    getSummariesForPollMessages(messages, viewerUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const result = new Map();
            if (!messages.length)
                return result;
            const oids = messages.map((m) => new mongoose_1.Types.ObjectId(m._id));
            const votes = yield pollVote_model_1.PollVoteModel.find({ messageId: { $in: oids } })
                .select("messageId userId optionIndexes")
                .lean()
                .exec();
            const votesByMessage = new Map();
            for (const v of votes) {
                const mid = v.messageId.toString();
                const list = (_a = votesByMessage.get(mid)) !== null && _a !== void 0 ? _a : [];
                list.push({ userId: v.userId, optionIndexes: v.optionIndexes });
                votesByMessage.set(mid, list);
            }
            for (const m of messages) {
                const poll = (0, chatMessageContent_1.parsePollContent)(m.content);
                const counts = new Array(poll.options.length).fill(0);
                let myVotes = [];
                const msgVotes = (_b = votesByMessage.get(m._id)) !== null && _b !== void 0 ? _b : [];
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
                    allowMultiple: (_c = poll.allowMultiple) !== null && _c !== void 0 ? _c : false,
                    counts,
                    myVotes,
                    totalVotes: msgVotes.length,
                });
            }
            return result;
        });
    }
}
exports.PollVoteRepository = PollVoteRepository;
