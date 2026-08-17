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
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
class ProfileController {
    constructor(profileUseCase) {
        this.profileUseCase = profileUseCase;
    }
    /**
     * Endpoint to update the user's username.
     * Expected request body: { newUserName: string }
     */
    editProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { newUserName } = req.body;
                const updatedUser = yield this.profileUseCase.editProfile(userId, newUserName);
                res.status(statusCodes_1.default.Success).json({
                    message: "Profile updated successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Endpoint to change the user's password.
     * Expected request body: { newPassword: string }
     */
    changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId; // Assume authentication middleware sets req.id
                const { oldPassword, newPassword } = req.body;
                const updatedUser = yield this.profileUseCase.changePassword(userId, oldPassword, newPassword);
                res.status(statusCodes_1.default.Success).json({
                    message: "Password updated successfully"
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * PUT /profile/avatar — body: { imageUrl: string | null }
     * Pass null or empty string to remove the profile photo.
     */
    updateAvatar(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.userId;
                const raw = (_a = req.body) === null || _a === void 0 ? void 0 : _a.imageUrl;
                const imageUrl = raw === undefined || raw === null ? null : String(raw).trim();
                const normalized = imageUrl === "" || imageUrl === "null" ? null : imageUrl;
                yield this.profileUseCase.updateAvatar(userId, normalized);
                res.status(statusCodes_1.default.Success).json({
                    message: "Profile photo updated successfully",
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = ProfileController;
