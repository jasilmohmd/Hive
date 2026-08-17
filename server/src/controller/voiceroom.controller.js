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
exports.VoiceroomController = void 0;
const statusCodes_1 = __importDefault(require("../constants/auth/statusCodes"));
class VoiceroomController {
    constructor(voiceroomUseCase) {
        this.voiceroomUseCase = voiceroomUseCase;
    }
    getToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const channelId = req.params.channelId;
                const result = yield this.voiceroomUseCase.createJoinToken(req.userId.toString(), channelId);
                res.status(statusCodes_1.default.Success).json(result);
            }
            catch (error) {
                const status = error.statusCode;
                if (status === 403) {
                    res.status(403).json({ message: error.message });
                    return;
                }
                next(error);
            }
        });
    }
    getPresence(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    res.status(statusCodes_1.default.Unauthorized).json({ message: "Not authenticated" });
                    return;
                }
                const channelId = req.params.channelId;
                const result = yield this.voiceroomUseCase.getPresence(req.userId.toString(), channelId);
                res.status(statusCodes_1.default.Success).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.VoiceroomController = VoiceroomController;
