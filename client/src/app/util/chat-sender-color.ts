export interface ChatSenderColors {
  nameColor: string;
  avatarBg: string;
  avatarFg: string;
}

function hueFromUserId(userId: string): number {
  const key = userId.length ? userId : '?';
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** Uniform fill: participant tint for others; neutral surface for own messages. */
export function chatSenderMessageBubbleStyle(
  userId: string,
  isOwn: boolean
): Record<string, string> {
  if (isOwn) {
    return {
      backgroundColor: '#2A2A2A',
    };
  }
  const hue = hueFromUserId(userId);
  return {
    backgroundColor: `hsl(${hue} 15% 24%)`,
  };
}

/** Stable accent colors for a user id (dark UI). */
export function chatSenderColors(userId: string): ChatSenderColors {
  const hue = hueFromUserId(userId);
  return {
    nameColor: `hsl(${hue} 76% 68%)`,
    avatarBg: `hsla(${hue} 45% 46% / 0.45)`,
    avatarFg: `hsl(${hue} 85% 88%)`,
  };
}
