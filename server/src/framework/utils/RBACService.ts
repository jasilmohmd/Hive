import { Types } from "mongoose";
import { IRoleRepository } from "../../interfaces/repository/IRole.repository.interface";
import IRBACService from "../../interfaces/utils/IRBAC.service";
import { ICommunityRepository } from "../../interfaces/repository/ICommunity.repository.interface";
import { NotFoundError } from "../../errors/customError.error";


export class RBACService implements IRBACService {
  constructor(private roleRepository: IRoleRepository, private communityRepository: ICommunityRepository ) { }

  async hasPermission(userId: Types.ObjectId, communityId: Types.ObjectId, requiredPermission: string): Promise<boolean> {
     // Fetch community with member roleIds
     const community = await this.communityRepository.getCommunityById(communityId);
     if (!community) throw new NotFoundError("Community not found", "community");
 
     // Find the member entry for the user
     const member = community.members.find(m => m.userId.equals(userId));
     if (!member || !member.roleIds.length) return false; // No roles assigned
 
     // Fetch roles in a single query to optimize performance
     const roles = await this.roleRepository.getRolesByIds(member.roleIds);
 
     // Check if any of the user's roles contain the required permission
     return roles.some(role => role.permissions.includes(requiredPermission));
  }
}
