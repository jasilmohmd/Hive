export interface ICommunityUserRef {
  _id: string;
  userName?: string;
  profilePicture?: string;
  status?: boolean;
}

export interface ICommunityRoleRef {
  _id: string;
  name?: string;
}

export default interface ICommunity {
  _id: string;  // Mongoose auto-generates this
  imageUrl: string;
  coverImageUrl: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  ownerId: string | ICommunityUserRef;
  roles: string[];
  channels: string[];
  joinRequests: string[];
  members: { _id?: string; userId: string | ICommunityUserRef; roleIds: Array<string | ICommunityRoleRef> }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}