import { defineConfig, devices } from "@playwright/test";

const webBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3200";
const adminBaseURL = process.env.PLAYWRIGHT_ADMIN_BASE_URL ?? "http://127.0.0.1:3201";

const webServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER === "true"
    ? undefined
    : [
        {
          command: "node node_modules/next/dist/bin/next dev --port 3200",
          cwd: "apps/web",
          url: "http://127.0.0.1:3200",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: "node node_modules/next/dist/bin/next dev --port 3201",
          cwd: "apps/admin",
          url: "http://127.0.0.1:3201",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: webBaseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-web",
      testMatch: /web\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-web",
      testMatch: /web\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: adminBaseURL },
    },
    {
      name: "mobile-admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: adminBaseURL },
    },
  ],
  webServer,
});
