"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  User,
  BarChart3,
  Database,
  Brain,
  Zap,
  Bot,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    title: "General",
    href: "/general",
    icon: Settings,
  },
  {
    title: "Account",
    href: "/account",
    icon: User,
  },
  {
    title: "Data",
    href: "/data",
    icon: Database,
  },
  {
    title: "Models",
    href: "/models",
    icon: Bot,
  },
  {
    title: "Capabilities",
    href: "/capabilities",
    icon: Brain,
  },
  {
    title: "Usage",
    href: "/usage",
    icon: BarChart3,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Zap,
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4" />
      {item.title}
    </Link>
  );
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Match sub-routes like /data/storage for /data
  return pathname.startsWith(`${href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isActive={isActiveRoute(pathname, item.href)}
        />
      ))}
    </nav>
  );
}

export function DashboardNavMobile() {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isActive={isActiveRoute(pathname, item.href)}
        />
      ))}
    </nav>
  );
}
