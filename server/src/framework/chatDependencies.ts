import { ChatUseCase } from "../usecase/chat.usecase";
import { ChatRepository } from "../repositories/chat.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageReactionRepository } from "../repositories/messageReaction.repository";
import { PollVoteRepository } from "../repositories/pollVote.repository";
import { ChannelRepository } from "../repositories/channel.repository";
import { CommunityRepository } from "../repositories/community.repository";
import FriendRepository from "../repositories/friends.repository";
import ImageUsecase from "../usecase/imageUpload.usecase";
import { RoleRepository } from "../repositories/role.repository";
import { UserRepository } from "../repositories/user.repository";
import { RBACService } from "./utils/RBACService";

export function createChatUseCase(): ChatUseCase {
  const communityRepository = new CommunityRepository();
  const rbacService = new RBACService(new RoleRepository(), communityRepository);
  return new ChatUseCase(
    new MessageRepository(),
    new ChatRepository(),
    new ChannelRepository(),
    communityRepository,
    new FriendRepository(),
    new ImageUsecase(),
    new MessageReactionRepository(),
    new PollVoteRepository(),
    rbacService,
    new UserRepository()
  );
}
