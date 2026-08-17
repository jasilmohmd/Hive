import { Types } from "mongoose";

export default interface IJWTService {
  sign(payload: IPayload , expiresIn: string | number): string | never
  verifyToken(token: string): (IPayload | never);
}

export interface IPayload {
  userId: Types.ObjectId;
}