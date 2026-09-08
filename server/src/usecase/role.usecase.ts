import { Types } from 'mongoose';
import { IRoleRepository } from '../interfaces/repository/IRole.repository.interface';
import { IRole } from '../entity/Role.entity';
import { UnauthorizedError, NotFoundError, ValidationError, CustomError } from '../errors/customError.error';
import { roleValidator } from '../framework/utils/validators/role.validator';
import { ZodError } from 'zod';
import IRoleUsecase from '../interfaces/usecase/IRole.usecase.interface';
import IRBACService from '../interfaces/utils/IRBAC.service';
import { PERMISSIONS } from '../constants/permissions';
import { ICommunityRepository } from '../interfaces/repository/ICommunity.repository.interface';


export class RoleUseCase implements IRoleUsecase {
  constructor(
    private roleRepository: IRoleRepository,
    private rbacService: IRBACService,
    private communityRepository: ICommunityRepository
  ) { }

  /** Parse role input, turning a Zod failure into a 400 ValidationError instead of a 500. */
  private parseRole(data: unknown): { name: string; permissions: string[] } {
    try {
      return roleValidator.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0]?.message || 'Invalid role data', 'role');
      }
      throw error;
    }
  }

  /** True when `userId` owns the community. `ownerId` may be a populated doc. */
  private async isCommunityOwner(communityId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
    const community = await this.communityRepository.getCommunityById(communityId);
    if (!community) throw new NotFoundError('Community not found', 'community');
    const owner = community.ownerId as unknown as { _id?: Types.ObjectId } | Types.ObjectId;
    const ownerId = (owner && (owner as { _id?: Types.ObjectId })._id) || (owner as Types.ObjectId);
    return new Types.ObjectId(ownerId).equals(userId);
  }

  /** Shared checks for assign/unassign: valid ids, role in community, caller holds MANAGE_ROLES, target isn't the owner. */
  private async guardRoleAssignment(
    actingUserId: Types.ObjectId,
    communityId: Types.ObjectId,
    memberId: Types.ObjectId,
    roleId: Types.ObjectId
  ): Promise<void> {
    if (!Types.ObjectId.isValid(communityId)) throw new ValidationError('Invalid Community ID', 'community');
    if (!Types.ObjectId.isValid(memberId)) throw new ValidationError('Invalid Member ID', 'member');
    if (!Types.ObjectId.isValid(roleId)) throw new ValidationError('Invalid Role ID', 'role');

    const role = await this.getRoleByIdRaw(roleId);
    if (!role.communityId.equals(communityId)) {
      throw new ValidationError('Role does not belong to this community', 'role');
    }

    const allowed = await this.rbacService.hasPermission(actingUserId, communityId, PERMISSIONS.MANAGE_ROLES);
    if (!allowed) throw new UnauthorizedError('Permission denied', 'roles');

    if (await this.isCommunityOwner(communityId, memberId)) {
      throw new ValidationError("The community owner's roles cannot be changed", 'role');
    }
  }

  async assignRole(
    actingUserId: Types.ObjectId,
    communityId: Types.ObjectId,
    memberId: Types.ObjectId,
    roleId: Types.ObjectId
  ): Promise<boolean> {
    try {
      await this.guardRoleAssignment(actingUserId, communityId, memberId, roleId);
      return await this.roleRepository.assignRole(memberId, communityId, roleId);
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error assigning role: ${error.message}`);
    }
  }

  async unassignRole(
    actingUserId: Types.ObjectId,
    communityId: Types.ObjectId,
    memberId: Types.ObjectId,
    roleId: Types.ObjectId
  ): Promise<boolean> {
    try {
      await this.guardRoleAssignment(actingUserId, communityId, memberId, roleId);

      // A member must keep at least one role — otherwise removeRole would drop
      // the member entry entirely, and a role-less member has no permissions.
      const current = await this.roleRepository.getUserRoles(memberId, communityId);
      const hasRole = current.some(r => (r._id as Types.ObjectId).equals(roleId));
      if (!hasRole) return true; // already not assigned
      if (current.length <= 1) {
        throw new ValidationError("A member must keep at least one role", 'role');
      }

      return await this.roleRepository.removeRole(memberId, communityId, roleId);
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error removing role: ${error.message}`);
    }
  }

  /**
   * Create a new role for a community.
   * Throws a ValidationError if a role with the same name already exists.
   */
  async createRole(userId: Types.ObjectId, communityId: Types.ObjectId, data: { name: string; permissions: string[]; }): Promise<IRole> {

    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const validatedData = this.parseRole(data);

      // Check if the role already exists in this community.
      const existingRole = await this.roleRepository.getRoleByName(validatedData.name, communityId);
      if (existingRole) {
        throw new ValidationError("Role already exists", "role");
      }

      // Check if the user has permission to create a channel.
      const allowed = await this.rbacService.hasPermission(userId, communityId, PERMISSIONS.MANAGE_ROLES);
      if (!allowed) throw new UnauthorizedError("Permission denied", "roles");

      const roleData: IRole = {
        _id: undefined, // Will be assigned by MongoDB
        communityId: communityId,
        name: validatedData.name,
        permissions: validatedData.permissions,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.roleRepository.createRole(roleData);

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error crating role: ${error.message}`);
    }

  }

  /**
   * Get a role by its ID, without checking the caller's membership.
   * For internal use only (e.g. by updateRole/deleteRole, which already
   * gate on the caller holding MANAGE_ROLES in that role's community).
   */
  private async getRoleByIdRaw(id: Types.ObjectId): Promise<IRole> {

    try {

      const role = await this.roleRepository.getRoleById(id);
      if (!role) {
        throw new NotFoundError("Role not found", "role");
      }
      return role;

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error geting role: ${error.message}`);
    }

  }

  /**
   * Get a role by its ID. Only members of the role's community may view it.
   */
  async getRoleById(userId: Types.ObjectId, id: Types.ObjectId): Promise<IRole> {

    try {

      const role = await this.getRoleByIdRaw(id);

      const membership = await this.roleRepository.getUserRoles(userId, role.communityId);
      if (!membership || membership.length === 0) {
        throw new UnauthorizedError("Permission denied", "role");
      }

      return role;

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error geting role: ${error.message}`);
    }

  }

  async getUserRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]> {

    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const roles = await this.roleRepository.getUserRoles(userId, communityId);

      return roles

    } catch (error:any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error geting roles: ${error.message}`);
    }

  }

  /**
   * Update an existing role.
   * For security, default roles (Owner, Admin, etc.) might be non-editable.
   */
  async updateRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId, data: Partial<IRole>): Promise<IRole> {

    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const role = await this.getRoleByIdRaw(roleId);
      if (role.isDefault) {
        throw new UnauthorizedError("Cannot update default role", "role");
      }

      // Check if the user has permission to create a channel.
      const allowed = await this.rbacService.hasPermission(userId, communityId, PERMISSIONS.MANAGE_ROLES);
      if (!allowed) throw new UnauthorizedError("Permission denied", "roles");

      const validatedData = this.parseRole(data);

      const updatedRole = await this.roleRepository.updateRole(roleId, validatedData);
      if (!updatedRole) {
        throw new NotFoundError("Role not found or update failed", "role");
      }
      return updatedRole;

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error updating role: ${error.message}`);
    }

  }

  /**
   * Delete a role.
   * Prevent deletion of default roles.
   */
  async deleteRole(userId: Types.ObjectId, communityId: Types.ObjectId, roleId: Types.ObjectId): Promise<boolean> {

    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const role = await this.getRoleByIdRaw(roleId);
      if (role.isDefault) {
        throw new UnauthorizedError("Cannot delete default role", "role");
      }
      if (!role.communityId.equals(communityId)) {
        throw new ValidationError("Role does not belong to this community", "role");
      }

      const allowed = await this.rbacService.hasPermission(userId, communityId, PERMISSIONS.MANAGE_ROLES);
      if (!allowed) throw new UnauthorizedError("Permission denied", "roles");

      const result = await this.roleRepository.deleteRole(roleId);
      if (!result) {
        throw new Error("Failed to delete role");
      }
      // Keep member role lists in sync — no dangling refs.
      await this.roleRepository.detachRoleFromAllMembers(communityId, roleId);
      return result;

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error deleting role: ${error.message}`);
    }


  }

  /**
   * List all roles for a given community. Only members of that community may list them.
   */
  async listRoles(userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IRole[]> {

    try {

      if (!Types.ObjectId.isValid(communityId)) {
        throw new ValidationError("Invalid Community ID", "community");
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError("Invalid Admin ID", "admin");
      }

      const membership = await this.roleRepository.getUserRoles(userId, communityId);
      if (!membership || membership.length === 0) {
        throw new UnauthorizedError("Permission denied", "role");
      }

      return await this.roleRepository.getAllRoles(communityId);

    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new Error(`Error listing roles: ${error.message}`);
    }

  }

  /**
   * Optionally, add additional methods for role management as needed.
   */
}
