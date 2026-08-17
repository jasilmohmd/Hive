"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const successMessage_1 = __importDefault(require("../constants/auth/successMessage"));
const errorField_1 = require("../constants/auth/errorField");
const errorCode_1 = require("../constants/auth/errorCode");
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const errorMessage_1 = __importDefault(require("../constants/auth/errorMessage"));
const mongoose_1 = require("mongoose");
const isProd = process.env.NODE_ENV === "production";
const authCookieSameSite = (((_a = process.env.COOKIE_SAME_SITE) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) ||
    (isProd ? "none" : "lax"));
class AuthController {
    constructor(authUsecase) {
        this.authUsecase = authUsecase;
    }
    // Handle email verification OTP request
    sendVerificationOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, mode } = req.body;
                yield this.authUsecase.sendVerificationOTP(email, mode);
                res.status(statusCodes_1.default.Success).json({
                    message: 'OTP sent successfully to your email!'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Handle OTP verification
    verifyOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, otp } = req.body;
            try {
                yield this.authUsecase.verifyOTP(email, otp);
                res.status(statusCodes_1.default.Success).json({
                    message: 'Email verified successfully!'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    register(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName, email, password, confirmPassword } = req.body;
                const registerationCredentials = {
                    userName,
                    email,
                    password,
                    confirmPassword
                };
                const token = yield this.authUsecase.handleUserRegister(registerationCredentials);
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: authCookieSameSite,
                    maxAge: 1 * 24 * 60 * 60 * 1000,
                });
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.REGISTERTATION_SUCCESS,
                    token: token
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    login(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginCredentials = {
                    email: req.body.email,
                    password: req.body.password
                };
                const token = yield this.authUsecase.handleUserLogin(loginCredentials);
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: authCookieSameSite,
                    maxAge: 1 * 24 * 60 * 60 * 1000,
                });
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.LOGIN_SUCCESS,
                    token,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    logoutUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId; // Assuming user ID is extracted from the request
                if (!userId) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.Unauthorized,
                        errorField: errorField_1.ErrorField.USER,
                        message: errorMessage_1.default.UNAUTHORIZED_ACCESS,
                        errorCode: errorCode_1.ErrorCode.UNAUTHORIZED_ACCESS,
                    });
                }
                yield this.authUsecase.handleUserLogout(userId);
                // 🔹 Clear the authentication token
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: authCookieSameSite,
                });
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.LOGOUT_SUCCESS,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    isUserAuthenticated(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.cookies;
                yield this.authUsecase.isUserAuthenticated(token);
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.USER_AUTHENTICATED,
                    token,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /** Returns JWT for Socket.IO (httpOnly cookie → JSON for sessionStorage). */
    getRealtimeToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
                if (!token) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.Unauthorized,
                        errorField: errorField_1.ErrorField.USER,
                        message: errorMessage_1.default.NOT_AUTHENTICATED,
                        errorCode: errorCode_1.ErrorCode.TOKEN_NOT_FOUND,
                    });
                }
                yield this.authUsecase.isUserAuthenticated(token);
                res.status(statusCodes_1.default.Success).json({ token });
            }
            catch (error) {
                next(error);
            }
        });
    }
    setNewPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, newPassword, confirmPassword } = req.body;
                yield this.authUsecase.setNewPassword(email, newPassword, confirmPassword);
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.PASSWORD_UPDATE_SUCCESS
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getUserDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield this.authUsecase.getUSerdetails(req.userId);
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.SUCESSFULL,
                    userData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getUserDetailsById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = new mongoose_1.Types.ObjectId(req.params.id);
                const userData = yield this.authUsecase.getUSerdetails(userId);
                res.status(statusCodes_1.default.Success).json({
                    message: successMessage_1.default.SUCESSFULL,
                    userData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AuthController;
