"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityUpdateValidator = exports.communityValidator = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
// Custom transform function to convert string to ObjectId
const objectIdSchema = zod_1.z
    .string()
    .refine((val) => mongoose_1.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
})
    .transform((val) => new mongoose_1.Types.ObjectId(val)); // Convert to ObjectId
exports.communityValidator = zod_1.z.object({
    // Validate that image is a valid URL string.
    imageUrl: zod_1.z.string().url({ message: "Invalid image URL" }),
    // Validate that coverImage is a valid URL string.
    coverImageUrl: zod_1.z.string().url({ message: "Invalid cover image URL" }),
    name: zod_1.z
        .string()
        .min(3, { message: "Community name must be at least 3 characters long." })
        .max(50, { message: "Community name cannot exceed 50 characters." }),
    description: zod_1.z
        .string()
        .max(500, { message: "Description cannot exceed 500 characters." })
        .optional(),
    type: zod_1.z.enum(["public", "private"], {
        errorMap: () => ({ message: "Type must be either 'public' or 'private'." }),
    }),
    ownerId: objectIdSchema, // ✅ Now returns `Types.ObjectId`
    tags: zod_1.z
        .array(objectIdSchema) // ✅ Now each tag is an ObjectId
        .default([]),
});
/** Partial updates for PUT /community/update/:id */
exports.communityUpdateValidator = exports.communityValidator.partial();
