"use client";

import { Claude } from "@/components/claude/Claude";
import { Shadcn } from "@/components/shadcn/Shadcn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";
import { AssistantRuntimeProvider, useEdgeRuntime } from "@assistant-ui/react";
import Link from "next/link";
import { useState } from "react";
import { ChatGPT } from "../../components/chatgpt/ChatGPT";
import { GenUI } from "../../components/genui/GenUI";
import { Artifacts } from "../../components/artifacts/Artifacts";
import { ModalChat } from "../../components/modal/ModalChat";

const supportedModels = [
  {
    name: "Standalone",
    component: Shadcn,
  },
  {
    name: "Modal",
    component: ModalChat,
  },
  {
    name: "Tool UI",
    component: GenUI,
  },
  {
    name: "Artifacts",
    component: Artifacts,
  },
  {
    name: "ChatGPT Theme",
    component: ChatGPT,
  },
  {
    name: "Claude Theme",
    component: Claude,
  },
];

export default function HomePage() {
  const [selectedModel, setSelectedModel] = useState(supportedModels[0]!);
  const ChatComponent = selectedModel.component;

  return (
    <main className="container mx-auto flex flex-col gap-6 self-stretch py-4">
      <div className="mt-12 flex flex-col gap-4 self-center">
        <h1 className="text-center text-4xl font-extrabold">
          Build in-app AI chatbots
          <br />
          in days, not weeks.
        </h1>
        <p className="text-foreground/85 text-center text-xl">
          assistant-ui is a chatbot UI for your React app
        </p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        <Button asChild>
          <Link href="/docs">Get Started</Link>
        </Button>
      </div>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col">
        <p className="font-bold">Examples:</p>
        <div className="mt-2 flex overflow-x-scroll">
          <div className="flex flex-grow gap-3">
            {supportedModels.map((model) => (
              <Badge
                key={model.name}
                onClick={() => setSelectedModel(model)}
                className="shrink-0 cursor-pointer px-4 py-2"
                variant={
                  selectedModel.name === model.name ? "default" : "secondary"
                }
              >
                {model.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-4 h-[650px] overflow-hidden rounded-lg border shadow">
          <MyRuntimeProvider>
            <ChatComponent />
          </MyRuntimeProvider>
        </div>
      </div>
    </main>
  );
}

export type AssistantProps = {
  chat: ReturnType<typeof useChat>;
};

const MyRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const runtime = useEdgeRuntime({ api: "/api/chat" });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
