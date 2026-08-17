import { isObjectIdOrHexString, Types } from "mongoose";
import { z } from "zod";
import IProfileUsecase from "../interfaces/usecase/IProfile.usecase.interface";
import ValidationError from "../errors/validationError.error";
import StatusCodes from "../constants/auth/statusCodes";
import { ErrorField } from "../constants/auth/errorField";
import { ErrorCode } from "../constants/auth/errorCode";
import IProfileRepository from "../interfaces/repository/IProfile.repository.interface";
import IUser from "../entity/User.entity";

export default class ProfileUSecase implements IProfileUsecase {

  private profileRepository: IProfileRepository;

  constructor(profileRepository: IProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async editProfile(userId: Types.ObjectId, newUserName: string): Promise<IUser> {
    if (!isObjectIdOrHexString(userId) || !newUserName) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "User ID and new username are required.",
        errorCode: ErrorCode.INVALID_INPUT,
      });
    }
    return await this.profileRepository.editProfile(userId, newUserName);
  }

  async changePassword(userId: Types.ObjectId, oldPassword: string, newPassword: string): Promise<IUser> {
    if (!isObjectIdOrHexString(userId) || !newPassword) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "User ID and new password are required.",
        errorCode: ErrorCode.INVALID_INPUT,
      });
    }
    return await this.profileRepository.changePassword(userId, oldPassword, newPassword);
  }

  async updateAvatar(userId: Types.ObjectId, imageUrl: string | null): Promise<IUser> {
    if (!isObjectIdOrHexString(userId)) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.USER,
        message: "User ID is required.",
        errorCode: ErrorCode.INVALID_INPUT,
      });
    }

    if (imageUrl !== null && imageUrl !== "") {
      z.string().url({ message: "Invalid image URL" }).parse(imageUrl);
    }

    return await this.profileRepository.updateAvatar(
      userId,
      imageUrl === "" ? null : imageUrl
    );
  }

}