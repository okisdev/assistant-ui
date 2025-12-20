import { createCaller, createTRPCContext } from "@/server";
import { headers } from "next/headers";
import { cache } from "react";

import "server-only";

const createContext = cache(async () => {
  const heads = new Headers(await headers());

  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const api = createCaller(createContext);
