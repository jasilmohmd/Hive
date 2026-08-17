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
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const errorField_1 = require("../constants/auth/errorField");
const errorCode_1 = require("../constants/auth/errorCode");
class ProfileUSecase {
    constructor(profileRepository) {
        this.profileRepository = profileRepository;
    }
    editProfile(userId, newUserName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !newUserName) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "User ID and new username are required.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT,
                });
            }
            return yield this.profileRepository.editProfile(userId, newUserName);
        });
    }
    changePassword(userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId) || !newPassword) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "User ID and new password are required.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT,
                });
            }
            return yield this.profileRepository.changePassword(userId, oldPassword, newPassword);
        });
    }
    updateAvatar(userId, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, mongoose_1.isObjectIdOrHexString)(userId)) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.USER,
                    message: "User ID is required.",
                    errorCode: errorCode_1.ErrorCode.INVALID_INPUT,
                });
            }
            if (imageUrl !== null && imageUrl !== "") {
                zod_1.z.string().url({ message: "Invalid image URL" }).parse(imageUrl);
            }
            return yield this.profileRepository.updateAvatar(userId, imageUrl === "" ? null : imageUrl);
        });
    }
}
exports.default = ProfileUSecase;
