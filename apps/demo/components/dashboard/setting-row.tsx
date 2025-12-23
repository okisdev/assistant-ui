import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type SettingRowProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
};

type SettingRowWithLinkProps = SettingRowProps & {
  href: string;
};

type SettingRowWithSwitchProps = SettingRowProps & {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function SettingRowBase({
  icon: Icon,
  title,
  description,
  badge,
  action,
  className,
}: SettingRowProps & { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            {badge && (
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

export function SettingRowLink({
  icon,
  title,
  description,
  badge,
  href,
  action,
}: SettingRowWithLinkProps) {
  return (
    <SettingRowBase
      icon={icon}
      title={title}
      description={description}
      badge={badge}
      action={
        <>
          {action}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            asChild
          >
            <Link href={href}>
              View
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </>
      }
    />
  );
}

export function SettingRowSwitch({
  icon,
  title,
  description,
  badge,
  checked,
  disabled,
  onCheckedChange,
  action,
}: SettingRowWithSwitchProps) {
  return (
    <SettingRowBase
      icon={icon}
      title={title}
      description={description}
      badge={badge}
      action={
        <>
          {action}
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </>
      }
    />
  );
}

export function SettingRowStatic({
  icon,
  title,
  description,
  badge,
  action,
}: SettingRowProps) {
  return (
    <SettingRowBase
      icon={icon}
      title={title}
      description={description}
      badge={badge}
      action={
        action ?? (
          <span className="text-muted-foreground text-sm">Coming soon</span>
        )
      }
    />
  );
}
