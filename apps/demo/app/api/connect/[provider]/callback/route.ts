import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  exchangeCodeForToken,
  extractProviderMetadata,
} from "@/lib/integrations/oauth";
import { getBuiltinAppByProvider } from "@/lib/integrations/apps";
import { api } from "@/utils/trpc/server";

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
    return redirectWithError(request, "Session expired");
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
  const storedProvider = cookieStore.get(OAUTH_PROVIDER_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_PROVIDER_COOKIE);

  if (!storedState || storedState !== state) {
    return redirectWithError(request, "Invalid state parameter");
  }

  if (!storedProvider || storedProvider !== provider) {
    return redirectWithError(request, "Provider mismatch");
  }

  const app = getBuiltinAppByProvider(provider);
  if (!app) {
    return redirectWithError(request, `Unknown provider: ${provider}`);
  }

  const redirectUri = new URL(
    `/api/connect/${provider}/callback`,
    request.url,
  ).toString();

  const tokenResponse = await exchangeCodeForToken(provider, code, redirectUri);
  if (!tokenResponse?.access_token) {
    return redirectWithError(
      request,
      "Failed to obtain access token",
      app.slug,
    );
  }

  const { externalId, externalName, metadata } = extractProviderMetadata(
    provider,
    tokenResponse,
  );

  const tokenExpiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  try {
    await api.apps.application.saveOAuthConnection({
      applicationId: app.id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      tokenExpiresAt,
      externalId: externalId ?? null,
      externalName: externalName ?? null,
      oauthMetadata: metadata ?? null,
    });

    return redirectWithSuccess(request, app.slug);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save connection";
    console.error(`OAuth callback error for ${provider}:`, message);
    return redirectWithError(request, message, app.slug);
  }
}

function redirectWithError(
  request: NextRequest,
  error: string,
  slug?: string,
): NextResponse {
  const url = new URL(slug ? `/apps/${slug}` : "/apps", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function redirectWithSuccess(request: NextRequest, slug: string): NextResponse {
  const url = new URL(`/apps/${slug}`, request.url);
  url.searchParams.set("connected", "true");
  return NextResponse.redirect(url);
}
