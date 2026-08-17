import mongoose, { Schema } from "mongoose";
import { IOTP } from "../../interfaces/models/IOTP.model.interface";

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  mode: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true, expires: 600 }, // Automatically remove after 10 minutes
});

const OTPModel = mongoose.model<IOTP>("OTP", OTPSchema);

export default OTPModel;
