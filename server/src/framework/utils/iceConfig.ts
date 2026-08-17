export interface IIceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const DEFAULT_STUN: IIceServerConfig = { urls: "stun:stun.l.google.com:19302" };

export function buildIceServers(): IIceServerConfig[] {
  const servers: IIceServerConfig[] = [DEFAULT_STUN];
  const turnUrl = process.env.TURN_URL?.trim();
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.TURN_USERNAME?.trim(),
      credential: process.env.TURN_CREDENTIAL?.trim(),
    });
  }
  return servers;
}
