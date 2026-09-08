/**
 * The canonical set of community permission strings.
 *
 * These are the values stored in `Role.permissions` and checked by
 * `RBACService.hasPermission`. Keep this in sync with the client copy at
 * `client/src/app/constants/permissions.ts`.
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

/** Every permission string, e.g. for validating a role's permission list. */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
