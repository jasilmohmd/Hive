import { PERMISSIONS as P } from './permissions';

// Define default roles. Seeded per-community at creation time.
export const defaultRolesData = [
  {
    name: 'Owner',
    permissions: [
      P.MANAGE_COMMUNITY, P.MANAGE_ROLES, P.MANAGE_MEMBERS, P.MANAGE_CHANNELS,
      P.MANAGE_TAG, P.KICK_MEMBERS, P.VIEW_CONTENT, P.SEND_MESSAGES,
    ],
  },
  {
    name: 'Admin',
    permissions: [
      P.MANAGE_ROLES, P.MANAGE_MEMBERS, P.MANAGE_CHANNELS, P.MANAGE_TAG,
      P.KICK_MEMBERS, P.VIEW_CONTENT, P.SEND_MESSAGES,
    ],
  },
  { name: 'Moderator', permissions: [P.MANAGE_CHANNELS, P.KICK_MEMBERS, P.VIEW_CONTENT, P.SEND_MESSAGES] },
  { name: 'Member', permissions: [P.VIEW_CONTENT, P.SEND_MESSAGES] },
  { name: 'Guest', permissions: [P.VIEW_CONTENT] },
];
