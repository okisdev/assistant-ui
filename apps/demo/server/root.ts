import type { inferReactQueryProcedureOptions } from "@trpc/react-query";
import { createCallerFactory, createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
