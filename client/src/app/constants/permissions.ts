/**
 * Community permission strings — the values stored in a role's `permissions`
 * array and checked server-side by RBACService.
 *
 * Keep in sync with `server/src/constants/permissions.ts`.
 */
export const PERMISSIONS = {
  MANAGE_COMMUNITY: 'MANAGE_COMMUNITY',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  MANAGE_CHANNELS: 'MANAGE_CHANNELS',
  MANAGE_TAG: 'MANAGE_TAG',
  KICK_MEMBERS: 'KICK_MEMBERS',
  VIEW_CONTENT: 'VIEW_CONTENT',
  SEND_MESSAGES: 'SEND_MESSAGES',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Display metadata for the role editor, in the order they should be listed. */
export const PERMISSION_LIST: { key: Permission; label: string; description: string }[] = [
  { key: 'VIEW_CONTENT', label: 'View content', description: 'See channels and messages in the community.' },
  { key: 'SEND_MESSAGES', label: 'Send messages', description: 'Post messages in channels.' },
  { key: 'MANAGE_CHANNELS', label: 'Manage channels', description: 'Create, edit and delete channels.' },
  { key: 'MANAGE_MEMBERS', label: 'Manage members', description: 'Add members, approve join requests, remove members.' },
  { key: 'KICK_MEMBERS', label: 'Kick members', description: 'Remove members (without full member management).' },
  { key: 'MANAGE_TAG', label: 'Manage tags', description: 'Add and remove community tags.' },
  { key: 'MANAGE_ROLES', label: 'Manage roles', description: 'Create roles and assign them to members.' },
  { key: 'MANAGE_COMMUNITY', label: 'Manage community', description: 'Edit community details and delete the community.' },
];
