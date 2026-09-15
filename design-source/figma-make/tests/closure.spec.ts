import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
}

async function axe(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => v.impact === "serious" || v.impact === "critical");
  expect(serious, serious.map(v => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
}

test("desktop flows, keyboard dialogs, and critical axe states", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only flow");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /good morning/i })).toBeVisible();
  await expectNoOverflow(page);
  await axe(page);

  for (const name of ["Today", "All Tasks", "Calendar", "Projects", "Routines", "Shopping", "Goals", "Settings"]) {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name }).click();
    await expectNoOverflow(page);
    await axe(page);
  }

  await page.getByRole("button", { name: "Create task" }).last().click();
  await expect(page.getByRole("dialog", { name: /new task/i })).toBeVisible();
  await axe(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Today" }).click();
  await page.getByRole("button", { name: /open task:/i }).first().press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await axe(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /open task:/i }).first()).toBeFocused();

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Goals" }).click();
  const redeem = page.getByRole("button", { name: "Redeem" }).first();
  if (await redeem.count()) { await redeem.click(); await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape"); }

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("dialog", { name: /edit profile/i })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("mobile navigation, RTL, and no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "mobile-only flow");
  await page.goto("/");
  await expect(page.locator(".mobile-nav")).toBeVisible();
  for (const name of ["Today", "Lists", "Goals", "More", "Home"]) {
    await page.getByRole("button", { name }).last().click();
    await expectNoOverflow(page);
  }
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByRole("dialog", { name: /new task/i })).toBeVisible();
  await expectNoOverflow(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "More" }).last().click();
  await page.getByText("Right-to-left layout").locator("xpath=../..").getByRole("button", { name: "Toggle setting" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expectNoOverflow(page);
});

test("mobile RTL matrix covers screens, dialogs, task detail, and auth", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "mobile-only RTL coverage");
  await page.goto("/");
  const mobileNav = async (name: string) => page.getByRole("button", { name }).last().click();
  const desktopOnlyNav = async (name: string) => {
    const navigated = await page.locator(".sidebar").evaluate((sidebar, label) => {
      const button = Array.from(sidebar.querySelectorAll("button")).find(candidate => candidate.textContent?.trim() === label);
      button?.click();
      return Boolean(button);
    }, name);
    expect(navigated).toBeTruthy();
  };

  for (const name of ["Home", "Today", "Lists", "Goals", "More"]) {
    await mobileNav(name);
    await expectNoOverflow(page);
  }

  await page.getByText("Right-to-left layout").locator("xpath=../..").getByRole("button", { name: "Toggle setting" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await axe(page);

  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByRole("dialog", { name: /new task/i })).toBeVisible();
  await expectNoOverflow(page);
  await axe(page);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Search" }).click();
  await page.locator("input").first().fill("school");
  await page.getByRole("button", { name: /open task:/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoOverflow(page);
  await axe(page);
  await page.keyboard.press("Escape");

  await desktopOnlyNav("Calendar");
  await page.getByRole("button", { name: "Next month" }).click();
  await expectNoOverflow(page);
  await axe(page);
  for (const name of ["Projects", "Routines", "Shopping"]) {
    await desktopOnlyNav(name);
    await expectNoOverflow(page);
    await axe(page);
  }

  await mobileNav("More");
  await page.locator("button.btn-danger").filter({ hasText: "Sign out" }).click();
  await expect(page.getByRole("alertdialog", { name: /sign out/i })).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expectNoOverflow(page);
  await axe(page);
});

test("auth, MFA, and onboarding have no serious or critical axe violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only recovery flow");
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Try it" }).click();
  await expect(page.getByRole("heading", { name: /sign back in/i })).toBeVisible();
  await axe(page);
  await page.locator("#sign-in-password").fill("demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /two-factor verification/i })).toBeVisible();
  await axe(page);
  await page.locator("#mfa-code").fill("123456");
  await page.getByRole("button", { name: /verify and sign in/i }).click();
  await expect(page.getByRole("heading", { name: /good morning/i })).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await expect(page.getByRole("heading", { name: /welcome to dydan/i })).toBeVisible();
  await axe(page);
});

test("sovereign theme has no serious or critical axe violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only theme coverage");
  await page.goto("/");
  const nav = async (name: string) => page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name }).click();
  await nav("Settings");
  await page.getByRole("button", { name: "Sovereign", exact: true }).last().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sovereign");

  for (const name of ["Home", "Today", "All Tasks", "Calendar", "Projects", "Routines", "Shopping", "Goals", "Settings"]) {
    await nav(name);
    await expectNoOverflow(page);
    await axe(page);
  }
});

test("persona, recovery, shopping mutation, and desktop RTL matrices", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only coverage matrix");
  await page.goto("/");
  const nav = async (name: string) => page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name }).click();

  // Solo → pending invitation → active household.
  await page.getByRole("button", { name: "solo", exact: true }).press("Space");
  await expect(page.getByText("House streak")).toHaveCount(0);
  await nav("Settings");
  await expect(page.getByText("Currently solo")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: /invite someone/i }).click();
  await page.locator("#invite-email").fill("alex@example.com");
  await page.getByRole("button", { name: /send invitation/i }).click();
  await page.waitForTimeout(1_000);
  await expect(page.getByText("Invitation pending")).toBeVisible();
  await expect(page.getByText("Currently solo")).toBeVisible();
  await axe(page);
  await page.getByRole("button", { name: "Demo: Accept" }).click();
  await expect(page.getByText("Household members")).toBeVisible();
  await axe(page);

  // Parent/admin household capabilities.
  await page.getByRole("button", { name: "parent", exact: true }).press("Space");
  await expect(page.getByText("Household members")).toBeVisible();
  await nav("Shopping");
  await expect(page.getByText(/Personal and shared household lists/i)).toBeVisible();

  // Shopping keyboard mutation lifecycle.
  const itemInput = page.getByRole("textbox", { name: "Add shopping item" });
  await itemInput.fill("Browser test oats");
  await itemInput.press("Enter");
  await expect(page.getByText("Browser test oats", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark Browser test oats complete" }).press("Space");
  await expect(page.getByRole("button", { name: "Mark Browser test oats incomplete" })).toBeVisible();
  await page.getByRole("button", { name: "Mark Browser test oats incomplete" }).press("Space");
  await page.getByRole("button", { name: "Edit Browser test oats" }).press("Enter");
  await page.locator("input.input").filter({ hasNot: page.locator("[type=checkbox]") }).last().fill("Browser test oats updated");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Browser test oats updated")).toBeVisible();
  await page.getByRole("button", { name: "Remove Browser test oats updated" }).press("Enter");
  await expect(page.getByText("Browser test oats updated")).toHaveCount(0);
  await axe(page);

  // Child Quest and restricted Settings.
  await page.getByRole("button", { name: "child", exact: true }).press("Space");
  await expect(page.getByText(/Quest/i).first()).toBeVisible();
  await nav("Today");
  await page.getByRole("button", { name: "Mark complete" }).first().press("Space");
  await nav("Goals");
  await expect(page.getByRole("heading", { name: /goals & progress/i })).toBeVisible();
  await nav("Settings");
  await expect(page.getByText("Household members")).toHaveCount(0);
  await axe(page);

  // Recovery state transitions.
  for (const [label, heading, action] of [["Error reporting flow", "Something went wrong", "Retry"], ["Offline state", "You're offline", "Go to Home"], ["Unavailable data state", "Data unavailable", "Retry"], ["Permission denied state", "Access restricted", "Return to Home"]] as const) {
    await nav("Settings");
    await page.getByText(label).locator("xpath=../..").getByRole("button", { name: "Open" }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await axe(page);
    await page.getByRole("button", { name: action }).press("Enter");
    await expect(page.getByRole("heading", { name: /good morning|quest/i })).toBeVisible();
  }

  // RTL navigation and interaction coverage.
  await page.getByRole("button", { name: "parent", exact: true }).press("Space");
  await nav("Settings");
  await page.getByText("Right-to-left layout").locator("xpath=../..").getByRole("button", { name: "Toggle setting" }).press("Space");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  for (const name of ["Home", "Today", "All Tasks", "Calendar", "Projects", "Shopping", "Goals", "Settings"]) { await nav(name); await expectNoOverflow(page); }
  await axe(page);
});
