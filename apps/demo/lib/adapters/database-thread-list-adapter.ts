"use client";

import type { ThreadMessage } from "@assistant-ui/react";
import type { AssistantStream } from "assistant-stream";

export type RemoteThreadMetadata = {
  remoteId: string;
  status: "regular" | "archived";
  title?: string;
  externalId?: string;
};

export type RemoteThreadListResponse = {
  threads: RemoteThreadMetadata[];
};

export type RemoteThreadInitializeResponse = {
  remoteId: string;
  externalId?: string;
};

export type RemoteThreadListAdapter = {
  list(): Promise<RemoteThreadListResponse>;
  rename(remoteId: string, newTitle: string): Promise<void>;
  archive(remoteId: string): Promise<void>;
  unarchive(remoteId: string): Promise<void>;
  delete(remoteId: string): Promise<void>;
  initialize(threadId: string): Promise<RemoteThreadInitializeResponse>;
  generateTitle(
    remoteId: string,
    messages: readonly ThreadMessage[],
  ): Promise<AssistantStream>;
  fetch(threadId: string): Promise<RemoteThreadMetadata>;
  unstable_Provider?: React.ComponentType<{ children: React.ReactNode }>;
};
