import { IChatMessage } from '../services/chat.service';
import {
  hasForwardedLabel,
  isAudioMessage,
  isContactMessage,
  isFileMessage,
  isGifMessage,
  isImageMessage,
  isLocationMessage,
  isPollMessage,
  isStickerMessage,
  isVideoMessage,
  parseContactContent,
  parseFileContent,
  parseLocationContent,
  parseMetadata,
  parsePollContent,
} from './message-display';

function msg(partial: Partial<IChatMessage>): IChatMessage {
  return {
    sender: '507f1f77bcf86cd799439011',
    chatId: 'chat',
    content: 'x',
    type: 'text',
    timestamp: new Date().toISOString(),
    ...partial,
  };
}

describe('message-display', () => {
  it('isImageMessage is true only for image', () => {
    expect(isImageMessage(msg({ type: 'image' }))).toBe(true);
    expect(isImageMessage(msg({ type: 'gif' }))).toBe(false);
    expect(isImageMessage(msg({ type: 'text' }))).toBe(false);
  });

  it('isGifMessage is true only for gif', () => {
    expect(isGifMessage(msg({ type: 'gif' }))).toBe(true);
    expect(isGifMessage(msg({ type: 'image' }))).toBe(false);
  });

  it('isStickerMessage is true only for sticker', () => {
    expect(isStickerMessage(msg({ type: 'sticker' }))).toBe(true);
    expect(isStickerMessage(msg({ type: 'text' }))).toBe(false);
  });

  it('isVideoMessage is true only for video', () => {
    expect(isVideoMessage(msg({ type: 'video' }))).toBe(true);
    expect(isVideoMessage(msg({ type: 'image' }))).toBe(false);
  });

  it('isFileMessage is true only for file', () => {
    expect(isFileMessage(msg({ type: 'file' }))).toBe(true);
    expect(isFileMessage(msg({ type: 'text' }))).toBe(false);
  });

  it('isLocationMessage is true only for location', () => {
    expect(isLocationMessage(msg({ type: 'location' }))).toBe(true);
    expect(isLocationMessage(msg({ type: 'text' }))).toBe(false);
  });

  it('parseFileContent parses valid JSON', () => {
    const raw = JSON.stringify({
      url: 'https://example.com/doc.pdf',
      name: 'doc.pdf',
      mime: 'application/pdf',
      size: 100,
    });
    expect(parseFileContent(raw)?.name).toBe('doc.pdf');
    expect(parseFileContent('invalid')).toBeNull();
  });

  it('parseLocationContent parses valid JSON', () => {
    const raw = JSON.stringify({ lat: 1.5, lng: 2.5, label: 'Here' });
    const loc = parseLocationContent(raw);
    expect(loc?.lat).toBe(1.5);
    expect(loc?.label).toBe('Here');
    expect(parseLocationContent('{}')).toBeNull();
  });

  it('isAudioMessage is true only for audio', () => {
    expect(isAudioMessage(msg({ type: 'audio' }))).toBe(true);
    expect(isAudioMessage(msg({ type: 'text' }))).toBe(false);
  });

  it('isContactMessage and parseContactContent', () => {
    expect(isContactMessage(msg({ type: 'contact' }))).toBe(true);
    const raw = JSON.stringify({ userId: 'u1', userName: 'Bob' });
    expect(parseContactContent(raw)?.userName).toBe('Bob');
    expect(parseContactContent('{}')).toBeNull();
  });

  it('isPollMessage and parsePollContent', () => {
    expect(isPollMessage(msg({ type: 'poll' }))).toBe(true);
    const raw = JSON.stringify({ question: 'Q?', options: ['A', 'B'] });
    expect(parsePollContent(raw)?.options.length).toBe(2);
    expect(parsePollContent(JSON.stringify({ question: 'x', options: ['one'] }))).toBeNull();
  });

  it('parseMetadata and hasForwardedLabel', () => {
    const raw = JSON.stringify({ forwardedFrom: { chatId: 'c', messageId: 'm' } });
    expect(hasForwardedLabel(raw)).toBe(true);
    expect(parseMetadata(raw).forwardedFrom?.messageId).toBe('m');
    expect(hasForwardedLabel(undefined)).toBe(false);
  });
});
