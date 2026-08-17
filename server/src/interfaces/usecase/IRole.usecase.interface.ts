import { Types } from "mongoose";
import { IRole } from "../../entity/Role.entity";

export default interface IRoleUsecase {
  createRole(userId: Types.ObjectId, communityId: Types.ObjectId, data: { name: string; permissions: string[]; }): Promise<IRole>;
  getRoleById(userId: Types.ObjectId, id: Types.ObjectId): Promise<IRole>;
  getUserRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]>;
  updateRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId, data: Partial<IRole>): Promise<IRole>;
  deleteRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean>;
  listRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]>;
}