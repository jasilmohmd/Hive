import { Types } from "mongoose";
import IUser, { ILoginCredentials, IRegisterationCredentials } from "../../entity/User.entity";

export default interface IAuthUseCase {
  handleUserRegister(data:IRegisterationCredentials):Promise<string|never>;
  handleUserLogin(data:ILoginCredentials):Promise<string|never>;
  handleUserLogout(userId: Types.ObjectId): Promise<void>;
  isUserAuthenticated(token: string | undefined): Promise<void | never>;
  sendVerificationOTP(email: string, mode: string): Promise<void | never>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  setNewPassword(email: string, newPassword: string, confirmPassword: string): Promise<void>;
  getUSerdetails(userId: Types.ObjectId): Promise<IUser| never | null>;
}