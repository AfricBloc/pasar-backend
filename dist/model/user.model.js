"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    //emailVerified: z.boolean().default(false),
    createdAt: zod_1.z.date().default(() => new Date()),
});
