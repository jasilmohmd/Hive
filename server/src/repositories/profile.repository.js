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
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const errorCode_1 = require("../constants/auth/errorCode");
const errorField_1 = require("../constants/auth/errorField");
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const user_model_1 = __importDefault(require("../framework/models/user.model"));
const errorMessage_1 = __importDefault(require("../constants/auth/errorMessage"));
class ProfileRepository {
    /**
     * Update the user's username.
     */
    editProfile(userId, newUserName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if the new username already exists in the database
            const existingUser = yield user_model_1.default.findOne({ userName: newUserName });
            // If a user is found and it's not the current user, throw an error
            if (existingUser && existingUser._id !== userId) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.Conflict,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.USERNAME_ALREADY_TAKEN,
                    errorCode: errorCode_1.ErrorCode.USERNAME_TAKEN,
                });
            }
            // Proceed with updating the username
            const updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { userName: newUserName }, { new: true });
            if (!updatedUser) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.USER_NOT_FOUND,
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND,
                });
            }
            return updatedUser;
        });
    }
    /**
     * Update the user's password.
     * Note: In a real-world application, you should hash the new password before saving.
     */
    changePassword(userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the user by ID
            const user = yield user_model_1.default.findById(userId);
            if (!user) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: "User not found.",
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND,
                });
            }
            // Compare old password with stored hashed password
            const isMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
            if (!isMatch) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.Unauthorized,
                    errorField: errorField_1.ErrorField.PASSWORD,
                    message: "Old password is incorrect.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT,
                });
            }
            // Prevent using the same password
            const isSamePassword = yield bcrypt_1.default.compare(newPassword, user.password);
            if (isSamePassword) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.PASSWORD,
                    message: "New password cannot be the same as the old password.",
                    errorCode: errorCode_1.ErrorCode.PASSWORD_INVALID,
                });
            }
            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, saltRounds);
            // Update user password
            user.password = hashedPassword;
            yield user.save();
            return user;
        });
    }
    updateAvatar(userId, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const update = imageUrl === null || imageUrl === ""
                ? { $unset: { imageUrl: 1 } }
                : { imageUrl };
            const updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, update, {
                new: true,
            });
            if (!updatedUser) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.USER_NOT_FOUND,
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND,
                });
            }
            return updatedUser;
        });
    }
}
exports.default = ProfileRepository;
