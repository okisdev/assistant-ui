import { createTRPCRouter } from "../../trpc";
import { googleDriveRouter } from "./google-drive";
import { mcpRouter } from "./mcp";
import { applicationRouter } from "./application";

export const appsRouter = createTRPCRouter({
  mcp: mcpRouter,
  application: applicationRouter,
  googleDrive: googleDriveRouter,
});
