import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import IRoleController from "../interfaces/controllers/IRole.controller.interface";
import IRoleUsecase from "../interfaces/usecase/IRole.usecase.interface";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../constants/auth/statusCodes";

/**
 * If you have an extended request interface that includes a userId property,
 * you can import and use it. For example:
 *
 * import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
 * Then replace Request with IAuthRequest in method signatures.
 */
export default class RoleController implements IRoleController {
  constructor(private roleUsecase: IRoleUsecase) {}

  /**
   * Create a new role.
   * Expects:
   *  - communityId, name, and permissions in req.body.
   *  - Authenticated user's ID on req.userId.
   */
  public async createRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId);

      // Extract required values from the request.
      const { name, permissions } = req.body;

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid or missing community ID" });
        return;
      }
      // Call the usecase to create the role.
      const role = await this.roleUsecase.createRole(
        userId,
        communityId,
        { name, permissions }
      );
      res.status(StatusCodes.Created).json(role);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieve a role by its ID.
   * Expects:
   *  - Role ID in req.params.id.
   */
  public async getRoleById(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      if (!id || !Types.ObjectId.isValid(id)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid role ID" });
        return;
      }
      const role = await this.roleUsecase.getRoleById(userId, new Types.ObjectId(id));
      res.status(StatusCodes.Success).json(role);
    } catch (error: any) {
      next(error);
    }
  }

  public async getUserRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId);

      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      

      const roles = await this.roleUsecase.getUserRoles(userId,communityId);

      res.status(StatusCodes.Success).json({roles});
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update an existing role.
   * Expects:
   *  - communityId and roleId in req.params.
   *  - Update data in req.body.
   *  - Authenticated user's ID on req.userId.
   */
  public async updateRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId);
      const roleId = new Types.ObjectId(req.params.roleId);
      const updateData = req.body;
      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      if (!roleId || !Types.ObjectId.isValid(roleId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid role ID" });
        return;
      }
      const updatedRole = await this.roleUsecase.updateRole(
        userId,
        communityId,
        roleId,
        updateData
      );
      res.status(StatusCodes.Success).json(updatedRole);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete a role.
   * Expects:
   *  - communityId and roleId in req.params.
   *  - Authenticated user's ID on req.userId.
   */
  public async deleteRole(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId);
      const roleId = new Types.ObjectId(req.params.roleId);
      if (!userId) {
        res.status(StatusCodes.Unauthorized).json({ error: "Unauthorized" });
        return;
      }
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      if (!roleId || !Types.ObjectId.isValid(roleId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid role ID" });
        return;
      }
      const result = await this.roleUsecase.deleteRole(
        userId,
        communityId,
        roleId
      );
      res.status(StatusCodes.Success).json({ success: result });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * List all roles for a given community.
   * Expects:
   *  - communityId in req.params.communityId.
   */
  public async listRoles(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const userId = req.userId!;
      const communityId = new Types.ObjectId(req.params.communityId);
      if (!communityId || !Types.ObjectId.isValid(communityId)) {
        res.status(StatusCodes.BadRequest).json({ error: "Invalid community ID" });
        return;
      }
      const roles = await this.roleUsecase.listRoles(userId, new Types.ObjectId(communityId));
      res.status(StatusCodes.Success).json(roles);
    } catch (error: any) {
      next(error);
    }
  }
}
