"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.redirectToGoogle = void 0;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("@/config/env.config");
const oauths_1 = require("@/utils/authUtils/oauths");
const response_1 = require("@/utils/response");
const response_2 = require("@/utils/response");
const db_1 = __importDefault(require("@/db"));
//Init Google's verifier client once
const oauthClient = new google_auth_library_1.OAuth2Client(env_config_1.GOOGLE_CLIENT_ID);
/**
 * entry point: redirects the user to google's oauth2 consent page
 * Generates and set a CSRF-protection state value in a cookie
 * @param req
 * @param res
 */
const redirectToGoogle = (req, res) => {
    // Generate a cryptographically strong random state string to prevent CSRF
    // const state = crypto.randomBytes(16).toString("hex");
    const state = crypto_1.default.randomBytes(16).toString("hex");
    //store state in a cookie so we can validate it on callback.
    //HTTPOnly so js cant read it, samesite to reduce csrf risk
    res.cookie("oauth_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_config_1.ENV === "production",
        maxAge: 5 * 60 * 1000, // (5 minutes)
    });
    //Redirect user to Google's Oauth consent screen
    return res.redirect((0, oauths_1.getGoogleAuthURL)(state));
};
exports.redirectToGoogle = redirectToGoogle;
/**
 * Callback endpoint that google redirects to after user consent.
 * Validates states, exchanges code for tokens, verifies ID token,
 * and returns the authenticated Google user info for now
 * @param req
 * @param res
 */
const googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        //Retrieve original state from cookie for csft validation
        const storedState = req.cookies["oauth_state"];
        if (!state || typeof state !== "string" || state !== storedState) {
            return (0, response_1.sendError)(res, "Invalid or missing state parameter", 400);
        }
        if (!code || typeof code !== "string") {
            return (0, response_1.sendError)(res, "Missing authorization code", 400);
        }
        //Exchange authorization code for tokens (id_token, access_tokens)
        const tokenResponse = await (0, oauths_1.getToken)(code);
        const idToken = tokenResponse.id_token;
        if (!idToken) {
            return (0, response_1.sendError)(res, "No ID token returned from google", 400);
        }
        //verify the ID tokens's integrity, audience, issuer, expiry etc.
        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: env_config_1.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return (0, response_1.sendError)(res, "Invalid ID token payload", 401);
        }
        const { sub: googleId, email, name, picture, email_verified } = payload;
        if (!email) {
            return res.status(400).json({ error: "Email not provided by Google" });
        }
        // Start user upsert/link logic
        // 1. Try to find by google_id
        let userRes = await db_1.default.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
        let user;
        if (userRes.rows.length === 0) {
            // 2. Try to find by email (existing non-Google user)
            userRes = await db_1.default.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);
            if (userRes.rows.length === 0) {
                // 3. Create new user via Google login
                const insertRes = await db_1.default.query(`INSERT INTO users 
            (email, email_verified, google_id, full_name, picture_url, is_active, metadata)
           VALUES ($1, $2, $3, $4, $5, TRUE, '{}'::jsonb)
           RETURNING *`, [
                    email,
                    email_verified ?? true,
                    googleId,
                    name || null,
                    picture || null,
                ]);
                user = insertRes.rows[0];
            }
            else {
                // Existing user with same email: link Google account
                user = userRes.rows[0];
                if (!user.google_id) {
                    await db_1.default.query(`UPDATE users 
             SET google_id = $1, email_verified = TRUE, full_name = COALESCE($2, full_name), picture_url = COALESCE($3, picture_url)
             WHERE id = $4`, [googleId, name, picture, user.id]);
                    const updated = await db_1.default.query("SELECT * FROM users WHERE id = $1", [user.id]);
                    user = updated.rows[0];
                }
            }
        }
        else {
            user = userRes.rows[0];
            // Optionally: refresh picture/name if changed
            await db_1.default.query(`UPDATE users 
         SET full_name = COALESCE($1, full_name), picture_url = COALESCE($2, picture_url)
         WHERE id = $3`, [name, picture, user.id]);
            const refreshed = await db_1.default.query("SELECT * FROM users WHERE id = $1", [user.id]);
            user = refreshed.rows[0];
        }
        console.log("user:", user);
        // Issue application JWT (minimal claims)
        const appToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_config_1.JWT_SECRET, { expiresIn: "7d" });
        // Secure session cookie
        res.cookie("session", appToken, {
            httpOnly: true,
            secure: env_config_1.ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Optionally update last_login_at
        await db_1.default.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
        //return res.redirect("/home"); // replace with your post-login
        return (0, response_2.sendSuccess)(res, "Authentication successful", { googleUser: payload }, 200);
    }
    catch (err) {
        console.log("Google OAuth callback Error", err);
        return (0, response_1.sendError)(res, "Internal authentication error", 500);
    }
};
exports.googleCallback = googleCallback;
