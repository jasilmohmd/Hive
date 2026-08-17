import { isObjectIdOrHexString, Types } from "mongoose";
import { ErrorCode } from "../constants/auth/errorCode";
import { ErrorField } from "../constants/auth/errorField";
import ErrorMessage from "../constants/auth/errorMessage";
import StatusCodes from "../constants/auth/statusCodes";
import IUser, { ILoginCredentials, IRegisterationCredentials } from "../entity/User.entity";
import JWTTokenError from "../errors/jwtTokenError.error";
import RequiredCredentialsNotGiven from "../errors/requiredCredentialsNotGiven.error";
import ValidationError from "../errors/validationError.error";
import IAuthRepository from "../interfaces/repository/IAuth.repository.interface";
import IAuthUseCase from "../interfaces/usecase/IAuth.usecase.interface";
import IHashingService from "../interfaces/utils/IHashing.service";
import IJWTService, { IPayload } from "../interfaces/utils/IJwt.service";

import nodemailer from 'nodemailer';
import OTPModel from "../framework/models/otp.model";

export default class AuthUsecase implements IAuthUseCase {

  private authRepository: IAuthRepository;
  private hashingService: IHashingService;
  private JWTService: IJWTService;

  constructor(authRepository: IAuthRepository, hashingService: IHashingService, JWTService: IJWTService) {
    this.authRepository = authRepository;
    this.hashingService = hashingService;
    this.JWTService = JWTService;
  }

  async handleUserRegister(data: IRegisterationCredentials): Promise<string | never> {

    try {
      // // Simulating a registration process
      if (!data.email || !data.password || !data.userName || !data.confirmPassword) {
        throw new RequiredCredentialsNotGiven(ErrorMessage.REQUIRED_CREDENTIALS_NOT_GIVEN, ErrorCode.CREDENTIALS_NOT_GIVEN_OR_NOT_FOUND);
      }

      if (!(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).test(data.email)) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.EMAIL,
          message: ErrorMessage.EMAIL_NOT_VALID,
          errorCode: ErrorCode.PROVIDE_VALID_EMAIL
        });
      } else if (data.password.length < 8) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.PASSWORD,
          message: ErrorMessage.PASSWORD_MIN_LENGTH_NOT_MET,
          errorCode: ErrorCode.PASSWORD_MIN_LENGTH_NOT_MET
        });
      } else if (data.password !== data.confirmPassword) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.PASSWORD_AND_CONFIRM_PASSWORD,
          message: ErrorMessage.PASSWORD_MISMATCH,
          errorCode: ErrorCode.PASSWORD_MISMATCH
        });
      }

      const userData: IUser | null = await this.authRepository.isUserExist(data.email, data.userName);

      if (userData && userData.userName === data.userName) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.USERNAME,
          message: ErrorMessage.USERNAME_ALREADY_TAKEN,
          errorCode: ErrorCode.USERNAME_TAKEN
        });
      } else if (userData && userData.email === data.email) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.EMAIL,
          message: ErrorMessage.EMAIL_ALREADY_TAKEN,
          errorCode: ErrorCode.EMAIL_TAKEN
        });
      }

      const newUSerData: Omit<IUser, "_id"> = {
        userName: data.userName,
        email: data.email.toLowerCase(),
        password: await this.hashingService.hash(data.password),
        friends: [],
        friendRequests: [],
        status: "online", // Default status is offline when a user is created
        blocked: []
      }

      const newUSer: IUser = await this.authRepository.createUser(newUSerData);

      const payload: IPayload = { userId: newUSer._id }
      const token: string = this.JWTService.sign(payload, "1d");

      return token

    } catch (error) {

      throw error;

    }

  }

  async handleUserLogin(data: ILoginCredentials): Promise<string | never> {
    try {

      if (!data.email || !data.password) throw new RequiredCredentialsNotGiven(
        ErrorMessage.REQUIRED_CREDENTIALS_NOT_GIVEN,
        ErrorCode.CREDENTIALS_NOT_GIVEN_OR_NOT_FOUND
      );

      if (!(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).test(data.email)) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.EMAIL,
          message: ErrorMessage.EMAIL_NOT_VALID,
          errorCode: ErrorCode.PROVIDE_VALID_EMAIL
        });
      }

      const userData: IUser | null = await this.authRepository.getUserDataByEmail(data.email);

      if (!userData) {
        throw new ValidationError({
          errorField: ErrorField.EMAIL,
          message: ErrorMessage.USER_NOT_FOUND,
          statusCode: StatusCodes.NotFound,
          errorCode: ErrorCode.USER_NOT_FOUND
        });
      } else if (!await this.hashingService.compare(data.password, userData.password)) {
        throw new ValidationError({
          errorField: ErrorField.PASSWORD,
          message: ErrorMessage.PASSWORD_INCORRECT,
          statusCode: StatusCodes.BadRequest,
          errorCode: ErrorCode.PASSWORD_INCORRECT
        });
      }

      const payload: IPayload = {
        userId: userData._id
      }

      const token: string = this.JWTService.sign(payload, "1d");

      // 🔹 Update user status to "online"
      await this.authRepository.updateUserStatus(userData._id, "online");

      return token;

    } catch (error) {
      throw error;
    }
  }


  async handleUserLogout(userId: Types.ObjectId): Promise<void> {
    try {

      if (!Types.ObjectId.isValid(userId)) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.USER,
          message: "Invalid user ID format",
          errorCode: ErrorCode.INVALID_INPUT
        });
      }

      const user = await this.authRepository.getUserDetails(userId);
      if (!user) {
        throw new ValidationError({
          statusCode: StatusCodes.NotFound,
          errorField: ErrorField.USER,
          message: "User not found",
          errorCode: ErrorCode.USER_NOT_FOUND
        });
      }

      // 🔹 Update user status to offline in the repository
      await this.authRepository.updateUserStatus(userId, "offline");

    } catch (error) {
      throw error
    }
  }


  async isUserAuthenticated(token: string | undefined): Promise<void | never> {
    try {
      if (!token) throw new JWTTokenError({
        statusCode: StatusCodes.NotFound,
        message: ErrorMessage.NOT_AUTHENTICATED,
        errorCode: ErrorCode.TOKEN_NOT_FOUND
      });

      try {
        const decoded: IPayload = this.JWTService.verifyToken(token);

        if (!isObjectIdOrHexString(decoded.userId)) throw new JWTTokenError({
          statusCode: StatusCodes.BadRequest,
          message: ErrorMessage.NOT_AUTHENTICATED,
          errorCode: ErrorCode.TOKEN_PAYLOAD_NOT_VALID
        });
      } catch (err: any) {
        throw new JWTTokenError({
          statusCode: StatusCodes.Unauthorized,
          message: ErrorMessage.TOKEN_EXPIRED,
          errorCode: ErrorCode.TOKEN_EXPIRED_NEW_TOKEN_NEEDED
        });
      }
    } catch (err) {
      throw err;
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmailOTP(email: string, otp: string): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Email Verification',
        text: `Your OTP is: ${otp}`
      };

      console.log("Sending mail with options:", mailOptions);

      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result);

    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.OTP,
        message: ErrorMessage.OTP_NOT_SENT,
        errorCode: ErrorCode.OTP_NOT_SENT
      });
    }
  }

  async sendVerificationOTP(email: string, mode: string): Promise<void | never> {
    try {
      const otp = this.generateOTP();
      // Store OTP and mode in the database
      await this.authRepository.saveOTP(email, otp, mode); // Store OTP in db
      await this.sendEmailOTP(email, otp); // Send OTP via email
    } catch (error) {
      throw error
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      const otpRecord = await OTPModel.findOne({ email });

      if (!otpRecord || otpRecord.otp !== otp) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.OTP,
          message: ErrorMessage.OTP_INCORRECT,
          errorCode: ErrorCode.OTP_INCORRECT
        });
      }

      if (otpRecord.otpExpiresAt < new Date()) {
        throw new ValidationError({
          statusCode: StatusCodes.BadRequest,
          errorField: ErrorField.OTP,
          message: ErrorMessage.OTP_EXPIRED,
          errorCode: ErrorCode.OTP_EXPIRED
        });
      }

      await this.authRepository.clearOTP(email); // Remove OTP after verification

      return true; // Return true on successful verification

    } catch (error) {
      throw error;
    }
  }

  async setNewPassword(email: string, newPassword: string, confirmPassword: string): Promise<void> {

    if (newPassword !== confirmPassword) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.PASSWORD_AND_CONFIRM_PASSWORD,
        message: ErrorMessage.PASSWORD_MISMATCH,
        errorCode: ErrorCode.PASSWORD_MISMATCH,
      });
    }

    if (newPassword.length < 6) {
      throw new ValidationError({
        statusCode: StatusCodes.BadRequest,
        errorField: ErrorField.PASSWORD,
        message: ErrorMessage.PASSWORD_MIN_LENGTH_NOT_MET,
        errorCode: ErrorCode.PASSWORD_MIN_LENGTH_NOT_MET,
      });
    }

    const user = await this.authRepository.getUserDataByEmail(email);
    if (!user) {
      throw new ValidationError({
        statusCode: StatusCodes.NotFound,
        errorField: ErrorField.USER,
        message: ErrorMessage.USER_NOT_FOUND,
        errorCode: ErrorCode.USER_NOT_FOUND,
      });
    }

    const hashedPassword = await this.hashingService.hash(newPassword);
    await this.authRepository.updatePassword(user._id, hashedPassword);

  }

  async getUSerdetails(userId: Types.ObjectId): Promise<IUser | never | null> {
    const userData = await this.authRepository.getUserDetails(userId);
    // console.log(userData.status);


    return userData;
  }

}