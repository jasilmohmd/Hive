import { Types } from "mongoose";
import IUser from "../../entity/User.entity";

export default interface IAuthRepository{
  isUserExist(email: string, userName: string): Promise<IUser | null | never>
  saveOTP(email: string, otp: string, mode: string): Promise<void>
  clearOTP(email: string): Promise<void>
  markOTPVerified(email: string): Promise<void>
  consumeVerifiedOTP(email: string, mode: string): Promise<boolean>
  createUser(data:Omit<IUser, "_id">): Promise<IUser | never>
  updateUserStatus(userId: Types.ObjectId, status: "online" | "offline"): Promise<void>
  getUserDetails(userId: Types.ObjectId): Promise<IUser | never>
  getUserDataByEmail(email: string): Promise<IUser | null | never>
  updatePassword(userId: Types.ObjectId, hashedPassword: string): Promise<Document | null>
}