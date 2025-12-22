import { Zap } from "lucide-react";

export function IntegrationsSection() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-medium text-xl tracking-tight">Integrations</h1>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-16">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
          <Zap className="size-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-medium text-sm">No integrations available</p>
          <p className="max-w-xs text-muted-foreground text-sm">
            Integrations are coming soon. Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
