import { NextFunction, Request, Response } from "express";
import StatusCodes from "../../constants/auth/statusCodes";
import RequiredCredentialsNotGiven from "../../errors/requiredCredentialsNotGiven.error";
import ValidationError from "../../errors/validationError.error";
import JWTTokenError from "../../errors/jwtTokenError.error";
import { ErrorType } from "../../constants/auth/errorType";
import ErrorMessage from "../../constants/auth/errorMessage";
import { CustomError } from "../../errors/customError.error";

export default function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
        if (err instanceof RequiredCredentialsNotGiven) {
                res.status(StatusCodes.BadRequest).json({
                        credentialsError: true,
                        message: err.message,
                        errorCode: err.errorCode
                });
        } else if (err instanceof ValidationError) {
                res.status(err.details.statusCode).json({
                        errorCode: err.details.errorCode,
                        errorField: err.details.errorField,
                        message: err.message
                });
        } else if (err instanceof CustomError) {
                res.status(err.statusCode).json({
                        errorType: err.name,
                        errorField: err.errorField,
                        message: err.message
                })

        } else if (err instanceof JWTTokenError) {
                res.clearCookie("token", {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'development'
                });

                res.status(err.details.statusCode).json({
                        message: err.message,
                        type: ErrorType.TOKEN,
                        errorCode: err.details.errorCode
                });
        } else if (err && typeof err === "object" && "statusCode" in err && "message" in err) {
                res.status(Number(err.statusCode) || StatusCodes.InternalServer).json({
                        message: String(err.message),
                        errorCode: err.errorCode,
                        type: err.type ?? ErrorType.TOKEN
                });
        } else {
                // Log entire error object
                console.error(err);
                res.status(StatusCodes.InternalServer).json({
                        internalServerError: true,
                        message: ErrorMessage.INTERNAL_SERVER_ERROR
                });
        }
}