"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandlerMiddleware;
const statusCodes_1 = __importDefault(require("../../constants/auth/statusCodes"));
const requiredCredentialsNotGiven_error_1 = __importDefault(require("../../errors/requiredCredentialsNotGiven.error"));
const validationError_error_1 = __importDefault(require("../../errors/validationError.error"));
const jwtTokenError_error_1 = __importDefault(require("../../errors/jwtTokenError.error"));
const errorType_1 = require("../../constants/auth/errorType");
const errorMessage_1 = __importDefault(require("../../constants/auth/errorMessage"));
const customError_error_1 = require("../../errors/customError.error");
function errorHandlerMiddleware(err, req, res, next) {
    var _a;
    if (err instanceof requiredCredentialsNotGiven_error_1.default) {
        res.status(statusCodes_1.default.BadRequest).json({
            credentialsError: true,
            message: err.message,
            errorCode: err.errorCode
        });
    }
    else if (err instanceof validationError_error_1.default) {
        res.status(err.details.statusCode).json({
            errorCode: err.details.errorCode,
            errorField: err.details.errorField,
            message: err.message
        });
    }
    else if (err instanceof customError_error_1.CustomError) {
        res.status(err.statusCode).json({
            errorType: err.name,
            errorField: err.errorField,
            message: err.message
        });
    }
    else if (err instanceof jwtTokenError_error_1.default) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development'
        });
        res.status(err.details.statusCode).json({
            message: err.message,
            type: errorType_1.ErrorType.TOKEN,
            errorCode: err.details.errorCode
        });
    }
    else if (err && typeof err === "object" && "statusCode" in err && "message" in err) {
        res.status(Number(err.statusCode) || statusCodes_1.default.InternalServer).json({
            message: String(err.message),
            errorCode: err.errorCode,
            type: (_a = err.type) !== null && _a !== void 0 ? _a : errorType_1.ErrorType.TOKEN
        });
    }
    else {
        // Log entire error object
        console.error(err);
        res.status(statusCodes_1.default.InternalServer).json({
            internalServerError: true,
            message: errorMessage_1.default.INTERNAL_SERVER_ERROR
        });
    }
}
