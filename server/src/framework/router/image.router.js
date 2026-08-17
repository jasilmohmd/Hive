"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const image_controller_1 = __importDefault(require("../../controller/image.controller"));
const imageUpload_usecase_1 = __importDefault(require("../../usecase/imageUpload.usecase"));
// Set up multer for memory storage
const storage = multer_1.default.memoryStorage();
const uploadMiddleware = (0, multer_1.default)({ storage });
const imageUsecase = new imageUpload_usecase_1.default();
// Create an instance of your controller, injecting the use case
const imageController = new image_controller_1.default(imageUsecase);
// Create a router
const imageRouter = (0, express_1.Router)();
// Define the route for image upload
imageRouter.route('/upload').post(uploadMiddleware.single('file'), imageController.uploadImage.bind(imageController));
exports.default = imageRouter;
