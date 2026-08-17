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
const errorCode_1 = require("../constants/auth/errorCode");
const errorField_1 = require("../constants/auth/errorField");
const errorMessage_1 = __importDefault(require("../constants/auth/errorMessage"));
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
const jwtTokenError_error_1 = __importDefault(require("../errors/jwtTokenError.error"));
const requiredCredentialsNotGiven_error_1 = __importDefault(require("../errors/requiredCredentialsNotGiven.error"));
const validationError_error_1 = __importDefault(require("../errors/validationError.error"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const otp_model_1 = __importDefault(require("../framework/models/otp.model"));
class AuthUsecase {
    constructor(authRepository, hashingService, JWTService) {
        this.authRepository = authRepository;
        this.hashingService = hashingService;
        this.JWTService = JWTService;
    }
    handleUserRegister(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // // Simulating a registration process
                if (!data.email || !data.password || !data.userName || !data.confirmPassword) {
                    throw new requiredCredentialsNotGiven_error_1.default(errorMessage_1.default.REQUIRED_CREDENTIALS_NOT_GIVEN, errorCode_1.ErrorCode.CREDENTIALS_NOT_GIVEN_OR_NOT_FOUND);
                }
                if (!(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).test(data.email)) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.EMAIL,
                        message: errorMessage_1.default.EMAIL_NOT_VALID,
                        errorCode: errorCode_1.ErrorCode.PROVIDE_VALID_EMAIL
                    });
                }
                else if (data.password.length < 8) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.PASSWORD,
                        message: errorMessage_1.default.PASSWORD_MIN_LENGTH_NOT_MET,
                        errorCode: errorCode_1.ErrorCode.PASSWORD_MIN_LENGTH_NOT_MET
                    });
                }
                else if (data.password !== data.confirmPassword) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.PASSWORD_AND_CONFIRM_PASSWORD,
                        message: errorMessage_1.default.PASSWORD_MISMATCH,
                        errorCode: errorCode_1.ErrorCode.PASSWORD_MISMATCH
                    });
                }
                const userData = yield this.authRepository.isUserExist(data.email, data.userName);
                if (userData && userData.userName === data.userName) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.USERNAME,
                        message: errorMessage_1.default.USERNAME_ALREADY_TAKEN,
                        errorCode: errorCode_1.ErrorCode.USERNAME_TAKEN
                    });
                }
                else if (userData && userData.email === data.email) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.EMAIL,
                        message: errorMessage_1.default.EMAIL_ALREADY_TAKEN,
                        errorCode: errorCode_1.ErrorCode.EMAIL_TAKEN
                    });
                }
                const newUSerData = {
                    userName: data.userName,
                    email: data.email.toLowerCase(),
                    password: yield this.hashingService.hash(data.password),
                    friends: [],
                    friendRequests: [],
                    status: "online", // Default status is offline when a user is created
                    blocked: []
                };
                const newUSer = yield this.authRepository.createUser(newUSerData);
                const payload = { userId: newUSer._id };
                const token = this.JWTService.sign(payload, "1d");
                return token;
            }
            catch (error) {
                throw error;
            }
        });
    }
    handleUserLogin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!data.email || !data.password)
                    throw new requiredCredentialsNotGiven_error_1.default(errorMessage_1.default.REQUIRED_CREDENTIALS_NOT_GIVEN, errorCode_1.ErrorCode.CREDENTIALS_NOT_GIVEN_OR_NOT_FOUND);
                if (!(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).test(data.email)) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.EMAIL,
                        message: errorMessage_1.default.EMAIL_NOT_VALID,
                        errorCode: errorCode_1.ErrorCode.PROVIDE_VALID_EMAIL
                    });
                }
                const userData = yield this.authRepository.getUserDataByEmail(data.email);
                if (!userData) {
                    throw new validationError_error_1.default({
                        errorField: errorField_1.ErrorField.EMAIL,
                        message: errorMessage_1.default.USER_NOT_FOUND,
                        statusCode: statusCodes_1.default.NotFound,
                        errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND
                    });
                }
                else if (!(yield this.hashingService.compare(data.password, userData.password))) {
                    throw new validationError_error_1.default({
                        errorField: errorField_1.ErrorField.PASSWORD,
                        message: errorMessage_1.default.PASSWORD_INCORRECT,
                        statusCode: statusCodes_1.default.BadRequest,
                        errorCode: errorCode_1.ErrorCode.PASSWORD_INCORRECT
                    });
                }
                const payload = {
                    userId: userData._id
                };
                const token = this.JWTService.sign(payload, "1d");
                // 🔹 Update user status to "online"
                yield this.authRepository.updateUserStatus(userData._id, "online");
                return token;
            }
            catch (error) {
                throw error;
            }
        });
    }
    handleUserLogout(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.USER,
                        message: "Invalid user ID format",
                        errorCode: errorCode_1.ErrorCode.INVALID_INPUT
                    });
                }
                const user = yield this.authRepository.getUserDetails(userId);
                if (!user) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.NotFound,
                        errorField: errorField_1.ErrorField.USER,
                        message: "User not found",
                        errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND
                    });
                }
                // 🔹 Update user status to offline in the repository
                yield this.authRepository.updateUserStatus(userId, "offline");
            }
            catch (error) {
                throw error;
            }
        });
    }
    isUserAuthenticated(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!token)
                    throw new jwtTokenError_error_1.default({
                        statusCode: statusCodes_1.default.NotFound,
                        message: errorMessage_1.default.NOT_AUTHENTICATED,
                        errorCode: errorCode_1.ErrorCode.TOKEN_NOT_FOUND
                    });
                try {
                    const decoded = this.JWTService.verifyToken(token);
                    if (!(0, mongoose_1.isObjectIdOrHexString)(decoded.userId))
                        throw new jwtTokenError_error_1.default({
                            statusCode: statusCodes_1.default.BadRequest,
                            message: errorMessage_1.default.NOT_AUTHENTICATED,
                            errorCode: errorCode_1.ErrorCode.TOKEN_PAYLOAD_NOT_VALID
                        });
                }
                catch (err) {
                    throw new jwtTokenError_error_1.default({
                        statusCode: statusCodes_1.default.Unauthorized,
                        message: errorMessage_1.default.TOKEN_EXPIRED,
                        errorCode: errorCode_1.ErrorCode.TOKEN_EXPIRED_NEW_TOKEN_NEEDED
                    });
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    sendEmailOTP(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transporter = nodemailer_1.default.createTransport({
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
                const result = yield transporter.sendMail(mailOptions);
                console.log("Email sent successfully:", result);
            }
            catch (error) {
                console.error("Error sending email:", error);
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.OTP,
                    message: errorMessage_1.default.OTP_NOT_SENT,
                    errorCode: errorCode_1.ErrorCode.OTP_NOT_SENT
                });
            }
        });
    }
    sendVerificationOTP(email, mode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const otp = this.generateOTP();
                // Store OTP and mode in the database
                yield this.authRepository.saveOTP(email, otp, mode); // Store OTP in db
                yield this.sendEmailOTP(email, otp); // Send OTP via email
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyOTP(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const otpRecord = yield otp_model_1.default.findOne({ email });
                if (!otpRecord || otpRecord.otp !== otp) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.OTP,
                        message: errorMessage_1.default.OTP_INCORRECT,
                        errorCode: errorCode_1.ErrorCode.OTP_INCORRECT
                    });
                }
                if (otpRecord.otpExpiresAt < new Date()) {
                    throw new validationError_error_1.default({
                        statusCode: statusCodes_1.default.BadRequest,
                        errorField: errorField_1.ErrorField.OTP,
                        message: errorMessage_1.default.OTP_EXPIRED,
                        errorCode: errorCode_1.ErrorCode.OTP_EXPIRED
                    });
                }
                yield this.authRepository.clearOTP(email); // Remove OTP after verification
                return true; // Return true on successful verification
            }
            catch (error) {
                throw error;
            }
        });
    }
    setNewPassword(email, newPassword, confirmPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword !== confirmPassword) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.PASSWORD_AND_CONFIRM_PASSWORD,
                    message: errorMessage_1.default.PASSWORD_MISMATCH,
                    errorCode: errorCode_1.ErrorCode.PASSWORD_MISMATCH,
                });
            }
            if (newPassword.length < 6) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.BadRequest,
                    errorField: errorField_1.ErrorField.PASSWORD,
                    message: errorMessage_1.default.PASSWORD_MIN_LENGTH_NOT_MET,
                    errorCode: errorCode_1.ErrorCode.PASSWORD_MIN_LENGTH_NOT_MET,
                });
            }
            const user = yield this.authRepository.getUserDataByEmail(email);
            if (!user) {
                throw new validationError_error_1.default({
                    statusCode: statusCodes_1.default.NotFound,
                    errorField: errorField_1.ErrorField.USER,
                    message: errorMessage_1.default.USER_NOT_FOUND,
                    errorCode: errorCode_1.ErrorCode.USER_NOT_FOUND,
                });
            }
            const hashedPassword = yield this.hashingService.hash(newPassword);
            yield this.authRepository.updatePassword(user._id, hashedPassword);
        });
    }
    getUSerdetails(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userData = yield this.authRepository.getUserDetails(userId);
            // console.log(userData.status);
            return userData;
        });
    }
}
exports.default = AuthUsecase;
