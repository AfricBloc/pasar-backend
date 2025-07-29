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

export {
    createUser,
};