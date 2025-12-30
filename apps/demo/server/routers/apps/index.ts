import { createTRPCRouter } from "../../trpc";
import { googleDriveRouter } from "./google-drive";

export const appsRouter = createTRPCRouter({
  googleDrive: googleDriveRouter,
});
