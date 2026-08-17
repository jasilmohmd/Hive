import { ChatUseCase } from "../usecase/chat.usecase";
import { ChatRepository } from "../repositories/chat.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageReactionRepository } from "../repositories/messageReaction.repository";
import { PollVoteRepository } from "../repositories/pollVote.repository";
import { ChannelRepository } from "../repositories/channel.repository";
import { CommunityRepository } from "../repositories/community.repository";
import FriendRepository from "../repositories/friends.repository";
import ImageUsecase from "../usecase/imageUpload.usecase";

export function createChatUseCase(): ChatUseCase {
  return new ChatUseCase(
    new MessageRepository(),
    new ChatRepository(),
    new ChannelRepository(),
    new CommunityRepository(),
    new FriendRepository(),
    new ImageUsecase(),
    new MessageReactionRepository(),
    new PollVoteRepository()
  );
}
