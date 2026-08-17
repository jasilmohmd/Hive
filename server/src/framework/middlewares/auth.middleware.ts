import { NextFunction, Response } from "express";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import IAuthRequest from "../../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../../constants/auth/statusCodes";
import ErrorMessage from "../../constants/auth/errorMessage";
import { ErrorCode } from "../../constants/auth/errorCode";
import { ErrorType } from "../../constants/auth/errorType";
import IJWTService, { IPayload } from "../../interfaces/utils/IJwt.service";
import { Types } from "mongoose";

export default class AuthMiddleware implements IAuthMiddleware {
  private jwtService: IJWTService;

  constructor(jwtService: IJWTService) {
    this.jwtService = jwtService
  }

  isAuthenticated(req: IAuthRequest , res: Response, next: NextFunction): void {
    try {
      const { token } = req.cookies

      if (!token) {
        next({
          statusCode: StatusCodes.Unauthorized,
          message: ErrorMessage.NOT_AUTHENTICATED,
          errorCode: ErrorCode.TOKEN_NOT_FOUND,
          type: ErrorType.TOKEN
        });
        return;
      }

      const decoded: IPayload = this.jwtService.verifyToken(token);

      if (!Types.ObjectId.isValid(decoded.userId)) {
        next({
          statusCode: StatusCodes.Unauthorized,
          message: ErrorMessage.NOT_AUTHENTICATED,
          errorCode: ErrorCode.TOKEN_PAYLOAD_NOT_VALID,
          type: ErrorType.TOKEN
        });
        return;
      }

      req.userId = new Types.ObjectId(decoded.userId)
      next(); // user is authenticated procced with the actual request
    } catch (error) {
      next(error);
    }
  }

}