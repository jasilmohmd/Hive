"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_service_1 = __importDefault(require("../utils/jwt.service"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const call_controller_1 = require("../../controller/call.controller");
const callRouter = (0, express_1.Router)();
const jwtService = new jwt_service_1.default();
const authMiddleware = new auth_middleware_1.default(jwtService);
const callController = new call_controller_1.CallController();
callRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));
callRouter.get("/ice-config", callController.getIceConfig.bind(callController));
exports.default = callRouter;
