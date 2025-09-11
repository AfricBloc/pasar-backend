"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = void 0;
const sendError = (res, message, statusCode = 404) => {
    return res.status(statusCode).json({
        success: false,
        message: message,
        statusCode: statusCode,
    });
};
exports.sendError = sendError;
const sendSuccess = (res, message, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data,
        statusCode: statusCode,
    });
};
exports.sendSuccess = sendSuccess;
