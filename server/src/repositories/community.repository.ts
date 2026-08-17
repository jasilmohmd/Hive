import { Types, Document } from 'mongoose';
import { ICommunity } from '../entity/Community.entity';
import { ICommunityRepository } from '../interfaces/repository/ICommunity.repository.interface';
import { CommunityModel, ICommunityDocument } from '../framework/models/community.model';
import { TagModel } from '../framework/models/tag.model';
import { CategoryModel } from '../framework/models/communityCategory.model';
import { ICategory } from '../entity/CommunityCategory.entity';
import { ITag } from '../entity/Tag.entity';

export class CommunityRepository implements ICommunityRepository {
  async createCommunity(data: ICommunity): Promise<ICommunityDocument> {
    const community = new CommunityModel(data) as ICommunityDocument;
    return await community.save();
  }

  async getCommunityById(id: Types.ObjectId): Promise<ICommunityDocument | null> {
    return (await CommunityModel.findById(id)
      .populate('ownerId roles channels members.userId members.roleIds tags')) as ICommunityDocument | null;
  }

  async getCommunityByName(name: string): Promise<ICommunityDocument | null> {
    return (await CommunityModel.findOne({ name })
      .populate('roles channels members.userId members.roleIds tags')) as ICommunityDocument | null;
  }

  async getAllCommunities(): Promise<ICommunityDocument[]> {
    return (await CommunityModel.find()
      .populate('roles channels members.userId members.roleIds tags')) as ICommunityDocument[];
  }

  /**
   * Get all communities a user is a member of.
   */
  async getCommunitiesByUser(userId: Types.ObjectId): Promise<ICommunityDocument[]> {
    return (await CommunityModel.find({
      "members.userId": userId
    }).populate('roles channels members.userId members.roleIds tags')) as ICommunityDocument[];
  }

  /**
   * Search communities by name.
   * Returns communities whose names match the search term (case-insensitive).
   */
  async searchCommunities(searchTerm: string): Promise<ICommunityDocument[]> {
    return (await CommunityModel.find({
      name: { $regex: searchTerm, $options: 'i' } // Case-insensitive search.
    }).populate('roles channels members.userId members.roleIds tags')) as ICommunityDocument[];
  }

  async addJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const community = await CommunityModel.findById(communityId);
    if (!community) return false;

    if (community.joinRequests.includes(userId)) {
      return false; // User already requested to join
    }

    community.joinRequests.push(userId);
    await community.save();
    return true;
  }

  async removeJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const result = await CommunityModel.updateOne(
      { _id: communityId },
      { $pull: { joinRequests: userId } }
    );
    return result.modifiedCount > 0;
  }

  async getJoinRequests(communityId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const community = await CommunityModel.findById(communityId);
    return community ? community.joinRequests : [];
  }

  async approveJoinRequest(communityId: Types.ObjectId, userId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {
    const community = await CommunityModel.findById(communityId);
    if (!community) return false;

    // Ensure the user has a pending request
    if (!community.joinRequests.includes(userId)) return false;

    // Add the user to members and remove from joinRequests
    community.members.push({
      userId: userId,
      roleIds: [roleId],
    });
    community.joinRequests = community.joinRequests.filter(id => !id.equals(userId));

    await community.save();
    return true;
  }

  async updateCommunity(id: Types.ObjectId, data: Partial<ICommunity>): Promise<ICommunityDocument | null> {
    return (await CommunityModel.findByIdAndUpdate(id, data, { new: true })) as ICommunityDocument | null;
  }

  async deleteCommunity(id: Types.ObjectId): Promise<boolean> {
    const result = await CommunityModel.findByIdAndDelete(id);
    return result ? true : false;
  }



  async getUserRoles(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const community = await this.getCommunityById(communityId);
    if (!community) return [];
    return community.members
      .filter(member => member.userId.equals(userId))
      .flatMap(member => member.roleIds);
  }

  async addMember(communityId: Types.ObjectId, userId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {
    const community = await this.getCommunityById(communityId);
    if (!community) return false;
    // Prevent adding the same member twice.
    if (community.members.some(member => member.userId === userId)) return false;
    community.members.push({
      userId: userId,
      roleIds: [roleId],
    });
    await community.save();
    return true;
  }

  async removeMember(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const community = await this.getCommunityById(communityId);
    if (!community) return false;
    const initialLength = community.members.length;
    community.members = community.members.filter(member => member.userId !== userId);
    await community.save();
    return community.members.length < initialLength;
  }

  /**
   * Add a tag to a community.
   */
  async addTag(communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean> {
    const community = await this.getCommunityById(communityId);
    if (!community) return false;
    // Check if the tag already exists.
    if (community.tags.some(t => t === tagId)) return false;
    community.tags.push(new Types.ObjectId(tagId));
    await community.save();
    return true;
  }

  /**
   * Remove a tag from a community.
   */
  async removeTag(communityId: Types.ObjectId, tagId: Types.ObjectId): Promise<boolean> {
    const community = await this.getCommunityById(communityId);
    if (!community) return false;
    const initialLength = community.tags.length;
    community.tags = community.tags.filter(t => t !== tagId);
    await community.save();
    return community.tags.length < initialLength;
  }

  /**
  * Filter communities by a specific tag.
  */
  async filterCommunitiesByTag(tagId: Types.ObjectId): Promise<ICommunityDocument[]> {
    return (await CommunityModel.find({
      tags: { $in: [tagId] }
    }).populate('roles channels members.userId members.roleIds tags')) as ICommunityDocument[];
  }


  /**
   * Filter communities by category.
   * Since categories are stored in Tag documents, first retrieve all tags having the category,
   * then find communities that reference any of those tags.
   */
  async filterCommunitiesByCategory(categoryId: Types.ObjectId): Promise<ICommunityDocument[]> {
    // Import TagModel to query tags.
    const tags = await TagModel.find({ categories: new Types.ObjectId(categoryId) });
    const tagIds = tags.map(tag => tag._id);
    return (await CommunityModel.find({ tags: { $in: tagIds } })
      .populate('roles channels members.userId members.roleId tags')) as ICommunityDocument[];
  }

  /**
  * Retrieve all tags.
  */
  async getTags(): Promise<(ITag & Document)[]> {
    return await TagModel.find({});
  }

  async getTagById(id: Types.ObjectId): Promise<ITag | null> {
    return await TagModel.findOne({_id: id});
  }

  /**
   * Retrieve all categories.
   */
  async getCategories(): Promise<(ICategory & Document)[]> {
    return await CategoryModel.find({});
  }

}
