import { Types } from "mongoose";
import { ICommunity } from "../../entity/Community.entity";
import { ICategory } from "../../entity/CommunityCategory.entity";
import { ITag } from "../../entity/Tag.entity";

export default interface ICommunityUsecase {
  createCommunity(data: { imageUrl: string, coverImageUrl: string, name: string; description?: string; type: 'public' | 'private'; ownerId: string; tags?: string[] }): Promise<ICommunity>;
  getCommunityById(communityId: Types.ObjectId): Promise<ICommunity>;
  searchCommunitiesByName(searchTerm: string): Promise<ICommunity[]>;
  updateCommunity(userId: Types.ObjectId, communityId: Types.ObjectId, data: Partial<ICommunity>): Promise<ICommunity>;
  deleteCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean>;
  listCommunities(): Promise<ICommunity[]>
  getCommunitiesByUser(userId: Types.ObjectId): Promise<ICommunity[]>;
  requestToJoinCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean>;
  approveJoinRequest(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  rejectJoinRequest(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId): Promise<boolean>;
  leaveCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean>;
  addMember(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  removeMember(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId): Promise<boolean>;
  addTag(userId: Types.ObjectId, communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean>;
  removeTag(userId: Types.ObjectId, communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean>;
  filterCommunitiesByTag(tagId: Types.ObjectId): Promise<ICommunity[]>;
  filterCommunitiesByCategory(categoryId: Types.ObjectId): Promise<ICommunity[]>;
  getAllTags(): Promise<ITag[]>;
  getTagById(id: Types.ObjectId): Promise<ITag | null>;
  getCategories(): Promise<ICategory[]>;
}