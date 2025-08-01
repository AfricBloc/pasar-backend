import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }

    // Attach validated data to request object for controller use
    req.body = result.data;
    next();
  };
