import { AccountInfo } from "@/components/dashboard/account/account-info";
import { ConnectedAccounts } from "@/components/dashboard/account/connected-accounts";
import { SessionList } from "@/components/dashboard/account/session-list";

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-10">
        <AccountInfo />
        <ConnectedAccounts />
        <SessionList />
      </div>
    </div>
  );
}
