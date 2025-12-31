import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
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
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return redirectWithError(req, errorDescription ?? error);
  }

  if (!code || !state) {
    return redirectWithError(req, "Missing code or state parameter");
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const serverId = cookieStore.get(OAUTH_SERVER_ID_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_SERVER_ID_COOKIE);

  if (!storedState || storedState !== state) {
    return redirectWithError(req, "Invalid state parameter");
  }

  if (!serverId) {
    return redirectWithError(req, "Missing server ID");
  }

  const callbackUrl = new URL("/api/mcp/oauth/callback", req.url);
  const redirectUri = callbackUrl.toString();

  try {
    await api.apps.mcp.exchangeOAuthCode({
      id: serverId,
      code,
      redirectUri,
    });

    return redirectWithSuccess(req);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token exchange failed";
    console.error("OAuth callback error:", message);
    return redirectWithError(req, message);
  }
}

function redirectWithError(req: NextRequest, error: string): NextResponse {
  const url = new URL("/integrations", req.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}

function redirectWithSuccess(req: NextRequest): NextResponse {
  const url = new URL("/integrations", req.url);
  url.searchParams.set("oauth_success", "true");
  return NextResponse.redirect(url);
}
