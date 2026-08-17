"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RequiredCredentialsNotGiven extends Error {
    constructor(errMessage, errorCode) {
        super(errMessage);
        this.errMessage = errMessage;
        this.errorCode = errorCode;
    }
}
exports.default = RequiredCredentialsNotGiven;
