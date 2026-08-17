import { NextFunction, Request, Response } from "express";
import IProfileController from "../interfaces/controllers/IProfile.controller.interface";
import IProfileUsecase from "../interfaces/usecase/IProfile.usecase.interface";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../constants/auth/statusCodes";

export default class ProfileController implements IProfileController {

  private profileUseCase: IProfileUsecase;

  constructor(profileUseCase: IProfileUsecase) {
    this.profileUseCase = profileUseCase;
  }

  /**
   * Endpoint to update the user's username.
   * Expected request body: { newUserName: string }
   */
  async editProfile(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!
      const { newUserName } = req.body;
      const updatedUser = await this.profileUseCase.editProfile(userId, newUserName);
      res.status(StatusCodes.Success).json({
        message: "Profile updated successfully"
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Endpoint to change the user's password.
   * Expected request body: { newPassword: string }
   */
  async changePassword(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!; // Assume authentication middleware sets req.id
      const { oldPassword, newPassword } = req.body;
      const updatedUser = await this.profileUseCase.changePassword(userId, oldPassword, newPassword);
      res.status(StatusCodes.Success).json({
        message: "Password updated successfully"
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /profile/avatar — body: { imageUrl: string | null }
   * Pass null or empty string to remove the profile photo.
   */
  async updateAvatar(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const raw = req.body?.imageUrl;
      const imageUrl =
        raw === undefined || raw === null ? null : String(raw).trim();
      const normalized =
        imageUrl === "" || imageUrl === "null" ? null : imageUrl;

      await this.profileUseCase.updateAvatar(userId, normalized);
      res.status(StatusCodes.Success).json({
        message: "Profile photo updated successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

}
