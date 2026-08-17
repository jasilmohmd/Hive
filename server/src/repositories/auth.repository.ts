import { Types } from "mongoose";
import IUser from "../entity/User.entity";
import OTPModel from "../framework/models/otp.model";
import Users from "../framework/models/user.model";
import IAuthRepository from "../interfaces/repository/IAuth.repository.interface";

export default class AuthRepository implements IAuthRepository {

  constructor() { }

  async isUserExist(email: string, userName: string): Promise<IUser | null | never> {
    try {
      return await Users.findOne({ $or: [{ email: { $regex: new RegExp(`^${email}$`, 'i') } }, { userName: { $regex: new RegExp(`^${userName}$`, 'i') } }] });
    } catch (err: any) {
      throw err;
    }
  }

  async saveOTP(email: string, otp: string, mode: string): Promise<void> {

    try{

      await OTPModel.findOneAndUpdate(
        { email },
        { otp, mode, otpExpiresAt: new Date(Date.now() + 60 * 1000) }, // Expires in 10 minutes
        { upsert: true, new: true }
      );

    }catch(error){
      throw error;
    }
    
  }

  async clearOTP(email: string): Promise<void> {
    try{

      await OTPModel.deleteOne({ email });

    }catch(error){
      throw error
    }
  }

  async createUser(data: Omit<IUser, "_id">): Promise<IUser | never> {

    try {
      // Check if email or username already exists
      const existingUser = await Users.findOne({
        $or: [{ email: data.email }, { userName: data.userName }],
      });

      if (existingUser) {
        const errorMessage =
          existingUser.email === data.email
            ? "Email already exists"
            : "Username already exists";

        throw new Error(errorMessage);
      }

      // Create and save the new user
      const newUser = new Users(data);
      await newUser.save();

      return newUser;
    } catch (error) {
      // Type-check and handle the error
      if (error instanceof Error) {
        console.error("Error creating user:", error.message);
        throw new Error(error.message); // Rethrow with the original message
      }

      // Handle unexpected errors
      console.error("Unexpected error:", error);
      throw new Error("An unexpected error occurred while creating the user");
    }


  }

  async updateUserStatus(userId: Types.ObjectId, status: "online" | "offline"): Promise<void> {
    try{

      await Users.updateOne({ _id: userId }, { $set: { status } });

    }catch(error){
      throw error;
    }
    
  }

  async getUserDataByEmail(email: string): Promise<IUser | null | never> {
    try {
      return await Users.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    } catch (err: any) {
      throw err;
    }
  }

  async getUserDetails(userId: Types.ObjectId): Promise<IUser | never>{

    try{

       // Use lean() to return a plain JavaScript object matching IUser
       const user = await Users.findOne({ _id: userId }).lean<IUser>();

       if (!user) {
         throw new Error(`User with ID ${userId} not found`);
       }
 
       return user; // Type now matches IUser

    }catch(error){
      throw error
    }

  }


  async updatePassword(userId: Types.ObjectId, hashedPassword: string): Promise<Document | null> {
    try {
      return await Users.findByIdAndUpdate(userId, { password: hashedPassword });
    } catch (error) {
      throw error
    }

  }

}