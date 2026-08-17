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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const winston_1 = __importDefault(require("winston"));
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const instrumentation_winston_1 = require("@opentelemetry/instrumentation-winston");
const instrumentation_1 = require("@opentelemetry/instrumentation");
const resources_1 = require("@opentelemetry/resources");
// Initialize the Express app
const app = (0, express_1.default)();
exports.app = app;
/** Strip quotes/spaces from .env values like `"http://localhost:4200"` */
function readCorsOrigin() {
    var _a;
    const raw = (_a = process.env.CORS_ORIGIN) !== null && _a !== void 0 ? _a : "http://localhost:4200";
    return raw.replace(/^["']|["']$/g, "").trim();
}
const CORS_ORIGIN = readCorsOrigin();
// Initialize Tracer Provider with service name
const tracerProvider = new sdk_trace_node_1.NodeTracerProvider({
    resource: new resources_1.Resource({
        'service.name': 'my-chat-service',
        'deployment.environment': process.env.NODE_ENV || 'development'
    }),
});
tracerProvider.register();
// Register Winston instrumentation for OpenTelemetry
(0, instrumentation_1.registerInstrumentations)({
    instrumentations: [new instrumentation_winston_1.WinstonInstrumentation()],
});
// Configure Winston Logger
// Configure Winston Logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => {
                // Handle HTTP logs
                if (info.message === 'HTTP request') {
                    const { method, path, status, duration_ms } = info;
                    // Format timestamp as date + colored time
                    const now = new Date();
                    const date = now.toISOString().split('T')[0];
                    const time = now.toISOString().split('T')[1].slice(0, -1); // Remove 'Z'
                    let statusColor = '\x1b[32m'; // Green (2xx Success)
                    if (status >= 500)
                        statusColor = '\x1b[31m'; // Red (5xx Server Error)
                    else if (status >= 400)
                        statusColor = '\x1b[33m'; // Yellow (4xx Client Error)
                    else if (status >= 300)
                        statusColor = '\x1b[36m'; // Cyan (3xx Redirection)
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
            }))
        }),
        new winston_1.default.transports.File({ filename: "logs/app.log" })
    ]
});
// Custom Morgan format for structured logging
const morganJsonFormat = (tokens, req, res) => JSON.stringify({
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
app.use((0, cors_1.default)({
    origin: [CORS_ORIGIN],
    credentials: true
})); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse JSON request bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use((0, cookie_parser_1.default)()); // Parse cookies in request headers
app.use((req, res, next) => {
    // Sanitize sensitive headers
    const sanitizedHeaders = Object.assign({}, req.headers);
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;
    next();
});
// Enhanced Morgan middleware with log level differentiation
app.use((0, morgan_1.default)(':method :url :status :response-time ms', {
    stream: {
        write: (message) => {
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
const auth_router_1 = __importDefault(require("../router/auth.router"));
const error_middleware_1 = __importDefault(require("../middlewares/error.middleware"));
const friends_router_1 = __importDefault(require("../router/friends.router"));
const profile_router_1 = __importDefault(require("../router/profile.router"));
const community_router_1 = __importDefault(require("../router/community.router"));
const channel_router_1 = __importDefault(require("../router/channel.router"));
const role_router_1 = __importDefault(require("../router/role.router"));
const image_router_1 = __importDefault(require("../router/image.router"));
const chat_router_1 = __importDefault(require("../router/chat.router"));
const call_router_1 = __importDefault(require("../router/call.router"));
const voiceroom_router_1 = __importDefault(require("../router/voiceroom.router"));
const http_1 = require("http");
const mongoose_1 = require("mongoose");
const jwt_service_1 = __importDefault(require("../utils/jwt.service"));
const socketAuth_util_1 = require("../utils/socketAuth.util");
const chatDependencies_1 = require("../chatDependencies");
const callSignaling_1 = require("../utils/callSignaling");
const voiceroomPresence_1 = require("../utils/voiceroomPresence");
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
app.use("/auth", auth_router_1.default); // auth router
app.use("/friends", friends_router_1.default); // friend router
app.use("/profile", profile_router_1.default); // Profile router
app.use("/community", community_router_1.default); // community router
app.use("/channel", channel_router_1.default); // channel router
app.use("/role", role_router_1.default); // role router
app.use("/image", image_router_1.default); // image router
app.use("/chat", chat_router_1.default);
app.use("/call", call_router_1.default);
app.use("/voiceroom", voiceroom_router_1.default);
// Error-handling middleware should be the last middleware
app.use(error_middleware_1.default);
const chatUseCase = (0, chatDependencies_1.createChatUseCase)();
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
exports.io = io;
app.set("io", io);
const socketJwtService = new jwt_service_1.default();
io.use((socket, next) => {
    try {
        const token = (0, socketAuth_util_1.extractSocketToken)(socket);
        if (!token) {
            logger.warn("[socket] auth rejected: missing token");
            return next(new Error("Unauthorized"));
        }
        const decoded = socketJwtService.verifyToken(token);
        const raw = decoded.userId;
        const uid = typeof raw === "string"
            ? raw
            : raw != null && typeof raw === "object"
                ? String(raw)
                : "";
        if (!mongoose_1.Types.ObjectId.isValid(uid)) {
            logger.warn("[socket] auth rejected: invalid userId in token");
            return next(new Error("Unauthorized"));
        }
        socket.data.userId = uid;
        next();
    }
    catch (err) {
        logger.warn(`[socket] auth rejected: ${err instanceof Error ? err.message : "verify failed"}`);
        next(new Error("Unauthorized"));
    }
});
io.engine.on("connection_error", (err) => {
    var _a;
    logger.warn(`[socket] connection_error: ${(_a = err.message) !== null && _a !== void 0 ? _a : "unknown"}`);
});
(0, callSignaling_1.registerCallSignaling)(io, chatUseCase);
(0, voiceroomPresence_1.registerVoiceroomPresence)(io);
io.on("connection", (socket) => {
    const connectedUserId = socket.data.userId;
    if (connectedUserId) {
        socket.join(`user:${connectedUserId}`);
        logger.info(`Socket connected userId=${connectedUserId}`);
    }
    socket.on("joinChat", (chatId) => {
        if (typeof chatId === "string" && chatId) {
            socket.join(chatId);
        }
    });
    socket.on("sendMessage", (messageData) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = socket.data.userId;
            if (!userId || !(messageData === null || messageData === void 0 ? void 0 : messageData.chatId) || messageData.content === undefined) {
                socket.emit("chatError", { message: "Invalid message payload" });
                return;
            }
            const savedMessage = yield chatUseCase.sendMessage(userId, messageData.chatId, messageData.content, (_a = messageData.type) !== null && _a !== void 0 ? _a : "text", {
                replyToMessageId: messageData.replyToMessageId,
                metadata: messageData.metadata,
            });
            io.to(messageData.chatId).emit("newMessage", savedMessage);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to send message";
            socket.emit("chatError", { message: msg });
        }
    }));
});
exports.default = app;
