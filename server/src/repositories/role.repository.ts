
import { Types } from 'mongoose';
import { IRoleRepository } from '../interfaces/repository/IRole.repository.interface';
import { IRole } from '../entity/Role.entity';
import { RoleModel } from '../framework/models/role.model';
import { CommunityModel } from '../framework/models/community.model';

export class RoleRepository implements IRoleRepository {
  async createRole(data: IRole): Promise<IRole> {
    // Ensure isDefault is set; if undefined, default to false.
    if (data.isDefault === undefined) {
      data.isDefault = false;
    }
    const role = new RoleModel(data);
    return await role.save();
  }

  async getRoleById(id: Types.ObjectId): Promise<IRole | null> {
    return await RoleModel.findById(id);
  }

  async getRolesByIds(roleIds: Types.ObjectId[]): Promise<IRole[]> {
    return await RoleModel.find({ _id: { $in: roleIds } });
  }

  // Check for duplicate roles within a community.
  async getRoleByName(name: string, communityId: Types.ObjectId): Promise<IRole | null> {
    return await RoleModel.findOne({ name, communityId });
  }

  // List roles for a given community.
  async getAllRoles(communityId: Types.ObjectId): Promise<IRole[]> {
    return await RoleModel.find({ communityId });
  }

  async updateRole(id: Types.ObjectId, data: Partial<IRole>): Promise<IRole | null> {
    return await RoleModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteRole(id: Types.ObjectId): Promise<boolean> {
    const result = await RoleModel.findByIdAndDelete(id);
    return result ? true : false;
  }

  /**
   * Assign a role to a user in a given community.
   * This creates an entry in the UserRole collection.
   */
  async assignRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {

    const community = await CommunityModel.findById(communityId);

    if (!community) return false

    // Find member entry for the user
    const member = community.members.find(m => m.userId.equals(userId));

    if (member) {
      // If role already exists in the member's roleIds, do nothing
      if (member.roleIds.some(rid => rid.equals(roleId))) {
        return true;
      }
      // Otherwise, add the role to the member's roleIds array
      member.roleIds.push(roleId);
    } else {
      // If the user is not already a member, create a new member entry with the role
      community.members.push({
        userId: userId,
        roleIds: [roleId]
      });
    }
    await community.save();
    return true;

  }



  /**
   * Retrieve all roles assigned to a user in a specific community.
   */
  async getUserRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]> {
    // Fetch the community document
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      console.log("Community not found");
      return [];
    }

    

    // Find the member entry for the user. Explicitly type the member.
    const member = community.members.find((m: { userId: Types.ObjectId; roleIds: Types.ObjectId[] }) =>
      m.userId.equals(userId)
    );
    if (!member || member.roleIds.length === 0) return [];
    
    // Fetch full role details for all role IDs in the member entry.
    return await RoleModel.find({ _id: { $in: member.roleIds } });
  }



  /**
   * Remove a role assignment from a user in a specific community.
   */
  async removeRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {
    // Fetch the community document
    const community = await CommunityModel.findById(communityId);
    if (!community) return false;

    // Find the index of the member entry for the user
    const memberIndex = community.members.findIndex(m => m.userId.equals(userId));
    if (memberIndex === -1) return false; // User is not a member

    // Filter out the specified role from the user's roleIds
    community.members[memberIndex].roleIds = community.members[memberIndex].roleIds.filter(id => !id.equals(roleId));

    // Optionally, if no roles remain for the member, remove the member entry
    if (community.members[memberIndex].roleIds.length === 0) {
      community.members.splice(memberIndex, 1);
    }

    await community.save();
    return true;
  }

}
