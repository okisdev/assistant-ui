"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  FolderOpen,
  FileCode,
  Paperclip,
  Brain,
  FileText,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/contexts/search-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/utils/trpc/client";
import type { FC } from "react";

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4 p-2">
      {Array.from({ length: 3 }, (_, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 2 }, (_, itemIndex) => (
            <div
              key={itemIndex}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5"
            >
              <Skeleton className="size-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-16 shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function getFileName(pathname: string): string {
  return pathname.split("/").pop() || pathname;
}

export function SearchCommand() {
  const router = useRouter();
  const { isOpen, setOpen } = useSearch();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const {
    data: searchData,
    isLoading: isSearching,
    isFetching: isFetchingSearch,
  } = api.search.search.useQuery(
    { query: debouncedQuery, limit: 5 },
    {
      enabled: debouncedQuery.length > 0,
      staleTime: 1000 * 60,
    },
  );

  const { data: recentData, isLoading: isLoadingRecent } =
    api.search.recent.useQuery(
      { limit: 3 },
      {
        enabled: isOpen && debouncedQuery.length === 0,
        staleTime: 1000 * 60 * 5,
      },
    );

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const isSearchMode = debouncedQuery.length > 0;
  const data = isSearchMode ? searchData : recentData;
  const showLoading = isSearchMode
    ? isSearching || isFetchingSearch
    : isLoadingRecent;

  const messages = isSearchMode && searchData ? searchData.messages : [];

  const hasResults =
    data &&
    (data.chats.length > 0 ||
      data.projects.length > 0 ||
      data.artifacts.length > 0 ||
      data.attachments.length > 0 ||
      data.memories.length > 0 ||
      messages.length > 0);

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setOpen}
      title="Search"
      description="Search across chats, projects, artifacts, and more"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search everything..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="h-[400px] max-h-[400px]">
        {showLoading && <SearchResultsSkeleton />}

        {isSearchMode && !showLoading && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!showLoading && hasResults && (
          <>
            {data.chats.length > 0 && (
              <CommandGroup heading={isSearchMode ? "Chats" : "Recent Chats"}>
                {data.chats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(`/chat/${chat.remoteId ?? chat.id}`),
                      )
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {messages.length > 0 && (
              <CommandGroup heading="Messages">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(
                          `/chat/${message.chatRemoteId ?? message.chatId}`,
                        ),
                      )
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {data.projects.length > 0 && (
              <CommandGroup
                heading={isSearchMode ? "Projects" : "Recent Projects"}
              >
                {data.projects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onSelect={() =>
                      handleSelect(() => router.push(`/project/${project.id}`))
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {data.artifacts.length > 0 && (
              <CommandGroup
                heading={isSearchMode ? "Artifacts" : "Recent Artifacts"}
              >
                {data.artifacts.map((artifact) => (
                  <ArtifactItem
                    key={artifact.id}
                    artifact={artifact}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(`/library?tab=artifacts&id=${artifact.id}`),
                      )
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {data.attachments.length > 0 && (
              <CommandGroup
                heading={isSearchMode ? "Attachments" : "Recent Attachments"}
              >
                {data.attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push("/library?tab=attachments"),
                      )
                    }
                  />
                ))}
              </CommandGroup>
            )}

            {data.memories.length > 0 && (
              <CommandGroup
                heading={isSearchMode ? "Memories" : "Recent Memories"}
              >
                {data.memories.map((memory) => (
                  <MemoryItem
                    key={memory.id}
                    memory={memory}
                    onSelect={() =>
                      handleSelect(() => router.push("/data/memories"))
                    }
                  />
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {!showLoading && !hasResults && !isSearchMode && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No recent items
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

const ChatItem: FC<{
  chat: {
    id: string;
    remoteId: string | null;
    title: string | null;
    updatedAt: Date;
  };
  onSelect: () => void;
}> = ({ chat, onSelect }) => (
  <CommandItem value={`chat-${chat.id}`} onSelect={onSelect}>
    <MessageSquare className="text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{chat.title || "New Chat"}</span>
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
    </span>
  </CommandItem>
);

const MessageItem: FC<{
  message: {
    id: string;
    chatId: string;
    chatRemoteId: string | null;
    chatTitle: string | null;
    role: string | null;
    preview: string;
    createdAt: Date;
  };
  onSelect: () => void;
}> = ({ message, onSelect }) => (
  <CommandItem value={`message-${message.id}`} onSelect={onSelect}>
    <FileText className="text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-muted-foreground text-xs">
        {message.chatTitle || "New Chat"} ·{" "}
        {message.role === "user" ? "You" : "Assistant"}
      </span>
      <span className="line-clamp-1 text-sm">{message.preview}</span>
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
    </span>
  </CommandItem>
);

const ProjectItem: FC<{
  project: { id: string; name: string; color: string | null; updatedAt: Date };
  onSelect: () => void;
}> = ({ project, onSelect }) => (
  <CommandItem value={`project-${project.id}`} onSelect={onSelect}>
    <FolderOpen
      className="text-muted-foreground"
      style={project.color ? { color: project.color } : undefined}
    />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{project.name}</span>
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
    </span>
  </CommandItem>
);

const ArtifactItem: FC<{
  artifact: {
    id: string;
    title: string;
    chatTitle: string | null;
    updatedAt: Date;
  };
  onSelect: () => void;
}> = ({ artifact, onSelect }) => (
  <CommandItem value={`artifact-${artifact.id}`} onSelect={onSelect}>
    <FileCode className="text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate">{artifact.title}</span>
      {artifact.chatTitle && (
        <span className="truncate text-muted-foreground text-xs">
          {artifact.chatTitle}
        </span>
      )}
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true })}
    </span>
  </CommandItem>
);

const AttachmentItem: FC<{
  attachment: {
    id: string;
    pathname: string;
    chatTitle: string | null;
    createdAt: Date;
  };
  onSelect: () => void;
}> = ({ attachment, onSelect }) => (
  <CommandItem value={`attachment-${attachment.id}`} onSelect={onSelect}>
    <Paperclip className="text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate">{getFileName(attachment.pathname)}</span>
      {attachment.chatTitle && (
        <span className="truncate text-muted-foreground text-xs">
          {attachment.chatTitle}
        </span>
      )}
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
    </span>
  </CommandItem>
);

const MemoryItem: FC<{
  memory: {
    id: string;
    content: string;
    category: string | null;
    createdAt: Date;
  };
  onSelect: () => void;
}> = ({ memory, onSelect }) => (
  <CommandItem value={`memory-${memory.id}`} onSelect={onSelect}>
    <Brain className="text-muted-foreground" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="line-clamp-1 text-sm">{memory.content}</span>
      {memory.category && (
        <span className="truncate text-muted-foreground text-xs">
          {memory.category}
        </span>
      )}
    </div>
    <span className="shrink-0 text-muted-foreground text-xs">
      {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
    </span>
  </CommandItem>
);
