import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { GOOGLE_CLIENT_ID, NODE_ENV } from "@/config/env";
import { Request, Response } from "express";
import { getGoogleAuthURL, getToken } from "@/utils/authUtils/oauths";
import { sendError } from "@/middleware";
import { sendSuccess } from "@/utils/response";

//Init Google's verifier client once
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * entry point: redirects the user to google's oauth2 consent page
 * Generates and set a CSRF-protection state value in a cookie
 * @param req
 * @param res
 */

export const redirectToGoogle = (req: Request, res: Response) => {
  // Generate a cryptographically strong random state string to prevent CSRF
  // const state = crypto.randomBytes(16).toString("hex");
  const state: string = crypto.randomBytes(16).toString("hex");
  //store state in a cookie so we can validate it on callback.
  //HTTPOnly so js cant read it, samesite to reduce csrf risk

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    maxAge: 5 * 60 * 1000, // (5 minutes)
  });

  //Redirect user to Google's Oauth consent screen
  return res.redirect(getGoogleAuthURL(state));
};

/**
 * Callback endpoint that google redirects to after user consent.
 * Validates states, exchanges code for tokens, verifies ID token,
 * and returns the authenticated Google user info for now
 * @param req
 * @param res
 */
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    //Retrieve original state from cookie for csft validation
    const storedState = req.cookies["oauth_state"];
    if (!state || typeof state !== "string" || state !== storedState) {
      return sendError(res, "Invalid or missing state parameter", 400);
    }

    if (!code || typeof code !== "string") {
      return sendError(res, "Missing authorization code", 400);
    }

    //Exchange authorization code for tokens (id_token, access_tokens)
    const tokenResponse: any = await getToken(code);
    const idToken = tokenResponse.id_token;
    if (!idToken) {
      return sendError(res, "No ID token returned from google", 400);
    }

    //verify the ID tokens's integrity, audience, issuer, expiry etc.
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return sendError(res, "Invalid ID token payload", 401);
    }

    return sendSuccess(
      res,
      "Authentication successful",
      { googleUser: payload },
      200
    );
  } catch (err) {
    console.log("Google OAuth callback Error", err);
    return sendError(res, "Internal authentication error", 500);
  }
};
