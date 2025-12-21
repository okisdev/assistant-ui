"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User, BarChart3, Share2, Brain } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
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
    title: "Shares",
    href: "/shares",
    icon: Share2,
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
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
