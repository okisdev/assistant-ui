import { database } from "@/lib/database";
import { userApplication, account } from "@/lib/database/schema";
import {
  getBuiltinAppById,
  type AppConnectionType,
} from "@/lib/integrations/apps";
import { ensureValidScopeToken } from "@/lib/integrations/token-refresh";
import { eq, and } from "drizzle-orm";

export type ConnectedApp = {
  id: string;
  slug: string;
  name: string;
  connectionType: AppConnectionType;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
};

export async function getConnectedApps(
  userId: string,
): Promise<ConnectedApp[]> {
  const userApps = await database
    .select()
    .from(userApplication)
    .where(
      and(
        eq(userApplication.userId, userId),
        eq(userApplication.enabled, true),
      ),
    );

  const connectedApps: ConnectedApp[] = [];

  for (const userApp of userApps) {
    const appDef = getBuiltinAppById(userApp.applicationId);
    if (!appDef) continue;

    if (appDef.connection.type === "scope") {
      const providerAccount = await database
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, userId),
            eq(account.providerId, appDef.connection.provider),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (providerAccount?.accessToken) {
        const validToken = await ensureValidScopeToken(
          providerAccount.id,
          appDef.connection.provider,
          providerAccount.accessToken,
          providerAccount.refreshToken,
          providerAccount.accessTokenExpiresAt,
        );

        connectedApps.push({
          id: appDef.id,
          slug: appDef.slug,
          name: appDef.name,
          connectionType: "scope",
          accessToken: validToken,
          refreshToken: providerAccount.refreshToken,
          tokenExpiresAt: providerAccount.accessTokenExpiresAt,
        });
      }
    } else if (appDef.connection.type === "oauth") {
      if (userApp.accessToken) {
        connectedApps.push({
          id: appDef.id,
          slug: appDef.slug,
          name: appDef.name,
          connectionType: "oauth",
          accessToken: userApp.accessToken,
          refreshToken: userApp.refreshToken,
          tokenExpiresAt: userApp.tokenExpiresAt,
        });
      }
    } else if (appDef.connection.type === "none") {
      connectedApps.push({
        id: appDef.id,
        slug: appDef.slug,
        name: appDef.name,
        connectionType: "none",
        accessToken: "",
        refreshToken: null,
        tokenExpiresAt: null,
      });
    }
  }

  return connectedApps;
}
