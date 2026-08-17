import express, { Express } from "express";
import { Server } from 'socket.io';
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from 'morgan';
import winston from "winston";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";


// Initialize the Express app
const app: Express = express();

/** Strip quotes/spaces from .env values like `"http://localhost:4200"` */
function readCorsOrigin(): string {
  const raw = process.env.CORS_ORIGIN ?? "http://localhost:4200";
  return raw.replace(/^["']|["']$/g, "").trim();
}

const CORS_ORIGIN: string = readCorsOrigin();



// Initialize Tracer Provider with service name
const tracerProvider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'my-chat-service',
    'deployment.environment': process.env.NODE_ENV || 'development'
  }),
});
tracerProvider.register();

// Register Winston instrumentation for OpenTelemetry
registerInstrumentations({
  instrumentations: [new WinstonInstrumentation()],
});


// Configure Winston Logger
// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          // Handle HTTP logs
          if (info.message === 'HTTP request') {
            const { method, path, status, duration_ms } = info as unknown as {
              method: string;
              path: string;
              status: number;
              duration_ms: number;
            };

            // Format timestamp as date + colored time
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toISOString().split('T')[1].slice(0, -1); // Remove 'Z'

            let statusColor = '\x1b[32m'; // Green (2xx Success)
            if (status >= 500) statusColor = '\x1b[31m'; // Red (5xx Server Error)
            else if (status >= 400) statusColor = '\x1b[33m'; // Yellow (4xx Client Error)
            else if (status >= 300) statusColor = '\x1b[36m'; // Cyan (3xx Redirection)

            return [
              `\x1b[36m${date} \x1b[37m${time}\x1b[0m`, // Cyan date, normal time
              `[${info.level}]`,
              `\x1b[33m${method}\x1b[0m`, // Yellow method
              path,
              `${statusColor}${status}\x1b[0m`, // Colored status
              `\x1b[90m${duration_ms}ms\x1b[0m` // Grey duration
            ].join(' ');
          }

          // Default log format
          const now = new Date();
          const date = now.toISOString().split('T')[0];
          const time = now.toISOString().split('T')[1].slice(0, -1);
          return `\x1b[36m${date} \x1b[37m${time}\x1b[0m [${info.level}] ${info.message}`;
        })
      )
    }),
    new winston.transports.File({ filename: "logs/app.log" })
  ]
});


// Custom Morgan format for structured logging
const morganJsonFormat: morgan.FormatFn<express.Request, express.Response> = (
  tokens, req, res
) => JSON.stringify({
  message: `${tokens.method(req, res)} ${tokens.url(req, res)}`,
  method: tokens.method(req, res),
  path: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  duration_ms: Number(tokens['response-time'](req, res)),
  client_ip: tokens['remote-addr'](req, res),
  user_agent: tokens['user-agent'](req, res),
  referrer: tokens.referrer(req, res),
  protocol: `HTTP/${tokens['http-version'](req, res)}`,
  content_length: tokens.res(req, res, 'content-length'),
});



// Middlewares
app.use(cors({
  origin: [CORS_ORIGIN],
  credentials: true
})); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(cookieParser()); // Parse cookies in request headers


app.use((req, res, next) => {
  // Sanitize sensitive headers
  const sanitizedHeaders = { ...req.headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;

  next();
});

// Enhanced Morgan middleware with log level differentiation
app.use(morgan(':method :url :status :response-time ms', {
  stream: {
    write: (message: string) => {
      const [method, url, status, responseTime] = message.split(' ');
      logger.info('HTTP request', {
        method,
        path: url,
        status: parseInt(status),
        duration_ms: parseFloat(responseTime)
      });
    }
  }
}));

import authRouter from "../router/auth.router";
import errorHandlerMiddleware from "../middlewares/error.middleware";
import friendRouter from "../router/friends.router";
import profileRouter from "../router/profile.router";
import communityRouter from "../router/community.router";
import channelRouter from "../router/channel.router";
import roleRouter from "../router/role.router";
import imageRouter from "../router/image.router";
import chatRouter from "../router/chat.router";
import callRouter from "../router/call.router";
import voiceroomRouter from "../router/voiceroom.router";
import { createServer } from "http";
import { Types } from "mongoose";
import JWTService from "../utils/jwt.service";
import { extractSocketToken } from "../utils/socketAuth.util";
import { createChatUseCase } from "../chatDependencies";
import { registerCallSignaling } from "../utils/callSignaling";
import { registerVoiceroomPresence } from "../utils/voiceroomPresence";

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/auth", authRouter); // auth router
app.use("/friends", friendRouter); // friend router
app.use("/profile", profileRouter); // Profile router
app.use("/community", communityRouter); // community router
app.use("/channel", channelRouter); // channel router
app.use("/role", roleRouter); // role router
app.use("/image", imageRouter); // image router
app.use("/chat", chatRouter);
app.use("/call", callRouter);
app.use("/voiceroom", voiceroomRouter);

// Error-handling middleware should be the last middleware
app.use(errorHandlerMiddleware);

const chatUseCase = createChatUseCase();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

const socketJwtService = new JWTService();

io.use((socket, next) => {
  try {
    const token = extractSocketToken(socket);
    if (!token) {
      logger.warn("[socket] auth rejected: missing token");
      return next(new Error("Unauthorized"));
    }
    const decoded = socketJwtService.verifyToken(token) as unknown as {
      userId?: string | { toString(): string };
    };
    const raw = decoded.userId;
    const uid =
      typeof raw === "string"
        ? raw
        : raw != null && typeof raw === "object"
          ? String(raw)
          : "";
    if (!Types.ObjectId.isValid(uid)) {
      logger.warn("[socket] auth rejected: invalid userId in token");
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = uid;
    next();
  } catch (err) {
    logger.warn(
      `[socket] auth rejected: ${err instanceof Error ? err.message : "verify failed"}`
    );
    next(new Error("Unauthorized"));
  }
});

io.engine.on("connection_error", (err: { message?: string; context?: unknown }) => {
  logger.warn(`[socket] connection_error: ${err.message ?? "unknown"}`);
});

registerCallSignaling(io, chatUseCase);
registerVoiceroomPresence(io);

io.on("connection", (socket) => {
  const connectedUserId = socket.data.userId as string | undefined;
  if (connectedUserId) {
    socket.join(`user:${connectedUserId}`);
    logger.info(`Socket connected userId=${connectedUserId}`);
  }

  socket.on("joinChat", (chatId: string) => {
    if (typeof chatId === "string" && chatId) {
      socket.join(chatId);
    }
  });

  socket.on(
    "sendMessage",
    async (messageData: {
      chatId?: string;
      content?: string;
      type?: string;
      replyToMessageId?: string;
      metadata?: string;
    }) => {
      try {
        const userId = socket.data.userId as string | undefined;
        if (!userId || !messageData?.chatId || messageData.content === undefined) {
          socket.emit("chatError", { message: "Invalid message payload" });
          return;
        }
        const savedMessage = await chatUseCase.sendMessage(
          userId,
          messageData.chatId,
          messageData.content,
          messageData.type ?? "text",
          {
            replyToMessageId: messageData.replyToMessageId,
            metadata: messageData.metadata,
          }
        );

        io.to(messageData.chatId).emit("newMessage", savedMessage);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to send message";
        socket.emit("chatError", { message: msg });
      }
    }
  );
});

export { app, httpServer, io };
export default app;