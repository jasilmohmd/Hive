import { Types } from "mongoose";
import { ICommunity } from "../../entity/Community.entity";
import { ITag } from "../../entity/Tag.entity";
import { ICategory } from "../../entity/CommunityCategory.entity";

export interface ICommunityRepository {
  createCommunity(data: ICommunity): Promise<ICommunity>;
  getCommunityByName(name: string): Promise<ICommunity | null>;
  getCommunityById(id: Types.ObjectId): Promise<ICommunity | null>;
  getAllCommunities(): Promise<ICommunity[]>;
  getCommunitiesByUser(userId: Types.ObjectId): Promise<ICommunity[]>;
  searchCommunities(searchTerm: string): Promise<ICommunity[]>;
  addJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  removeJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  getJoinRequests(communityId: Types.ObjectId): Promise<Types.ObjectId[]>;
  approveJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  updateCommunity(id: Types.ObjectId, data: Partial<ICommunity>): Promise<ICommunity | null>;
  deleteCommunity(id: Types.ObjectId): Promise<boolean>;
  getUserRoles(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<Types.ObjectId[]>;
  addMember(communityId: Types.ObjectId, userId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  removeMember(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  addTag(communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean>;
  removeTag(communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean>;
  filterCommunitiesByTag(tagId: Types.ObjectId): Promise<ICommunity[]>;
  filterCommunitiesByCategory(categoryId: Types.ObjectId): Promise<ICommunity[]>;
  getTags(): Promise< ITag []>;
  getTagById(id: Types.ObjectId): Promise<ITag | null>;
  getCategories(): Promise<ICategory[]>;
}
