import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { database } from "@/lib/database";
import { mcpServer } from "@/lib/database/schema";
import { encrypt } from "@/lib/crypto";
import {
  buildOAuthAuthorizationUrl,
  discoverOAuthMetadata,
  registerOAuthClient,
} from "@/lib/mcp-auth";

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

  const [server] = await database
    .select({
      id: mcpServer.id,
      name: mcpServer.name,
      url: mcpServer.url,
      oauthClientId: mcpServer.oauthClientId,
      oauthClientSecret: mcpServer.oauthClientSecret,
      oauthAuthorizationUrl: mcpServer.oauthAuthorizationUrl,
      oauthTokenUrl: mcpServer.oauthTokenUrl,
      oauthScope: mcpServer.oauthScope,
    })
    .from(mcpServer)
    .where(
      and(eq(mcpServer.id, serverId), eq(mcpServer.userId, session.user.id)),
    )
    .limit(1);

  if (!server) {
    return redirectWithError(request, "MCP server not found");
  }

  const callbackUrl = new URL("/api/mcp/oauth/callback", request.url);
  const redirectUri = callbackUrl.toString();

  let clientId = server.oauthClientId;
  let clientSecret = server.oauthClientSecret;
  let authorizationUrl = server.oauthAuthorizationUrl;
  let tokenUrl = server.oauthTokenUrl;
  let scope = server.oauthScope;

  if (!authorizationUrl || !tokenUrl) {
    const metadata = await discoverOAuthMetadata(server.url);

    if (!metadata) {
      return redirectWithError(
        request,
        "Unable to discover OAuth configuration from MCP server. The server may not support OAuth.",
      );
    }

    authorizationUrl = metadata.authorization_endpoint;
    tokenUrl = metadata.token_endpoint;

    if (!scope && metadata.scopes_supported?.length) {
      scope = metadata.scopes_supported.join(" ");
    }

    if (metadata.registration_endpoint && !clientId) {
      try {
        const clientRegistration = await registerOAuthClient(
          metadata.registration_endpoint,
          redirectUri,
          `assistant-ui with ${server.name}`,
        );

        clientId = clientRegistration.client_id;
        clientSecret = clientRegistration.client_secret
          ? encrypt(clientRegistration.client_secret)
          : null;
      } catch (error) {
        console.error("Failed to register OAuth client:", error);
        return redirectWithError(
          request,
          "Failed to register OAuth client with MCP server",
        );
      }
    }

    await database
      .update(mcpServer)
      .set({
        oauthClientId: clientId,
        oauthClientSecret: clientSecret,
        oauthAuthorizationUrl: authorizationUrl,
        oauthTokenUrl: tokenUrl,
        oauthScope: scope,
      })
      .where(eq(mcpServer.id, serverId));
  }

  if (!clientId || !authorizationUrl) {
    return redirectWithError(
      request,
      "OAuth configuration is incomplete. Client ID and authorization URL are required.",
    );
  }

  const state = nanoid(32);

  const authUrl = buildOAuthAuthorizationUrl(
    {
      clientId,
      clientSecret: "",
      authorizationUrl,
      tokenUrl: tokenUrl ?? "",
      scope: scope ?? undefined,
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
}

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL("/integrations", request.url);
  url.searchParams.set("oauth_error", error);
  return NextResponse.redirect(url);
}
