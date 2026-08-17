import { Request } from "express";
import { Types } from "mongoose";

export default interface IAuthRequest extends Request {
  userId?: Types.ObjectId;
}