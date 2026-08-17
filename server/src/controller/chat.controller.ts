import { Request, Response, NextFunction } from "express";
import { IChatUseCase } from "../interfaces/usecase/IChat.usecase.interface";
import IAuthRequest from "../interfaces/common/IAuthRequest.interface";
import StatusCodes from "../constants/auth/statusCodes";
import { Server } from "socket.io";
import { assertAllowedMime } from "../framework/utils/chatMessageContent";
import { assertSafePreviewUrl } from "../framework/utils/linkPreview";

type UploadedFile = Express.Multer.File;

export class ChatController {
  constructor(private chatUseCase: IChatUseCase) {}

  private getUploadedFile(req: IAuthRequest): UploadedFile | undefined {
    return (req as Request & { file?: UploadedFile }).file;
  }

  private io(req: IAuthRequest): Server | undefined {
    return req.app.get("io") as Server | undefined;
  }

  private broadcastNewMessage(req: IAuthRequest, chatId: string, message: unknown): void {
    this.io(req)?.to(chatId).emit("newMessage", message);
  }

  async getMessageHistory(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await this.chatUseCase.getMessageHistory(chatId, page, limit, req.userId!.toString());
      res.status(StatusCodes.Success).json(messages);
    } catch (error) {
      next(error);
    }
  }

  async sendImageMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const file = this.getUploadedFile(req);
      const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";

      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      if (!chatId || !file) {
        res.status(StatusCodes.BadRequest).json({ message: "chatId and file are required" });
        return;
      }
      if (!file.mimetype.startsWith("image/")) {
        res.status(StatusCodes.BadRequest).json({ message: "Only image files are allowed" });
        return;
      }

      const message = await this.chatUseCase.sendImageMessage(
        req.userId.toString(),
        chatId,
        file.buffer,
        file.originalname
      );

      this.broadcastNewMessage(req, chatId, message);
      res.status(StatusCodes.Success).json(message);
    } catch (error) {
      next(error);
    }
  }

  async sendVideoMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const file = this.getUploadedFile(req);
      const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";

      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      if (!chatId || !file) {
        res.status(StatusCodes.BadRequest).json({ message: "chatId and file are required" });
        return;
      }

      assertAllowedMime(file.mimetype, "video");

      const message = await this.chatUseCase.sendVideoMessage(
        req.userId.toString(),
        chatId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      this.broadcastNewMessage(req, chatId, message);
      res.status(StatusCodes.Success).json(message);
    } catch (error) {
      next(error);
    }
  }

  async sendAudioMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const file = this.getUploadedFile(req);
      const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";

      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      if (!chatId || !file) {
        res.status(StatusCodes.BadRequest).json({ message: "chatId and file are required" });
        return;
      }

      assertAllowedMime(file.mimetype, "audio");

      const message = await this.chatUseCase.sendAudioMessage(
        req.userId.toString(),
        chatId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      this.broadcastNewMessage(req, chatId, message);
      res.status(StatusCodes.Success).json(message);
    } catch (error) {
      next(error);
    }
  }

  async sendFileMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const file = this.getUploadedFile(req);
      const chatId = typeof req.body.chatId === "string" ? req.body.chatId : "";

      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      if (!chatId || !file) {
        res.status(StatusCodes.BadRequest).json({ message: "chatId and file are required" });
        return;
      }

      assertAllowedMime(file.mimetype, "document");

      const message = await this.chatUseCase.sendFileMessage(
        req.userId.toString(),
        chatId,
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size
      );

      this.broadcastNewMessage(req, chatId, message);
      res.status(StatusCodes.Success).json(message);
    } catch (error) {
      next(error);
    }
  }

  async patchMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const { messageId } = req.params;
      const content = typeof req.body.content === "string" ? req.body.content : "";
      const message = await this.chatUseCase.editMessage(req.userId.toString(), messageId, content);
      this.io(req)?.to(message.chatId).emit("messageEdited", message);
      res.status(StatusCodes.Success).json(message);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const { messageId } = req.params;
      const message = await this.chatUseCase.deleteMessage(req.userId.toString(), messageId);
      this.io(req)?.to(message.chatId).emit("messageDeleted", { _id: messageId, chatId: message.chatId });
      res.status(StatusCodes.Success).json({ _id: messageId });
    } catch (error) {
      next(error);
    }
  }

  async setReaction(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const { messageId } = req.params;
      const emoji = typeof req.body.emoji === "string" ? req.body.emoji : "";
      const result = await this.chatUseCase.setReaction(req.userId.toString(), messageId, emoji);
      this.io(req)?.to(result.chatId).emit("reactionUpdated", result);
      res.status(StatusCodes.Success).json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeReaction(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const { messageId } = req.params;
      const result = await this.chatUseCase.removeReaction(req.userId.toString(), messageId);
      this.io(req)?.to(result.chatId).emit("reactionUpdated", result);
      res.status(StatusCodes.Success).json(result);
    } catch (error) {
      next(error);
    }
  }

  async votePoll(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(StatusCodes.Unauthorized).json({ message: "Not authenticated" });
        return;
      }
      const { messageId } = req.params;
      const optionIndexes = Array.isArray(req.body.optionIndexes)
        ? (req.body.optionIndexes as unknown[]).filter((n): n is number => typeof n === "number")
        : [];
      const result = await this.chatUseCase.votePoll(req.userId.toString(), messageId, optionIndexes);
      this.io(req)?.to(result.chatId).emit("pollUpdated", result);
      res.status(StatusCodes.Success).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLinkPreview(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const url = typeof req.query.url === "string" ? req.query.url : "";
      assertSafePreviewUrl(url);
      const preview = await this.chatUseCase.getLinkPreview(url);
      if (!preview) {
        res.status(StatusCodes.NotFound).json({ message: "Preview not available" });
        return;
      }
      res.status(StatusCodes.Success).json(preview);
    } catch (error) {
      next(error);
    }
  }

  async getGifs(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      await this.proxyGiphyStickerOrGif(req, res, "gifs");
    } catch (error) {
      next(error);
    }
  }

  async getStickers(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      await this.proxyGiphyStickerOrGif(req, res, "stickers");
    } catch (error) {
      next(error);
    }
  }

  private async proxyGiphyStickerOrGif(
    req: IAuthRequest,
    res: Response,
    kind: "gifs" | "stickers"
  ): Promise<void> {
    const apiKey = process.env.GIPHY_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        message:
          "Giphy is not configured. Set GIPHY_API_KEY in the server .env file (see https://developers.giphy.com/).",
      });
      return;
    }

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    let limit = parseInt(String(req.query.limit ?? "24"), 10);
    if (Number.isNaN(limit)) limit = 24;
    limit = Math.min(50, Math.max(1, limit));

    const base = kind === "gifs" ? "https://api.giphy.com/v1/gifs" : "https://api.giphy.com/v1/stickers";
    const giphyUrl = new URL(q.length > 0 ? `${base}/search` : `${base}/trending`);
    giphyUrl.searchParams.set("api_key", apiKey);
    giphyUrl.searchParams.set("limit", String(limit));
    if (q.length > 0) {
      giphyUrl.searchParams.set("q", q);
    }

    const upstream = await fetch(giphyUrl);
    if (!upstream.ok) {
      await upstream.json().catch(() => null);
      res.status(502).json({ message: "Giphy request failed" });
      return;
    }
    const body: unknown = await upstream.json().catch(() => ({}));
    res.status(StatusCodes.Success).json(body);
  }
}
