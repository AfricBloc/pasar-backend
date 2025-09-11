"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.getAllUsers = exports.getSingleUser = void 0;
const index_1 = require("../../utils/response/index");
const index_2 = __importDefault(require("../../db/index"));
const getSingleUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await index_2.default.query("SELECT * FROM users WHERE id = $1", [
            userId,
        ]);
        console.log("Query result:", result);
        console.log("Query result:", result.rows);
        if (result.rows.length === 0) {
            return (0, index_1.sendError)(res, "User not found", 404);
        }
        return (0, index_1.sendSuccess)(res, "User retrieved successfully", result.rows[0]);
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        return (0, index_1.sendError)(res, "Failed to retrieve user", 500);
    }
};
exports.getSingleUser = getSingleUser;
const getAllUsers = async (req, res) => {
    try {
        const result = await index_2.default.query("SELECT * FROM users");
        if (result.rows.length === 0) {
            return (0, index_1.sendError)(res, "No users found", 404);
        }
        return (0, index_1.sendSuccess)(res, "Users retrieved successfully", result.rows);
    }
    catch (error) {
        console.error("Error retrieving users:", error);
        return (0, index_1.sendError)(res, "Failed to retrieve users", 500);
    }
};
exports.getAllUsers = getAllUsers;
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await index_2.default.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);
        if (result.rows.length === 0) {
            return (0, index_1.sendError)(res, "User not found", 404);
        }
        return (0, index_1.sendSuccess)(res, "User deleted successfully", result.rows[0]);
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return (0, index_1.sendError)(res, "Failed to delete user", 500);
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { username, email, password } = req.body;
    try {
        // Check if the user exists
        const existingUser = await index_2.default.query("SELECT * FROM users WHERE id = $1", [userId]);
        if (existingUser.rows.length === 0) {
            return (0, index_1.sendError)(res, "User not found", 404);
        }
        // Update user details
        const result = await index_2.default.query("UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *", [username, email, password, userId]);
        return (0, index_1.sendSuccess)(res, "User updated successfully", result.rows[0]);
    }
    catch (error) {
        console.error("Error updating user:", error);
        return (0, index_1.sendError)(res, "Failed to update user", 500);
    }
};
exports.updateUser = updateUser;
