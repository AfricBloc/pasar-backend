"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    // Debugging: log the incoming body
    console.log("Incoming request body:", req.body);
    // Check if body exists
    if (!req.body) {
        return res.status(400).json({
            success: false,
            error: "Request body is missing",
        });
    }
    const result = schema.safeParse(req.body);
    console.log(result);
    if (!result.success) {
        console.error("Validation errors:", result.error);
        return res.status(400).json({
            success: false,
            errors: result.error.flatten(), // More detailed than just fieldErrors
        });
    }
    req.body = result.data;
    next();
};
exports.validate = validate;
