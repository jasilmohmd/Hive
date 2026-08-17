import bcrypt from "bcrypt";
import { ErrorCode } from "../constants/auth/errorCode";
import { ErrorField } from "../constants/auth/errorField";
import StatusCodes from "../constants/auth/statusCodes";
import IUser from "../entity/User.entity";
import ValidationError from "../errors/validationError.error";
import Users from "../framework/models/user.model";
import IProfileRepository from "../interfaces/repository/IProfile.repository.interface";
import ErrorMessage from "../constants/auth/errorMessage";
import { Types } from "mongoose";

export default class ProfileRepository implements IProfileRepository {

  /**
   * Update the user's username.
   */
  async editProfile(userId: Types.ObjectId, newUserName: string): Promise<IUser> {

    // Check if the new username already exists in the database
    const existingUser = await Users.findOne({ userName: newUserName });
    // If a user is found and it's not the current user, throw an error
    if (existingUser && existingUser._id !== userId) {
      throw new ValidationError({
        statusCode: StatusCodes.Conflict,
        errorField: ErrorField.USER,
        message: ErrorMessage.USERNAME_ALREADY_TAKEN,
        errorCode: ErrorCode.USERNAME_TAKEN,
      });
    }

    // Proceed with updating the username
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { userName: newUserName },
      { new: true }
    );
    if (!updatedUser) {
      throw new ValidationError({
        statusCode: StatusCodes.NotFound,
        errorField: ErrorField.USER,
        message: ErrorMessage.USER_NOT_FOUND,
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    }
    return updatedUser;
  }

  /**
   * Update the user's password.
   * Note: In a real-world application, you should hash the new password before saving.
   */
  async changePassword(userId: Types.ObjectId, oldPassword: string, newPassword: string): Promise<IUser> {
    // Find the user by ID
    const user = await Users.findById(userId);
    if (!user) {
      throw new ValidationError({
        statusCode: StatusCodes.NotFound,
        errorField: ErrorField.USER,
        message: "User not found.",
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    }

    // Compare old password with stored hashed password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new ValidationError({
        statusCode: StatusCodes.Unauthorized,
        errorField: ErrorField.PASSWORD,
        message: "Old password is incorrect.",
        errorCode: ErrorCode.INVALID_INPUT,
      });
    }

    // Prevent using the same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.PASSWORD,
        message: "New password cannot be the same as the old password.",
        errorCode: ErrorCode.PASSWORD_INVALID,
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    return user;
  }

  async updateAvatar(userId: Types.ObjectId, imageUrl: string | null): Promise<IUser> {
    const update =
      imageUrl === null || imageUrl === ""
        ? { $unset: { imageUrl: 1 } }
        : { imageUrl };

    const updatedUser = await Users.findByIdAndUpdate(userId, update, {
      new: true,
    });
    if (!updatedUser) {
      throw new ValidationError({
        statusCode: StatusCodes.NotFound,
        errorField: ErrorField.USER,
        message: ErrorMessage.USER_NOT_FOUND,
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    }
    return updatedUser;
  }

}