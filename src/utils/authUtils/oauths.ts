import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URL,
} from "@/config/env";
import fetch from "node-fetch";
import { any } from "zod";

/**
 * Builds the Google OAuth2 authorization URL to which the user is redirected.
 * This is the entry point of the Autorization code
 * @param state - cryptographically random string to protect against CSRF
 * @returns full URL  to redirect the user to for Google consent
 */
const getGoogleAuthURL = (state: string): string => {
  // Google's oauth endpoint for requesting user consent
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  //Import the process.env var from env.js
  const params = {
    client_id: GOOGLE_CLIENT_ID, //Remember to add this in your .env.development.local
    redirect_url: `${REDIRECT_URL}/api/v1/auth/google/callback`,
    response_type: "code",
    scope: ["openId", "email", "profile"].join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  };

  //Build query string safely
  const qs = new URLSearchParams(params as Record<string, string>);
  return `${rootUrl}?${qs.toString()}`;
};

const getToken = async (code?: string): Promise<any> => {
  if (!code) {
    throw new Error("Authorization code is required");
  }

  const tokenEndpoint = "https://oauth2.googleapis.com/token";

  const values: Record<string, string> = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: `${process.env.BASE_URL}/api/auth/v1/google/callback`, // correct param name
    grant_type: "authorization_code",
  };

  // POST request to exchange code for tokens
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to exchange code: status=${response.status}, body=${errorText}`
    );
  }

  return response.json();
};

export { getGoogleAuthURL, getToken };
