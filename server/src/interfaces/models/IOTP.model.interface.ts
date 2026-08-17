import { Document } from "mongoose";

export interface IOTP extends Document {
  email: string;
  otp: string;
  mode: string;
  otpExpiresAt: Date;
}