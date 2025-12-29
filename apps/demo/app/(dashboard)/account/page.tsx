import type { Metadata } from "next";

import { AccountInfo } from "@/components/dashboard/account/account-info";
import { SecuritySettings } from "@/components/dashboard/account/security";
import { ConnectedAccounts } from "@/components/dashboard/account/connected-accounts";
import { SessionList } from "@/components/dashboard/account/session-list";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 pt-4 pb-8 sm:gap-8 sm:py-8">
      <AccountInfo />
      <SecuritySettings />
      <ConnectedAccounts />
      <SessionList />
    </div>
  );
}
