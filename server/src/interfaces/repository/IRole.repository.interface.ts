import { Types } from "mongoose";
import { IRole } from "../../entity/Role.entity";

export interface IRoleRepository {
  createRole(data: IRole): Promise<IRole>;
  getRoleById(id: Types.ObjectId): Promise<IRole | null>;
  getRolesByIds(roleIds: Types.ObjectId[]): Promise<IRole[]>
  getRoleByName(name: string, communityId: Types.ObjectId): Promise<IRole | null>
  getAllRoles(communityId: Types.ObjectId): Promise<IRole[]>;
  updateRole(id: Types.ObjectId, data: Partial<IRole>): Promise<IRole | null>;
  deleteRole(id: Types.ObjectId): Promise<boolean>;
  /** Pull a role id out of every member's roleIds in a community (used when the role is deleted). */
  detachRoleFromAllMembers(communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<void>;
  assignRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  getUserRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]>;
  removeRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
}
