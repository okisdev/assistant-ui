import Link from "next/link";
import { ChevronRight } from "lucide-react";

type SettingHeaderProps = {
  title: string;
  parent?: {
    title: string;
    href: string;
  };
  action?: React.ReactNode;
};

export function SettingHeader({ title, parent, action }: SettingHeaderProps) {
  if (!parent) {
    if (action) {
      return (
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-xl tracking-tight">{title}</h1>
          {action}
        </div>
      );
    }
    return <h1 className="font-medium text-xl tracking-tight">{title}</h1>;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 text-xl">
        <Link
          href={parent.href}
          className="font-medium text-muted-foreground tracking-tight hover:text-foreground"
        >
          {parent.title}
        </Link>
        <ChevronRight className="size-5 text-muted-foreground" />
        <h1 className="font-medium tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}
