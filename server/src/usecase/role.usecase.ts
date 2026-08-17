import { Types } from 'mongoose';
import { IRoleRepository } from '../interfaces/repository/IRole.repository.interface';
import { IRole } from '../entity/Role.entity';
import { UnauthorizedError, NotFoundError, ValidationError, CustomError } from '../errors/customError.error';
import { roleValidator } from '../framework/utils/validators/role.validator';
import IRoleUsecase from '../interfaces/usecase/IRole.usecase.interface';
import IRBACService from '../interfaces/utils/IRBAC.service';


export class RoleUseCase implements IRoleUsecase {
  constructor(
    private roleRepository: IRoleRepository,
    private rbacService: IRBACService // Injected for possible permission checks
  ) { }

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

      const validatedData = roleValidator.parse(data);

      // Check if the role already exists in this community.
      const existingRole = await this.roleRepository.getRoleByName(validatedData.name, communityId);
      if (existingRole) {
        throw new ValidationError("Role already exists", "role");
      }

      // Check if the user has permission to create a channel.
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
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
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
      if (!allowed) throw new UnauthorizedError("Permission denied", "roles");

      const validatedData = roleValidator.parse(data);

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

      // Check if the user has permission to create a channel.
      const allowed = await this.rbacService.hasPermission(userId, communityId, "MANAGE_ROLES");
      if (!allowed) throw new UnauthorizedError("Permission denied", "roles");

      const result = await this.roleRepository.deleteRole(roleId);
      if (!result) {
        throw new Error("Failed to delete role");
      }
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
