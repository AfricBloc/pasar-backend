import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email(),
  password: z.string().min(6),
  isVerified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});
