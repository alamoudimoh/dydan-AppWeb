import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:8443", trace: "retain-on-failure" },
  webServer: { command: "pnpm run dev", url: "http://127.0.0.1:8443", reuseExistingServer: false, timeout: 30_000 },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "mobile-390", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: "mobile-360", use: { browserName: "chromium", viewport: { width: 360, height: 800 }, isMobile: true } },
  ],
});
