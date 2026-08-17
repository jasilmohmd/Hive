"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JWTTokenError extends Error {
    constructor(details) {
        super(details.message);
        this.details = details;
    }
}
exports.default = JWTTokenError;
