import { useRouter } from "next/navigation";
import { useAssistantApi } from "@assistant-ui/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { FolderOpen, Grid3X3, Plus } from "lucide-react";
import type { FC } from "react";
import Link from "next/link";

export const SidebarHeroSection: FC = () => {
  const router = useRouter();
  const api = useAssistantApi();

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
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
