"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    sign(payload, expiresIn) {
        try {
            // Ensure compatibility with SignOptions
            const options = {
                expiresIn: expiresIn, // Type assertion to match SignOptions
            };
            const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, options); // token expiresIn
            return token;
        }
        catch (error) {
            throw error;
        }
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
            return decoded;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.default = JWTService;
