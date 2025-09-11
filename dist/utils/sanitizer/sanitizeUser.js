"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizer = void 0;
const sanitizer = (user) => {
    const { password, ...safeUser } = user;
    return safeUser;
};
exports.sanitizer = sanitizer;
