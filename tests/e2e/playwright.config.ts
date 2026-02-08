import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const CI = !!process.env["CI"];

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? "github" : "html",
  timeout: 30_000,

  use: {
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "ai-sdk",
      testMatch: "ai-sdk.spec.ts",
      use: {
        baseURL: "http://localhost:3001",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "external-store",
      testMatch: "external-store.spec.ts",
      use: {
        baseURL: "http://localhost:3002",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "langgraph",
      testMatch: "langgraph*.spec.ts",
      use: {
        baseURL: "http://localhost:3003",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "data-stream",
      testMatch: "data-stream*.spec.ts",
      use: {
        baseURL: "http://localhost:3004",
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "ag-ui",
      testMatch: "ag-ui.spec.ts",
      use: {
        baseURL: "http://localhost:3005",
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: [
    {
      command: "PORT=3001 pnpm --filter with-ai-sdk-v6 dev",
      url: "http://localhost:3001",
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      cwd: path.resolve(__dirname, "../.."),
    },
    {
      command: "PORT=3002 pnpm --filter with-external-store dev",
      url: "http://localhost:3002",
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      cwd: path.resolve(__dirname, "../.."),
    },
    {
      command:
        "NEXT_PUBLIC_ASSISTANT_BASE_URL=http://localhost:3003/cloud PORT=3003 pnpm --filter with-langgraph dev",
      url: "http://localhost:3003",
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      cwd: path.resolve(__dirname, "../.."),
    },
    {
      command: "PORT=3004 pnpm --filter with-assistant-transport dev",
      url: "http://localhost:3004",
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      cwd: path.resolve(__dirname, "../.."),
    },
    {
      command: "PORT=3005 pnpm --filter with-ag-ui dev",
      url: "http://localhost:3005",
      reuseExistingServer: !CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      cwd: path.resolve(__dirname, "../.."),
    },
  ],
});
