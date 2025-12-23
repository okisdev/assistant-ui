import type { inferReactQueryProcedureOptions } from "@trpc/react-query";
import { createCallerFactory, createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { chatRouter } from "./routers/chat";
import { shareRouter } from "./routers/share";
import { projectRouter } from "./routers/project";
import { memoryRouter } from "./routers/memory";
import { attachmentRouter } from "./routers/attachment";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  chat: chatRouter,
  share: shareRouter,
  project: projectRouter,
  memory: memoryRouter,
  attachment: attachmentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
