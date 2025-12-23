import { createTRPCRouter } from "../../trpc";
import { profileRouter } from "./profile";
import { accountRouter } from "./account";
import { capabilityRouter } from "./capability";

export const userRouter = createTRPCRouter({
  profile: profileRouter,
  account: accountRouter,
  capability: capabilityRouter,
});
