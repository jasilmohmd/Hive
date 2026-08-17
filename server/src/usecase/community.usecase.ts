import { ICommunityRepository } from '../interfaces/repository/ICommunity.repository.interface';
import { ICommunity } from '../entity/Community.entity';

import { UnauthorizedError, NotFoundError, ValidationError, CustomError } from '../errors/customError.error';
import { Types } from 'mongoose';
import { IRoleRepository } from '../interfaces/repository/IRole.repository.interface';
import { ICommunityDocument } from '../framework/models/community.model';
import { communityValidator, communityUpdateValidator } from '../framework/utils/validators/community.validator';
import { defaultRolesData } from '../constants/predifinedRoles';
import IRBACService from '../interfaces/utils/IRBAC.service';
import { ITag } from '../entity/Tag.entity';
import { ICategory } from '../entity/CommunityCategory.entity';



export class CommunityUseCase {
  constructor(
    private communityRepository: ICommunityRepository,
    private roleRepository: IRoleRepository,
    private rbacService: IRBACService
  ) { }

  /**
   * Create a new community and automatically generate default roles.
   */
  async createCommunity(data: { imageUrl: string, coverImageUrl: string, name: string; description?: string; type: 'public' | 'private'; ownerId: string; tags?: string[] }): Promise<ICommunity> {
    try {


      const validatedData = communityValidator.parse(data);


      // Check for duplicate community name.
      const existingCommunity = await this.communityRepository.getCommunityByName(data.name);
      if (existingCommunity) {
        throw new ValidationError("Community with this name already exists", "community");
      }

      // Build new community object.
      const newCommunity: ICommunity = {
        _id: undefined, // MongoDB will assign this.
        ...validatedData, // ✅ Use validated data
        roles: [],
        channels: [],
        members: [],
        joinRequests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create the community.
      const createdCommunity = await this.communityRepository.createCommunity(newCommunity) as ICommunityDocument;

      // Define default roles.
      const RolesData = defaultRolesData

      // Create default roles for this community.
      const createdRoles = await Promise.all(RolesData.map(async (roleData) => {
        return await this.roleRepository.createRole({
          _id: undefined,
          communityId: createdCommunity._id as Types.ObjectId,
          name: roleData.name,
          permissions: roleData.permissions,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }));

      // Update the community document with the default role IDs.
      createdCommunity.roles = createdRoles.map(role => role._id as Types.ObjectId);
      await createdCommunity.save();

      // Assign the owner (community creator) the "Owner" role.
      const ownerRole = createdRoles.find(role => role.name === "Owner");
      if (ownerRole) {
        await this.roleRepository.assignRole( validatedData.ownerId!,createdCommunity._id!, ownerRole._id!);
      } else {
        throw new CustomError({ statusCode: 500, message: "Owner role not created", errorField: "role" });
      }

      return createdCommunity;
    } catch (error: any) {
      throw new Error(`Failed to create community: ${error.message}`);
    }
  }

  /**
   * Get a community by its ID.
   */
  async getCommunityById(communityId: Types.ObjectId): Promise<ICommunity> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");
      return community;
    } catch (error: any) {
      throw new Error(`Error fetching community: ${error.message}`);
    }
  }

  /**
   * Search communities by name.
   * Returns communities whose names match the search term (case-insensitive).
   */
  async searchCommunitiesByName(searchTerm: string): Promise<ICommunity[]> {
    try {
      // Assumes communityRepository.searchCommunities is implemented.
      const communities = await this.communityRepository.searchCommunities(searchTerm);
      if (!communities || communities.length === 0) {
        throw new NotFoundError("No communities found", "community");
      }
      return communities;
    } catch (error: any) {
      throw new Error(`Error searching communities: ${error.message}`);
    }
  }

  /**
   * Update a community.
   * Only allowed for users with the "MANAGE_COMMUNITY" permission.
   */
  async updateCommunity(userId: Types.ObjectId, communityId: Types.ObjectId, data: Partial<ICommunity>): Promise<ICommunity> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_COMMUNITY");
      if (!allowed) throw new UnauthorizedError("Permission denied", "community");

      const validatedData = communityUpdateValidator.parse(data);

      const updatedCommunity = await this.communityRepository.updateCommunity(communityId, validatedData);
      if (!updatedCommunity) throw new Error("Update failed");
      return updatedCommunity;
    } catch (error: any) {
      throw new Error(`Error updating community: ${error.message}`);
    }
  }

  /**
   * Delete a community.
   * Only allowed for users with the "MANAGE_COMMUNITY" permission.
   */
  async deleteCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_COMMUNITY");
      if (!allowed) throw new UnauthorizedError("Permission denied", "community");

      const result = await this.communityRepository.deleteCommunity(communityId);
      if (!result) throw new Error("Deletion failed");
      return result;
    } catch (error: any) {
      throw new Error(`Error deleting community: ${error.message}`);
    }
  }

  /**
   * List all communities.
   */
  async listCommunities(): Promise<ICommunity[]> {
    try {
      return await this.communityRepository.getAllCommunities();
    } catch (error: any) {
      throw new Error(`Error listing communities: ${error.message}`);
    }
  }

  /**
   * Get all communities a user is a member of.
   */
  async getCommunitiesByUser(userId: Types.ObjectId): Promise<ICommunity[]> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      const communities = await this.communityRepository.getCommunitiesByUser(userId);
      if (!communities || communities.length === 0) {
        throw new NotFoundError("No communities found for the user", "community");
      }
      return communities;
    } catch (error: any) {
      throw new Error(`Error fetching communities for user: ${error.message}`);
    }
  }

  async requestToJoinCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }


      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      // Check if user is already a member
      if (community.members.some(member => member.userId === userId)) {
        throw new ValidationError("User is already a member", "community");
      }

      // Prevent duplicate requests
      const existingRequests = await this.communityRepository.getJoinRequests(communityId);
      if (existingRequests.includes(new Types.ObjectId(userId))) {
        throw new ValidationError("Join request already sent", "community");
      }

      return await this.communityRepository.addJoinRequest(communityId, userId);
    } catch (error: any) {
      throw new Error(`Error sending join request: ${error.message}`);
    }
  }

  async approveJoinRequest(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(memberId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      if (!Types.ObjectId.isValid(roleId)) {
        throw new ValidationError("Invalid Role ID", "role");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      // Check if admin has permission
      const hasPermission = await this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
      if (!hasPermission) throw new UnauthorizedError("Permission denied", "community");

      return await this.communityRepository.approveJoinRequest(communityId, memberId, roleId);
    } catch (error: any) {
      throw new Error(`Error approving join request: ${error.message}`);
    }
  }

  async rejectJoinRequest(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(memberId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      // Check if admin has permission
      const hasPermission = await this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
      if (!hasPermission) throw new UnauthorizedError("Permission denied", "community");

      return await this.communityRepository.removeJoinRequest(communityId, memberId);
    } catch (error: any) {
      throw new Error(`Error rejecting join request: ${error.message}`);
    }
  }


  /**
   * Leave a community.
   */
  async leaveCommunity(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const result = await this.communityRepository.removeMember(communityId, userId);
      if (!result) throw new Error("Failed to leave community");
      return result;
    } catch (error: any) {
      throw new Error(`Error leaving community: ${error.message}`);
    }
  }


  async addMember(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(memberId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      if (!Types.ObjectId.isValid(roleId)) {
        throw new ValidationError("Invalid Role ID", "role");
      }

      // const community = await this.communityRepository.getCommunityById(communityId);
      // if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
      if (!allowed) throw new UnauthorizedError("Permission denied", "community");

      const result = await this.communityRepository.addMember(communityId, memberId, roleId);
      if (!result) throw new Error("Failed to add member");
      return result;
    } catch (error: any) {
      throw new Error(`Error adding member: ${error.message}`);
    }
  }

  async removeMember(userId: Types.ObjectId, communityId: Types.ObjectId, memberId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid User ID", "user");
      }

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(memberId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_MEMBERS");
      if (!allowed) throw new UnauthorizedError("Permission denied", "community");

      const result = await this.communityRepository.removeMember(communityId, memberId);
      if (!result) throw new Error("Failed to remove member");
      return result;
    } catch (error: any) {
      throw new Error(`Error removing member: ${error.message}`);
    }
  }



  /**
   * Add a tag to a community.
   */
  async addTag(userId: Types.ObjectId, communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(tagId)) {
        throw new ValidationError("Invalid Tag ID", "tag");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_TAG");
      if (!allowed) throw new UnauthorizedError("Permission denied", "tag");

      const result = await this.communityRepository.addTag(communityId, tagId);
      if (!result) throw new Error("Failed to add tag to community");
      return result;
    } catch (error: any) {
      throw new Error(`Error adding tag to community: ${error.message}`);
    }
  }

  /**
   * Remove a tag from a community.
   */
  async removeTag(userId: Types.ObjectId, communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean> {
    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(tagId)) {
        throw new ValidationError("Invalid Tag ID", "tag");
      }

      const community = await this.communityRepository.getCommunityById(communityId);
      if (!community) throw new NotFoundError("Community not found", "community");

      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_TAG");
      if (!allowed) throw new UnauthorizedError("Permission denied", "tag");

      const result = await this.communityRepository.removeTag(communityId, tagId);
      if (!result) throw new Error("Failed to remove tag from community");
      return result;
    } catch (error: any) {
      throw new Error(`Error removing tag from community: ${error.message}`);
    }
  }

  /**
   * Filter communities by a specific tag.
   */
  async filterCommunitiesByTag(tagId: Types.ObjectId): Promise<ICommunity[]> {
    try {

      if (!Types.ObjectId.isValid(tagId)) {
        throw new ValidationError("Invalid Tag ID", "tag");
      }

      const communities = await this.communityRepository.filterCommunitiesByTag(tagId);
      if (!communities || communities.length === 0) {
        throw new NotFoundError("No communities found for the given tag", "community");
      }
      return communities;
    } catch (error: any) {
      throw new Error(`Error filtering communities by tag: ${error.message}`);
    }
  }

  /**
   * Filter communities by category.
   * Since categories are stored within Tag documents, this method finds tags with the given category,
   * then finds communities that reference those tags.
   */
  async filterCommunitiesByCategory(categoryId: Types.ObjectId): Promise<ICommunity[]> {
    try {

      if (!Types.ObjectId.isValid(categoryId)) {
        throw new ValidationError("Invalid Category ID", "category");
      }

      const communities = await this.communityRepository.filterCommunitiesByCategory(categoryId);
      if (!communities || communities.length === 0) {
        throw new NotFoundError("No communities found for the given category", "community");
      }
      return communities;
    } catch (error: any) {
      throw new Error(`Error filtering communities by category: ${error.message}`);
    }
  }

  /**
   * List all Tags.
   */
  async getAllTags(): Promise<ITag[]> {
    try {
      return await this.communityRepository.getTags();
    } catch (error: any) {
      throw new Error(`Error listing tags: ${error.message}`);
    }
  }

  async getTagById(id: Types.ObjectId): Promise<ITag | null> {
    try {
      return await this.communityRepository.getTagById(id);
    } catch (error: any) {
      throw new Error(`Error finding tag: ${error.message}`);
    }
  }

  /**
   * List all Categories.
   */
  async getCategories(): Promise<ICategory[]> {
    try {
      return await this.communityRepository.getCategories();
    } catch (error: any) {
      throw new Error(`Error listing categories: ${error.message}`);
    }
  }

}
