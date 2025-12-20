import { SessionList } from "@/components/dashboard/account/session-list";

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="font-medium text-2xl tracking-tight">
            Active Sessions
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage devices where you&apos;re signed in
          </p>
        </div>

        <SessionList />
      </div>
    </div>
  );
}
