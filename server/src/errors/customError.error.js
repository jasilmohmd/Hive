"use strict";
// src/utils/CustomErrors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor({ statusCode, message, errorField }) {
        super(message);
        this.statusCode = statusCode;
        this.errorField = errorField;
        this.name = 'CustomError';
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.CustomError = CustomError;
class NotFoundError extends CustomError {
    constructor(message, errorField = 'resource') {
        super({ statusCode: 404, message, errorField });
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends CustomError {
    constructor(message, errorField = 'validation') {
        super({ statusCode: 400, message, errorField });
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends CustomError {
    constructor(message, errorField = 'authorization') {
        super({ statusCode: 401, message, errorField });
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
