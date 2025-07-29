import { sendError, sendSuccess } from "../middleware";
import { Request, Response } from "express";
import poolConfig  from "../db/index";
import bcrypt from 'bcryptjs'


const createUser = async (req: Request, res: Response) => {
    let { username, email, password } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);
    
    password = hashPassword;

    // Check if the user already exists
    const existingUser = await poolConfig.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
        return sendError(res, "User already exists", 400);
    }

    try {
        const result = await poolConfig.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
            [username, email, password]
        );
        const newUser = result.rows[0];
        return sendSuccess(res, "User created successfully", newUser);
    } catch (error) {
        console.error("Error creating user:", error);
        return sendError(res, "Failed to create user", 500);
        
    }
};

const getSingleUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const result = await poolConfig.query("SELECT * FROM users WHERE id = $1", [userId]);
        console.log("Query result:", result);
        console.log("Query result:", result.rows);
        if (result.rows.length === 0) {
            return sendError(res, "User not found", 404);
        }
        return sendSuccess(res, "User retrieved successfully", result.rows[0]);
    } catch (error) {
        console.error("Error retrieving user:", error);
        return sendError(res, "Failed to retrieve user", 500);
    }
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await poolConfig.query("SELECT * FROM users");
        if (result.rows.length === 0) {
            return sendError(res, "No users found", 404);
        }
        return sendSuccess(res, "Users retrieved successfully", result.rows);
    } catch (error) {
        console.error("Error retrieving users:", error);
        return sendError(res, "Failed to retrieve users", 500);
    }
};

const deleteUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const result = await poolConfig.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);
        if (result.rows.length === 0) {
            return sendError(res, "User not found", 404);
        }
        return sendSuccess(res, "User deleted successfully", result.rows[0]);
    } catch (error) {
        console.error("Error deleting user:", error);
        return sendError(res, "Failed to delete user", 500);
    }
};

const updateUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { username, email, password } = req.body;
    try {
        // Check if the user exists
        const existingUser = await poolConfig.query("SELECT * FROM users WHERE id = $1", [userId]);
        if (existingUser.rows.length === 0) {
            return sendError(res, "User not found", 404);
        }

        // Update user details
        const result = await poolConfig.query(
            "UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *",
            [username, email, password, userId]
        );
        return sendSuccess(res, "User updated successfully", result.rows[0]);
    } catch (error) {
        console.error("Error updating user:", error);
        return sendError(res, "Failed to update user", 500);
    }
}

export {
    createUser,
    getSingleUser,
    getAllUsers,
    deleteUser,
    updateUser
};