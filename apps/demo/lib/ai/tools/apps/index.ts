import type { ToolSet } from "ai";
import type { ConnectedApp } from "@/lib/ai/apps-context";
import { createGoogleCalendarTools } from "./google-calendar";
import { createGoogleDriveTools } from "./google-drive";

export async function getAppTools(
  connectedApps: ConnectedApp[],
  selectedAppIds: string[],
): Promise<ToolSet> {
  const tools: ToolSet = {};

  for (const app of connectedApps) {
    const isSelected = selectedAppIds.includes(app.id);

    if (!isSelected && selectedAppIds.length > 0) {
      continue;
    }

    switch (app.slug) {
      case "google-calendar": {
        const calendarTools = createGoogleCalendarTools(app.accessToken);
        Object.assign(tools, calendarTools);
        break;
      }
      case "google-drive": {
        const driveTools = createGoogleDriveTools(app.accessToken);
        Object.assign(tools, driveTools);
        break;
      }
    }
  }

  return tools;
}
