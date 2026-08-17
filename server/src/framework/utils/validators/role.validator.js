"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleValidator = void 0;
const zod_1 = require("zod");
exports.roleValidator = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Role name is required." }),
    permissions: zod_1.z.array(zod_1.z.string()).nonempty({ message: "At least one permission is required." }),
});
