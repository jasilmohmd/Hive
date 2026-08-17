"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const statusCodes_1 = __importDefault(require("../../constants/auth/statusCodes"));
const errorMessage_1 = __importDefault(require("../../constants/auth/errorMessage"));
const errorCode_1 = require("../../constants/auth/errorCode");
const errorType_1 = require("../../constants/auth/errorType");
const mongoose_1 = require("mongoose");
class AuthMiddleware {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    isAuthenticated(req, res, next) {
        try {
            const { token } = req.cookies;
            if (!token) {
                next({
                    statusCode: statusCodes_1.default.Unauthorized,
                    message: errorMessage_1.default.NOT_AUTHENTICATED,
                    errorCode: errorCode_1.ErrorCode.TOKEN_NOT_FOUND,
                    type: errorType_1.ErrorType.TOKEN
                });
                return;
            }
            const decoded = this.jwtService.verifyToken(token);
            if (!mongoose_1.Types.ObjectId.isValid(decoded.userId)) {
                next({
                    statusCode: statusCodes_1.default.Unauthorized,
                    message: errorMessage_1.default.NOT_AUTHENTICATED,
                    errorCode: errorCode_1.ErrorCode.TOKEN_PAYLOAD_NOT_VALID,
                    type: errorType_1.ErrorType.TOKEN
                });
                return;
            }
            req.userId = new mongoose_1.Types.ObjectId(decoded.userId);
            next(); // user is authenticated procced with the actual request
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = AuthMiddleware;
