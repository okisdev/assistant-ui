import { decrypt, encrypt } from "@/lib/crypto";

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope?: string;
  redirectUri: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

export type MCPServerAuth = {
  headers: Record<string, string> | null;
  oauthClientId: string | null;
  oauthClientSecret: string | null;
  oauthAuthorizationUrl: string | null;
  oauthTokenUrl: string | null;
  oauthScope: string | null;
  oauthAccessToken: string | null;
  oauthRefreshToken: string | null;
  oauthTokenExpiresAt: Date | null;
};

export type OAuthServerMetadata = {
  issuer?: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  code_challenge_methods_supported?: string[];
};

export type ClientRegistrationResponse = {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
};

export async function discoverOAuthMetadata(
  mcpServerUrl: string,
): Promise<OAuthServerMetadata | null> {
  const baseUrl = new URL(mcpServerUrl);
  const wellKnownUrl = new URL(
    "/.well-known/oauth-authorization-server",
    baseUrl.origin,
  );

  try {
    const response = await fetch(wellKnownUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const mcpWellKnownUrl = new URL(
        `${baseUrl.pathname}/.well-known/oauth-authorization-server`,
        baseUrl.origin,
      );

      const altResponse = await fetch(mcpWellKnownUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!altResponse.ok) {
        return null;
      }

      return altResponse.json();
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function registerOAuthClient(
  registrationEndpoint: string,
  redirectUri: string,
  clientName: string,
): Promise<ClientRegistrationResponse> {
  const response = await fetch(registrationEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      client_name: clientName,
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Client registration failed: ${errorText}`);
  }

  return response.json();
}

export function buildOAuthAuthorizationUrl(
  config: OAuthConfig,
  state: string,
): string {
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);

  if (config.scope) {
    url.searchParams.set("scope", config.scope);
  }

  return url.toString();
}

export async function exchangeCodeForTokens(
  config: OAuthConfig,
  code: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

export async function refreshAccessToken(
  config: OAuthConfig,
  refreshToken: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

export function getOAuthAuthorizationHeader(
  server: MCPServerAuth,
): string | null {
  if (!server.oauthAccessToken) return null;
  return `Bearer ${decrypt(server.oauthAccessToken)}`;
}

export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const bufferMs = 5 * 60 * 1000;
  return new Date(expiresAt).getTime() - bufferMs < Date.now();
}

export function createOAuthConfig(
  server: MCPServerAuth,
  redirectUri: string,
): OAuthConfig | null {
  if (
    !server.oauthClientId ||
    !server.oauthClientSecret ||
    !server.oauthAuthorizationUrl ||
    !server.oauthTokenUrl
  ) {
    return null;
  }

  return {
    clientId: server.oauthClientId,
    clientSecret: decrypt(server.oauthClientSecret),
    authorizationUrl: server.oauthAuthorizationUrl,
    tokenUrl: server.oauthTokenUrl,
    scope: server.oauthScope ?? undefined,
    redirectUri,
  };
}

export function encryptOAuthFields(data: {
  oauthClientSecret?: string | null;
  oauthAccessToken?: string | null;
  oauthRefreshToken?: string | null;
}): {
  oauthClientSecret?: string | null;
  oauthAccessToken?: string | null;
  oauthRefreshToken?: string | null;
} {
  return {
    oauthClientSecret: data.oauthClientSecret
      ? encrypt(data.oauthClientSecret)
      : data.oauthClientSecret,
    oauthAccessToken: data.oauthAccessToken
      ? encrypt(data.oauthAccessToken)
      : data.oauthAccessToken,
    oauthRefreshToken: data.oauthRefreshToken
      ? encrypt(data.oauthRefreshToken)
      : data.oauthRefreshToken,
  };
}
