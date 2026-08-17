export interface IRole {
  _id?: string; // Automatically assigned by MongoDB
  communityId: string; // Associates the role with a specific community
  name: string;
  permissions: string[]; // e.g., ['MANAGE_CHANNELS', 'MANAGE_ROLES']
  isDefault?: boolean; // True if the role is one of the predefined roles (Owner, Admin, etc.)
}