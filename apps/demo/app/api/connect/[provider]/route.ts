import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  buildAuthorizationUrl,
  getOAuthConfig,
} from "@/lib/integrations/oauth";

const OAUTH_STATE_COOKIE = "app_oauth_state";
const OAUTH_PROVIDER_COOKIE = "app_oauth_provider";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const config = getOAuthConfig(provider);
  if (!config) {
    return redirectWithError(request, `Unknown provider: ${provider}`);
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL(
    `/api/connect/${provider}/callback`,
    request.url,
  ).toString();

  const authUrl = buildAuthorizationUrl(provider, redirectUri, state);
  if (!authUrl) {
    return redirectWithError(request, `OAuth not configured for ${provider}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
  });
  cookieStore.set(OAUTH_PROVIDER_COOKIE, provider, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(authUrl);
}

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL("/apps", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
