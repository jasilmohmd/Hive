import { IChatUseCase, ISendMessageOptions } from "../interfaces/usecase/IChat.usecase.interface";
import { IMessage } from "../entity/Message.entity";
import { IChat } from "../entity/Chat.entity";
import { IChatRepository } from "../interfaces/repository/IChat.repository.interface";
import { Types } from "mongoose";
import { IMessageRepository } from "../interfaces/repository/IMessage.repository";
import { IChannelRepository } from "../interfaces/repository/IChannel.repository.interface";
import { ICommunityRepository } from "../interfaces/repository/ICommunity.repository.interface";
import IFriendRepository from "../interfaces/repository/IFriends.repository.interface";
import { IChannel } from "../entity/Channel.entity";
import IImageUsecase from "../interfaces/usecase/IImage.usecase.interface";
import { IMessageReactionRepository } from "../interfaces/repository/IMessageReaction.repository";
import { IPollVoteRepository } from "../interfaces/repository/IPollVote.repository";
import { assertValidChatMediaUrl } from "../framework/utils/chatMediaUrl";
import {
  ALLOWED_MESSAGE_TYPES,
  assertAllowedMime,
  assertValidReactionEmoji,
  buildContactContent,
  buildFileContent,
  buildPollContent,
  EDITABLE_MESSAGE_TYPES,
  parseContactContent,
  parseLocationContent,
  parseMetadata,
  parsePollContent,
  stringifyLocationContent,
  stringifyMetadata,
} from "../framework/utils/chatMessageContent";
import { parseCallMessageContent } from "../framework/utils/callMessageContent";
import { extractFirstHttpUrl, fetchLinkPreview } from "../framework/utils/linkPreview";
import Users from "../framework/models/user.model";

const DIRECT_CHAT_REGEX = /^([a-fA-F0-9]{24})_([a-fA-F0-9]{24})$/;

function channelSupportsTextChat(type: string): boolean {
  return type === "chatroom" || type === "voiceroom";
}

function communityObjectId(channel: IChannel): Types.ObjectId {
  const c = channel.communityId as unknown;
  if (c instanceof Types.ObjectId) return c;
  if (c && typeof c === "object" && "_id" in (c as object)) {
    return new Types.ObjectId(String((c as { _id: Types.ObjectId })._id));
  }
  return new Types.ObjectId(String(c));
}

export class ChatUseCase implements IChatUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private chatRepository: IChatRepository,
    private channelRepository: IChannelRepository,
    private communityRepository: ICommunityRepository,
    private friendRepository: IFriendRepository,
    private imageUsecase: IImageUsecase,
    private reactionRepository: IMessageReactionRepository,
    private pollVoteRepository: IPollVoteRepository
  ) {}

  private normalizeDirectChatId(userA: string, userB: string): string {
    return [userA, userB].sort().join("_");
  }

  private async userHasChannelAccess(userId: Types.ObjectId, channel: IChannel): Promise<boolean> {
    const communityId = communityObjectId(channel);
    const userRoleIds = await this.communityRepository.getUserRoles(communityId, userId);
    return channel.allowedRoles.some((ar) => userRoleIds.some((ur) => ur.equals(ar)));
  }

  async ensureGroupChatForChannel(channelId: Types.ObjectId): Promise<void> {
    const idStr = channelId.toString();
    const existing = await this.chatRepository.findChatById(idStr);
    if (existing) return;
    await this.chatRepository.createChat({ chatId: idStr, type: "group" });
  }

  private async assertCanAccessExistingChat(userId: Types.ObjectId, chat: IChat): Promise<void> {
    if (chat.type === "direct") {
      const [a, b] = chat.chatId.split("_");
      const uid = userId.toString();
      if (uid !== a && uid !== b) {
        throw new Error("Unauthorized to access this chat");
      }
      return;
    }

    const channelId = new Types.ObjectId(chat.chatId);
    const channel = await this.channelRepository.getChannelById(channelId);
    if (!channel || !channelSupportsTextChat(channel.type)) {
      throw new Error("Invalid channel chat");
    }
    if (!(await this.userHasChannelAccess(userId, channel))) {
      throw new Error("Unauthorized to access this channel chat");
    }
  }

  private async getOrCreateChatForSend(senderId: Types.ObjectId, chatId: string): Promise<IChat> {
    const existing = await this.chatRepository.findChatById(chatId);
    if (existing) {
      await this.assertCanAccessExistingChat(senderId, existing);
      return existing;
    }

    const directMatch = chatId.match(DIRECT_CHAT_REGEX);
    if (directMatch) {
      const [, id1, id2] = directMatch;
      const normalized = this.normalizeDirectChatId(id1, id2);
      if (normalized !== chatId) {
        throw new Error("Invalid direct chat id: ids must be sorted");
      }
      const uid = senderId.toString();
      if (uid !== id1 && uid !== id2) {
        throw new Error("Unauthorized to send message to this chat");
      }
      const peer = uid === id1 ? id2 : id1;
      const status = await this.friendRepository.checkFriendshipStatus(senderId, new Types.ObjectId(peer));
      if (status !== "already_friends") {
        throw new Error("You can only message users who are already friends");
      }
      let chat = await this.chatRepository.findChatById(normalized);
      if (!chat) {
        chat = await this.chatRepository.createChat({ chatId: normalized, type: "direct" });
      }
      return chat;
    }

    if (!Types.ObjectId.isValid(chatId)) {
      throw new Error("Chat does not exist");
    }

    const channelId = new Types.ObjectId(chatId);
    const channel = await this.channelRepository.getChannelById(channelId);
    if (!channel) {
      throw new Error("Chat does not exist");
    }
    if (!channelSupportsTextChat(channel.type)) {
      throw new Error("This channel does not support text chat");
    }
    if (!(await this.userHasChannelAccess(senderId, channel))) {
      throw new Error("Unauthorized to send message to this channel");
    }

    await this.ensureGroupChatForChannel(channelId);
    const created = await this.chatRepository.findChatById(chatId);
    if (!created) {
      throw new Error("Failed to initialize channel chat");
    }
    return created;
  }

  private async assertCanAccessMessage(userId: Types.ObjectId, message: IMessage): Promise<void> {
    if (message.deletedAt) {
      throw new Error("Message not found");
    }
    const chat = await this.chatRepository.findChatById(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    await this.assertCanAccessExistingChat(userId, chat);
  }

  private senderIdOf(message: IMessage): string {
    const s = message.sender;
    if (s instanceof Types.ObjectId) return s.toString();
    if (s && typeof s === "object" && "_id" in s) {
      return String((s as { _id: Types.ObjectId })._id);
    }
    return String(s);
  }

  private async enrichMessages(messages: IMessage[], viewerUserId: string): Promise<IMessage[]> {
    const ids = messages.map((m) => String(m._id)).filter(Boolean);
    const pollMsgs = messages
      .filter((m) => m.type === "poll")
      .map((m) => ({ _id: String(m._id), content: m.content }));

    const [reactionMap, pollMap] = await Promise.all([
      this.reactionRepository.getSummariesForMessages(ids, viewerUserId),
      this.pollVoteRepository.getSummariesForPollMessages(pollMsgs, viewerUserId),
    ]);

    return messages.map((m) => {
      const id = String(m._id);
      const reactions = reactionMap.get(id) ?? [];
      const poll = m.type === "poll" ? pollMap.get(id) : undefined;
      return { ...m, reactions, poll };
    });
  }

  async sendMessage(
    senderId: string,
    chatId: string,
    content: string,
    type: string,
    options: ISendMessageOptions = {}
  ): Promise<IMessage> {
    const senderOid = new Types.ObjectId(senderId);
    await this.getOrCreateChatForSend(senderOid, chatId);

    if (!ALLOWED_MESSAGE_TYPES.has(type)) {
      throw new Error("Invalid message type");
    }

    let resolvedContent = content;
    const resolvedType = type as IMessage["type"];
    let metadata = parseMetadata(options.metadata);

    if (type === "gif" || type === "sticker") {
      resolvedContent = assertValidChatMediaUrl(content, type);
    } else if (type === "location") {
      const location = parseLocationContent(content);
      resolvedContent = stringifyLocationContent(location);
    } else if (type === "contact") {
      const contact = parseContactContent(content);
      const user = await Users.findById(contact.userId).select("_id userName imageUrl").lean();
      if (!user) {
        throw new Error("Contact user not found");
      }
      resolvedContent = buildContactContent({
        userId: contact.userId,
        userName: contact.userName || String((user as { userName?: string }).userName ?? ""),
        imageUrl: contact.imageUrl ?? (user as { imageUrl?: string }).imageUrl,
      });
    } else if (type === "poll") {
      const poll = parsePollContent(content);
      resolvedContent = buildPollContent(poll);
    } else if (type === "call") {
      parseCallMessageContent(content);
    } else if (type === "text") {
      const url = extractFirstHttpUrl(content);
      if (url) {
        const preview = await fetchLinkPreview(url);
        if (preview) {
          metadata = { ...metadata, linkPreview: preview };
        }
      }
    }

    let replyToMessageId: Types.ObjectId | undefined;
    if (options.replyToMessageId) {
      const reply = await this.messageRepository.findById(options.replyToMessageId);
      if (!reply || reply.deletedAt || reply.chatId !== chatId) {
        throw new Error("Reply message not found in this chat");
      }
      replyToMessageId = new Types.ObjectId(options.replyToMessageId);
    }

    const message: IMessage = {
      sender: senderOid,
      chatId,
      content: resolvedContent,
      type: resolvedType,
      timestamp: new Date(),
      replyToMessageId,
      metadata: Object.keys(metadata).length ? stringifyMetadata(metadata) : undefined,
    };

    const saved = await this.messageRepository.saveMessage(message);
    const [enriched] = await this.enrichMessages([saved], senderId);
    return enriched;
  }

  async sendImageMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<IMessage> {
    const imageUrl = await this.imageUsecase.upload(fileBuffer, fileName, true, "image");
    return this.sendMessage(senderId, chatId, imageUrl, "image");
  }

  async sendVideoMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string
  ): Promise<IMessage> {
    assertAllowedMime(mime, "video");
    const videoUrl = await this.imageUsecase.upload(fileBuffer, fileName, true, "video");
    return this.sendMessage(senderId, chatId, videoUrl, "video");
  }

  async sendAudioMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string
  ): Promise<IMessage> {
    assertAllowedMime(mime, "audio");
    const audioUrl = await this.imageUsecase.upload(fileBuffer, fileName, true, "video");
    return this.sendMessage(senderId, chatId, audioUrl, "audio");
  }

  async sendFileMessage(
    senderId: string,
    chatId: string,
    fileBuffer: Buffer,
    fileName: string,
    mime: string,
    size: number
  ): Promise<IMessage> {
    assertAllowedMime(mime, "document");
    const fileUrl = await this.imageUsecase.upload(fileBuffer, fileName, true, "raw");
    const content = buildFileContent({ url: fileUrl, name: fileName, mime, size });
    return this.sendMessage(senderId, chatId, content, "file");
  }

  async getMessageHistory(
    chatId: string,
    page: number = 1,
    limit: number = 50,
    userId: string
  ): Promise<IMessage[]> {
    const userOid = new Types.ObjectId(userId);

    let chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      const directMatch = chatId.match(DIRECT_CHAT_REGEX);
      if (directMatch) {
        const [, id1, id2] = directMatch;
        const normalized = this.normalizeDirectChatId(id1, id2);
        if (normalized !== chatId) {
          throw new Error("Invalid direct chat id: ids must be sorted");
        }
        const uid = userOid.toString();
        if (uid !== id1 && uid !== id2) {
          throw new Error("Unauthorized to read this chat");
        }
        const peer = uid === id1 ? id2 : id1;
        const status = await this.friendRepository.checkFriendshipStatus(userOid, new Types.ObjectId(peer));
        if (status !== "already_friends") {
          throw new Error("You can only read chats with friends");
        }
        chat = await this.chatRepository.findChatById(normalized);
        if (!chat) {
          return [];
        }
      } else if (Types.ObjectId.isValid(chatId)) {
        const channelId = new Types.ObjectId(chatId);
        const channel = await this.channelRepository.getChannelById(channelId);
        if (!channel || !channelSupportsTextChat(channel.type)) {
          throw new Error("Chat does not exist");
        }
        if (!(await this.userHasChannelAccess(userOid, channel))) {
          throw new Error("Unauthorized to read this channel chat");
        }
        await this.ensureGroupChatForChannel(channelId);
      } else {
        throw new Error("Chat does not exist");
      }
    } else {
      await this.assertCanAccessExistingChat(userOid, chat);
    }

    const messages = await this.messageRepository.getMessagesByChatId(chatId, page, limit);
    const enriched = await this.enrichMessages(messages, userId);
    return enriched.slice().reverse();
  }

  async editMessage(userId: string, messageId: string, newContent: string): Promise<IMessage> {
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.deletedAt) {
      throw new Error("Message not found");
    }
    if (this.senderIdOf(message) !== userId) {
      throw new Error("You can only edit your own messages");
    }
    if (!EDITABLE_MESSAGE_TYPES.has(message.type)) {
      throw new Error("This message type cannot be edited");
    }
    await this.assertCanAccessMessage(new Types.ObjectId(userId), message);

    let resolved = newContent.trim();
    if (message.type === "poll") {
      const existing = parsePollContent(message.content);
      const parsed = parsePollContent(
        JSON.stringify({
          question: resolved,
          options: existing.options,
          allowMultiple: existing.allowMultiple,
        })
      );
      resolved = buildPollContent(parsed);
    } else if (!resolved) {
      throw new Error("Message cannot be empty");
    }

    const updated = await this.messageRepository.editMessage(messageId, resolved);
    if (!updated) {
      throw new Error("Failed to edit message");
    }
    const [enriched] = await this.enrichMessages([updated], userId);
    return enriched;
  }

  async deleteMessage(userId: string, messageId: string): Promise<IMessage> {
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.deletedAt) {
      throw new Error("Message not found");
    }
    if (this.senderIdOf(message) !== userId) {
      throw new Error("You can only delete your own messages");
    }
    await this.assertCanAccessMessage(new Types.ObjectId(userId), message);

    const deleted = await this.messageRepository.softDeleteMessage(messageId);
    if (!deleted) {
      throw new Error("Failed to delete message");
    }
    return deleted;
  }

  async setReaction(userId: string, messageId: string, emoji: string) {
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.deletedAt) {
      throw new Error("Message not found");
    }
    await this.assertCanAccessMessage(new Types.ObjectId(userId), message);
    const validEmoji = assertValidReactionEmoji(emoji);
    const reactions = await this.reactionRepository.setReaction(messageId, userId, validEmoji);
    return { chatId: message.chatId, messageId, reactions };
  }

  async removeReaction(userId: string, messageId: string) {
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.deletedAt) {
      throw new Error("Message not found");
    }
    await this.assertCanAccessMessage(new Types.ObjectId(userId), message);
    const reactions = await this.reactionRepository.removeReaction(messageId, userId);
    return { chatId: message.chatId, messageId, reactions };
  }

  async votePoll(userId: string, messageId: string, optionIndexes: number[]) {
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.deletedAt) {
      throw new Error("Message not found");
    }
    if (message.type !== "poll") {
      throw new Error("Not a poll message");
    }
    await this.assertCanAccessMessage(new Types.ObjectId(userId), message);
    const pollContent = parsePollContent(message.content);
    const { counts, myVotes, totalVotes } = await this.pollVoteRepository.vote(
      messageId,
      userId,
      optionIndexes,
      pollContent.options.length,
      pollContent.allowMultiple === true
    );
    const poll = {
      question: pollContent.question,
      options: pollContent.options,
      allowMultiple: pollContent.allowMultiple === true,
      counts,
      myVotes,
      totalVotes,
    };
    return { chatId: message.chatId, messageId, poll };
  }

  async getLinkPreview(url: string) {
    return fetchLinkPreview(url);
  }
}
