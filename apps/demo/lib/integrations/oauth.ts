import { env } from "@/lib/env";
import { getBuiltinAppByProvider, type OAuthConnectionConfig } from "./apps";

type OAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

const OAUTH_CREDENTIALS: Record<string, () => OAuthCredentials | null> = {
  notion: () =>
    env.INTEGRATION_NOTION_CLIENT_ID && env.INTEGRATION_NOTION_CLIENT_SECRET
      ? {
          clientId: env.INTEGRATION_NOTION_CLIENT_ID,
          clientSecret: env.INTEGRATION_NOTION_CLIENT_SECRET,
        }
      : null,
  slack: () =>
    env.INTEGRATION_SLACK_CLIENT_ID && env.INTEGRATION_SLACK_CLIENT_SECRET
      ? {
          clientId: env.INTEGRATION_SLACK_CLIENT_ID,
          clientSecret: env.INTEGRATION_SLACK_CLIENT_SECRET,
        }
      : null,
  figma: () =>
    env.INTEGRATION_FIGMA_CLIENT_ID && env.INTEGRATION_FIGMA_CLIENT_SECRET
      ? {
          clientId: env.INTEGRATION_FIGMA_CLIENT_ID,
          clientSecret: env.INTEGRATION_FIGMA_CLIENT_SECRET,
        }
      : null,
};

export function getOAuthCredentials(provider: string): OAuthCredentials | null {
  const getter = OAUTH_CREDENTIALS[provider];
  return getter ? getter() : null;
}

export function getOAuthConfig(provider: string): OAuthConnectionConfig | null {
  const app = getBuiltinAppByProvider(provider);
  if (!app || app.connection.type !== "oauth") return null;
  return app.connection;
}

export function buildAuthorizationUrl(
  provider: string,
  redirectUri: string,
  state: string,
): string | null {
  const config = getOAuthConfig(provider);
  const credentials = getOAuthCredentials(provider);

  if (!config || !credentials) return null;

  const url = new URL(config.authorizationUrl);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", config.responseType ?? "code");

  if (config.scopes && config.scopes.length > 0) {
    url.searchParams.set("scope", config.scopes.join(" "));
  }

  if (config.additionalAuthParams) {
    for (const [key, value] of Object.entries(config.additionalAuthParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: unknown;
};

export async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string,
): Promise<TokenResponse | null> {
  const config = getOAuthConfig(provider);
  const credentials = getOAuthCredentials(provider);

  if (!config || !credentials) return null;

  const isNotionOrBasicAuth = provider === "notion";

  const headers: Record<string, string> = {
    "Content-Type": isNotionOrBasicAuth
      ? "application/json"
      : "application/x-www-form-urlencoded",
  };

  if (isNotionOrBasicAuth) {
    const basicAuth = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
  }

  let body: string;
  if (isNotionOrBasicAuth) {
    body = JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
  } else {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });
    body = params.toString();
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OAuth token exchange failed for ${provider}:`, errorText);
    return null;
  }

  return response.json();
}

export type ProviderMetadataExtractor = (tokenResponse: TokenResponse) => {
  externalId?: string;
  externalName?: string;
  metadata?: Record<string, unknown>;
};

const METADATA_EXTRACTORS: Record<string, ProviderMetadataExtractor> = {
  notion: (response) => ({
    externalId: response.workspace_id as string | undefined,
    externalName: response.workspace_name as string | undefined,
    metadata: {
      botId: response.bot_id,
      owner: response.owner,
      workspaceIcon: response.workspace_icon,
    },
  }),
  slack: (response) => {
    const team = response.team as { id?: string; name?: string } | undefined;
    return {
      externalId: team?.id,
      externalName: team?.name,
      metadata: {
        appId: response.app_id,
        authedUser: response.authed_user,
      },
    };
  },
  figma: (response) => ({
    externalId: response.user_id as string | undefined,
    externalName: undefined,
    metadata: {},
  }),
};

export function extractProviderMetadata(
  provider: string,
  tokenResponse: TokenResponse,
): ReturnType<ProviderMetadataExtractor> {
  const extractor = METADATA_EXTRACTORS[provider];
  if (extractor) {
    return extractor(tokenResponse);
  }
  return { metadata: {} };
}
