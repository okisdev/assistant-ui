"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, ChevronsUpDown, User, Sun, Moon, Monitor } from "lucide-react";

import { authClient } from "@/lib/auth.client";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SidebarUserMenu() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name}
                />
                <AvatarFallback className="rounded-lg text-xs">
                  {session?.user?.name ? getInitials(session.user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user?.name}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {session?.user?.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                <User className="mr-2 size-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                {theme === "dark" ? (
                  <Moon className="mr-2 size-4" />
                ) : theme === "light" ? (
                  <Sun className="mr-2 size-4" />
                ) : (
                  <Monitor className="mr-2 size-4" />
                )}
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem
                    value="system"
                    className="cursor-pointer"
                  >
                    <Monitor className="mr-2 size-4" />
                    System
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="light"
                    className="cursor-pointer"
                  >
                    <Sun className="mr-2 size-4" />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="dark"
                    className="cursor-pointer"
                  >
                    <Moon className="mr-2 size-4" />
                    Dark
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => setShowSignOutConfirm(true)}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AlertDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleSignOut}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenu>
  );
}
