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

  const results = await Promise.all(
    userApps.map(async (userApp): Promise<ConnectedApp | null> => {
      const appDef = getBuiltinAppById(userApp.applicationId);
      if (!appDef) return null;

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

        if (!providerAccount?.accessToken) return null;

        const validToken = await ensureValidScopeToken(
          providerAccount.id,
          appDef.connection.provider,
          providerAccount.accessToken,
          providerAccount.refreshToken,
          providerAccount.accessTokenExpiresAt,
        );

        return {
          id: appDef.id,
          slug: appDef.slug,
          name: appDef.name,
          connectionType: "scope",
          accessToken: validToken,
          refreshToken: providerAccount.refreshToken,
          tokenExpiresAt: providerAccount.accessTokenExpiresAt,
        };
      }

      if (appDef.connection.type === "oauth") {
        if (!userApp.accessToken) return null;
        return {
          id: appDef.id,
          slug: appDef.slug,
          name: appDef.name,
          connectionType: "oauth",
          accessToken: userApp.accessToken,
          refreshToken: userApp.refreshToken,
          tokenExpiresAt: userApp.tokenExpiresAt,
        };
      }

      if (appDef.connection.type === "none") {
        return {
          id: appDef.id,
          slug: appDef.slug,
          name: appDef.name,
          connectionType: "none",
          accessToken: "",
          refreshToken: null,
          tokenExpiresAt: null,
        };
      }

      return null;
    }),
  );

  return results.filter((app): app is ConnectedApp => app !== null);
}
