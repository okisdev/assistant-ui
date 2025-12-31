import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  buildAuthorizationUrl,
  getOAuthConfig,
} from "@/lib/integrations/oauth";

const OAUTH_STATE_COOKIE = "app_oauth_state";
const OAUTH_PROVIDER_COOKIE = "app_oauth_provider";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  const session = await getSession();

  if (!session?.user?.id) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const config = getOAuthConfig(provider);
  if (!config) {
    return redirectWithError(req, `Unknown provider: ${provider}`);
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL(
    `/api/connect/${provider}/callback`,
    req.url,
  ).toString();

  const authUrl = buildAuthorizationUrl(provider, redirectUri, state);
  if (!authUrl) {
    return redirectWithError(req, `OAuth not configured for ${provider}`);
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

function redirectWithError(req: NextRequest, error: string): NextResponse {
  const url = new URL("/apps", req.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}
