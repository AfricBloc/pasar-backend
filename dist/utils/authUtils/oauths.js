"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = exports.getGoogleAuthURL = void 0;
const env_config_1 = require("../../config/env.config");
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Builds the Google OAuth2 authorization URL to which the user is redirected.
 * This is the entry point of the Autorization code
 * @param state - cryptographically random string to protect against CSRF
 * @returns full URL  to redirect the user to for Google consent
 */
const getGoogleAuthURL = (state) => {
    // Google's oauth endpoint for requesting user consent
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    //Import the process.env var from env.js
    const params = {
        client_id: env_config_1.GOOGLE_CLIENT_ID, //Remember to add this in your .env.development.local
        redirect_uri: `${env_config_1.REDIRECT_URL}/api/v1/auth/google/callback`,
        response_type: "code",
        scope: ["openid", "email", "profile"].join(" "),
        state,
        access_type: "offline",
        prompt: "consent",
    };
    //Build query string safely
    const qs = new URLSearchParams(params);
    return `${rootUrl}?${qs.toString()}`;
};
exports.getGoogleAuthURL = getGoogleAuthURL;
const getToken = async (code) => {
    if (!code) {
        throw new Error("Authorization code is required");
    }
    const tokenEndpoint = "https://oauth2.googleapis.com/token";
    const values = {
        code,
        client_id: env_config_1.GOOGLE_CLIENT_ID ?? "",
        client_secret: env_config_1.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${env_config_1.REDIRECT_URL}/api/auth/v1/google/callback`, // correct param name
        grant_type: "authorization_code",
    };
    console.log(values);
    // POST request to exchange code for tokens
    const response = await (0, node_fetch_1.default)(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(values),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to exchange code: status=${response.status}, body=${errorText}`);
    }
    return response.json();
};
exports.getToken = getToken;
