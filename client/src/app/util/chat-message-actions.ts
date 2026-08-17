import { firstValueFrom } from 'rxjs';
import {
  ChatService,
  IChatMessage,
  IMessageMetadata,
  ISendMessageOptions,
} from '../services/chat.service';
import { parseMetadata } from './message-display';

export function applyMessageEdited(messages: IChatMessage[], updated: IChatMessage): IChatMessage[] {
  const idx = messages.findIndex((m) => m._id === updated._id);
  if (idx < 0) return messages;
  const next = [...messages];
  next[idx] = { ...next[idx], ...updated };
  return next;
}

export function applyMessageDeleted(
  messages: IChatMessage[],
  payload: { _id: string }
): IChatMessage[] {
  return messages.filter((m) => m._id !== payload._id);
}

export function applyReactionUpdated(
  messages: IChatMessage[],
  payload: { messageId: string; reactions: IChatMessage['reactions'] }
): IChatMessage[] {
  return messages.map((m) =>
    m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m
  );
}

export function applyPollUpdated(
  messages: IChatMessage[],
  payload: { messageId: string; poll: NonNullable<IChatMessage['poll']> }
): IChatMessage[] {
  return messages.map((m) => (m._id === payload.messageId ? { ...m, poll: payload.poll } : m));
}

export function buildForwardMetadata(
  msg: IChatMessage,
  senderName: string
): string {
  const meta: IMessageMetadata = {
    forwardedFrom: {
      messageId: msg._id ?? '',
      chatId: msg.chatId,
      senderName,
    },
  };
  return JSON.stringify(meta);
}

export async function forwardMessageToChat(
  chat: ChatService,
  targetChatId: string,
  source: IChatMessage,
  senderName: string
): Promise<void> {
  const metadata = buildForwardMetadata(source, senderName);
  const opts: ISendMessageOptions = { metadata };

  if (source.type === 'image') {
    const blob = await fetch(source.content).then((r) => r.blob());
    const file = new File([blob], 'forwarded-image', { type: blob.type || 'image/jpeg' });
    await firstValueFrom(chat.sendImageMessage(targetChatId, file));
    return;
  }
  if (source.type === 'video') {
    const blob = await fetch(source.content).then((r) => r.blob());
    const file = new File([blob], 'forwarded-video', { type: blob.type || 'video/mp4' });
    await firstValueFrom(chat.sendVideoMessage(targetChatId, file));
    return;
  }
  if (source.type === 'audio') {
    const blob = await fetch(source.content).then((r) => r.blob());
    const file = new File([blob], 'forwarded-audio', { type: blob.type || 'audio/webm' });
    await firstValueFrom(chat.sendAudioMessage(targetChatId, file));
    return;
  }

  chat.sendMessage(targetChatId, source.content, source.type, opts);
}

export function parseMetadataField(raw: string | undefined): IMessageMetadata {
  return parseMetadata(raw);
}

export function hasForwardedLabel(raw: string | undefined): boolean {
  return !!parseMetadata(raw).forwardedFrom;
}
