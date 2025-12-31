import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";

import { getSession } from "@/lib/auth";
import { buildOAuthAuthorizationUrl } from "@/lib/mcp-auth";
import { api } from "@/utils/trpc/server";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "mcp_oauth_state";
const OAUTH_SERVER_ID_COOKIE = "mcp_oauth_server_id";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return redirectWithError(req, "Unauthorized");
  }

  const searchParams = req.nextUrl.searchParams;
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return redirectWithError(req, "Missing serverId parameter");
  }

  const callbackUrl = new URL("/api/mcp/oauth/callback", req.url);
  const redirectUri = callbackUrl.toString();

  try {
    const oauthConfig = await api.apps.mcp.initiateOAuth({
      id: serverId,
      redirectUri,
    });

    const state = nanoid(32);

    const authUrl = buildOAuthAuthorizationUrl(
      {
        clientId: oauthConfig.clientId,
        clientSecret: "",
        authorizationUrl: oauthConfig.authorizationUrl,
        tokenUrl: oauthConfig.tokenUrl ?? "",
        scope: oauthConfig.scope ?? undefined,
        redirectUri,
      },
      state,
    );

    const cookieStore = await cookies();

    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    cookieStore.set(OAUTH_SERVER_ID_COOKIE, serverId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return NextResponse.redirect(authUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to initiate OAuth";
    console.error("OAuth authorize error:", message);
    return redirectWithError(req, message);
  }
}

function redirectWithError(req: NextRequest, error: string): NextResponse {
  const url = new URL("/integrations", req.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}
