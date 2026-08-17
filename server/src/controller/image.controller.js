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
Object.defineProperty(exports, "__esModule", { value: true });
class ImageController {
    constructor(imageUsecase) {
        this.imageUsecase = imageUsecase;
    }
    uploadImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = req.file;
                if (!file) {
                    res.status(400).json({ message: 'No file uploaded' });
                    return;
                }
                const isPublic = req.body.isPublic === 'true';
                const imageUrl = yield this.imageUsecase.upload(file.buffer, file.originalname, isPublic);
                res.status(200).json({ imageUrl });
            }
            catch (error) {
                const message = (error === null || error === void 0 ? void 0 : error.message) || 'Image upload failed';
                console.error('Image upload error:', message);
                res.status(500).json({ message });
            }
        });
    }
}
exports.default = ImageController;
