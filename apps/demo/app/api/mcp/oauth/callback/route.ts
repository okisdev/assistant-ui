import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
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
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return redirectWithError(request, errorDescription ?? error);
  }

  if (!code || !state) {
    return redirectWithError(request, "Missing code or state parameter");
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const serverId = cookieStore.get(OAUTH_SERVER_ID_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_SERVER_ID_COOKIE);

  if (!storedState || storedState !== state) {
    return redirectWithError(request, "Invalid state parameter");
  }

  if (!serverId) {
    return redirectWithError(request, "Missing server ID");
  }

  const callbackUrl = new URL("/api/mcp/oauth/callback", request.url);
  const redirectUri = callbackUrl.toString();

  try {
    await api.mcpServer.exchangeOAuthCode({
      id: serverId,
      code,
      redirectUri,
    });

    return redirectWithSuccess(request);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token exchange failed";
    console.error("OAuth callback error:", message);
    return redirectWithError(request, message);
  }
}

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL("/integrations", request.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}

function redirectWithSuccess(request: NextRequest): NextResponse {
  const url = new URL("/integrations", request.url);
  url.searchParams.set("oauth_success", "true");
  return NextResponse.redirect(url);
}
