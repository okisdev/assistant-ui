import { database } from "@/lib/database";
import { account } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export type TokenInfo = {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
};

export function isTokenExpired(tokenExpiresAt: Date | null): boolean {
  if (!tokenExpiresAt) return false;
  return tokenExpiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS < Date.now();
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<TokenInfo | null> {
  const clientId = env.APPLICATION_GOOGLE_CLIENT_ID;
  const clientSecret = env.APPLICATION_GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Google OAuth credentials");
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Google token refresh failed:", error);
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      tokenExpiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}

export async function ensureValidScopeToken(
  accountId: string,
  provider: string,
  currentAccessToken: string,
  currentRefreshToken: string | null,
  tokenExpiresAt: Date | null,
): Promise<string> {
  if (!isTokenExpired(tokenExpiresAt)) {
    return currentAccessToken;
  }

  if (!currentRefreshToken) {
    return currentAccessToken;
  }

  if (provider !== "google") {
    return currentAccessToken;
  }

  const newTokenInfo = await refreshGoogleToken(currentRefreshToken);
  if (!newTokenInfo) {
    return currentAccessToken;
  }

  await database
    .update(account)
    .set({
      accessToken: newTokenInfo.accessToken,
      refreshToken: newTokenInfo.refreshToken,
      accessTokenExpiresAt: newTokenInfo.tokenExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(account.id, accountId));

  return newTokenInfo.accessToken;
}
