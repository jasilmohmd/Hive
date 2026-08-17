import { chatSenderColors, chatSenderMessageBubbleStyle } from './chat-sender-color';

describe('chatSenderColors', () => {
  it('returns the same colors for the same user id', () => {
    const a = chatSenderColors('507f1f77bcf86cd799439011');
    const b = chatSenderColors('507f1f77bcf86cd799439011');
    expect(a).toEqual(b);
  });

  it('returns hsl strings for empty id (fallback bucket)', () => {
    const c = chatSenderColors('');
    expect(c.nameColor).toMatch(/^hsl\(/);
    expect(c.avatarBg).toMatch(/^hsla\(/);
    expect(c.avatarFg).toMatch(/^hsl\(/);
  });

  it('produces different palettes for different user ids', () => {
    expect(chatSenderColors('507f191e810c19729de860ea')).not.toEqual(
      chatSenderColors('507f191e810c19729de860eb')
    );
  });
});

describe('chatSenderMessageBubbleStyle', () => {
  it('returns a uniform hsl background keyed to user id for others', () => {
    const s = chatSenderMessageBubbleStyle('user-a', false);
    expect(s['backgroundColor']).toMatch(/^hsl\(/);
  });

  it('uses neutral fill for own messages (no participant tint)', () => {
    const s = chatSenderMessageBubbleStyle('any-id', true);
    expect(s['backgroundColor']).toBe('#2A2A2A');
  });

  it('is stable for the same id', () => {
    expect(chatSenderMessageBubbleStyle('same-id', true)).toEqual(
      chatSenderMessageBubbleStyle('same-id', true)
    );
  });
});
