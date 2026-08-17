"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelValidator = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
// Custom Zod schema for validating MongoDB ObjectId
const objectIdSchema = zod_1.z
    .string()
    .refine((val) => mongoose_1.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
})
    .transform((val) => new mongoose_1.Types.ObjectId(val)); // Converts string to ObjectId
// Zod schema for Channel Validation
exports.channelValidator = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3, { message: "Channel name must be at least 3 characters long." })
        .max(50, { message: "Channel name cannot exceed 50 characters." }),
    topic: zod_1.z
        .string()
        .max(100, { message: "Topic cannot exceed 100 characters." })
        .optional(),
    description: zod_1.z
        .string()
        .max(500, { message: "Description cannot exceed 500 characters." })
        .optional(),
    createdBy: zod_1.z
        .string()
        .refine((val) => mongoose_1.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId format",
    })
        .transform((val) => new mongoose_1.Types.ObjectId(val)), // Ensure the creator ID is a valid ObjectId
    type: zod_1.z.enum(["info", "chatroom", "voiceroom"], {
        errorMap: () => ({ message: "Type must be either 'info', 'chatroom', or 'voiceroom'." }),
    }),
    allowedRoles: zod_1.z.array(objectIdSchema).min(1, { message: "At least one role must be allowed." }),
    maxParticipants: zod_1.z
        .number()
        .int()
        .positive()
        .max(20, { message: "Max participants cannot exceed 20." })
        .optional(),
});
