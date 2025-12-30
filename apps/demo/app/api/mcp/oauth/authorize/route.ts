import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";

import { auth } from "@/lib/auth";
import { buildOAuthAuthorizationUrl } from "@/lib/mcp-auth";
import { api } from "@/utils/trpc/server";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "mcp_oauth_state";
const OAUTH_SERVER_ID_COOKIE = "mcp_oauth_server_id";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirectWithError(request, "Unauthorized");
  }

  const searchParams = request.nextUrl.searchParams;
  const serverId = searchParams.get("serverId");

  if (!serverId) {
    return redirectWithError(request, "Missing serverId parameter");
  }

  const callbackUrl = new URL("/api/mcp/oauth/callback", request.url);
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
    return redirectWithError(request, message);
  }
}

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL("/integrations", request.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}
