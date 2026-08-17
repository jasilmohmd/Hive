import { Router } from "express";
import multer from "multer";
import JWTService from "../utils/jwt.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import IJWTService from "../../interfaces/utils/IJwt.service";
import IAuthMiddleware from "../../interfaces/middleware/IAuth.middleware.interface";
import { ChatController } from "../../controller/chat.controller";
import { createChatUseCase } from "../chatDependencies";

const chatRouter: Router = Router();

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);
const chatUseCase = createChatUseCase();
const chatController = new ChatController(chatUseCase);

const MB = 1024 * 1024;
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * MB } });
const videoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * MB } });
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * MB } });
const fileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * MB } });

chatRouter.use(authMiddleware.isAuthenticated.bind(authMiddleware));

chatRouter.get("/messages/:chatId", chatController.getMessageHistory.bind(chatController));
chatRouter.get("/gifs", chatController.getGifs.bind(chatController));
chatRouter.get("/stickers", chatController.getStickers.bind(chatController));
chatRouter.get("/link-preview", chatController.getLinkPreview.bind(chatController));

chatRouter.post("/messages/image", imageUpload.single("file"), chatController.sendImageMessage.bind(chatController));
chatRouter.post("/messages/video", videoUpload.single("file"), chatController.sendVideoMessage.bind(chatController));
chatRouter.post("/messages/audio", audioUpload.single("file"), chatController.sendAudioMessage.bind(chatController));
chatRouter.post("/messages/file", fileUpload.single("file"), chatController.sendFileMessage.bind(chatController));

chatRouter.patch("/messages/:messageId", chatController.patchMessage.bind(chatController));
chatRouter.delete("/messages/:messageId", chatController.deleteMessage.bind(chatController));
chatRouter.post("/messages/:messageId/reactions", chatController.setReaction.bind(chatController));
chatRouter.delete("/messages/:messageId/reactions", chatController.removeReaction.bind(chatController));
chatRouter.post("/messages/:messageId/vote", chatController.votePoll.bind(chatController));

export default chatRouter;
