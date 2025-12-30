import { useRouter } from "next/navigation";
import { useAssistantApi } from "@assistant-ui/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { BookOpen, FolderOpen, Grid3X3, Plus, Search } from "lucide-react";
import type { FC } from "react";
import Link from "next/link";
import { useSearchOptional } from "@/contexts/search-provider";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export const SidebarHeroSection: FC = () => {
  const router = useRouter();
  const api = useAssistantApi();
  const search = useSearchOptional();

  const handleNewChat = () => {
    api.threads().switchToNewThread();
    router.push("/");
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleNewChat} tooltip="New Chat">
              <Plus />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => search?.setOpen(true)}
              tooltip="Search (⌘K)"
            >
              <Search />
              <span>Search</span>
              <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Projects">
              <Link href="/projects">
                <FolderOpen />
                <span>Projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Apps">
              <Link href="/apps">
                <Grid3X3 />
                <span>Apps</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Library">
              <Link href="/library">
                <BookOpen />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
