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
const otp_model_1 = __importDefault(require("../framework/models/otp.model"));
const user_model_1 = __importDefault(require("../framework/models/user.model"));
class AuthRepository {
    constructor() { }
    isUserExist(email, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield user_model_1.default.findOne({ $or: [{ email: { $regex: new RegExp(`^${email}$`, 'i') } }, { userName: { $regex: new RegExp(`^${userName}$`, 'i') } }] });
            }
            catch (err) {
                throw err;
            }
        });
    }
    saveOTP(email, otp, mode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield otp_model_1.default.findOneAndUpdate({ email }, { otp, mode, otpExpiresAt: new Date(Date.now() + 60 * 1000) }, // Expires in 10 minutes
                { upsert: true, new: true });
            }
            catch (error) {
                throw error;
            }
        });
    }
    clearOTP(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield otp_model_1.default.deleteOne({ email });
            }
            catch (error) {
                throw error;
            }
        });
    }
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if email or username already exists
                const existingUser = yield user_model_1.default.findOne({
                    $or: [{ email: data.email }, { userName: data.userName }],
                });
                if (existingUser) {
                    const errorMessage = existingUser.email === data.email
                        ? "Email already exists"
                        : "Username already exists";
                    throw new Error(errorMessage);
                }
                // Create and save the new user
                const newUser = new user_model_1.default(data);
                yield newUser.save();
                return newUser;
            }
            catch (error) {
                // Type-check and handle the error
                if (error instanceof Error) {
                    console.error("Error creating user:", error.message);
                    throw new Error(error.message); // Rethrow with the original message
                }
                // Handle unexpected errors
                console.error("Unexpected error:", error);
                throw new Error("An unexpected error occurred while creating the user");
            }
        });
    }
    updateUserStatus(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield user_model_1.default.updateOne({ _id: userId }, { $set: { status } });
            }
            catch (error) {
                throw error;
            }
        });
    }
    getUserDataByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield user_model_1.default.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
            }
            catch (err) {
                throw err;
            }
        });
    }
    getUserDetails(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use lean() to return a plain JavaScript object matching IUser
                const user = yield user_model_1.default.findOne({ _id: userId }).lean();
                if (!user) {
                    throw new Error(`User with ID ${userId} not found`);
                }
                return user; // Type now matches IUser
            }
            catch (error) {
                throw error;
            }
        });
    }
    updatePassword(userId, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield user_model_1.default.findByIdAndUpdate(userId, { password: hashedPassword });
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = AuthRepository;
