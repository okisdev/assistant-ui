import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/verify-2fa";
      },
    }),
  ],
});
