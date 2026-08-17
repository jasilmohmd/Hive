import { Types } from "mongoose";
import IUser from "../../entity/User.entity";

export default interface IProfileUsecase {
  editProfile(userId: Types.ObjectId, newUserName: string): Promise<IUser>;
  changePassword(userId: Types.ObjectId, oldPassword: string, newPassword: string): Promise<IUser>;
  updateAvatar(userId: Types.ObjectId, imageUrl: string | null): Promise<IUser>;
}