import { mkdir } from "node:fs/promises";
await mkdir("tests/screenshots", { recursive: true });
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/invalid.example.test/**", (route) => route.abort());
await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173/");
await page.waitForSelector(".app-card");
assert.equal(await page.locator(".app-card").count(), 16);
await page.locator(".app-card").last().scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({
  path: "tests/screenshots/desktop-preview.png",
  fullPage: false,
});
await page.getByRole("textbox", { name: "Search apps" }).fill("ReMember");
assert.equal(await page.locator(".app-card").count(), 1);
await page.getByRole("button", { name: "Clear search" }).click();
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
await page.getByRole("button", { name: "Add a new app", exact: true }).click();
await page.getByRole("textbox", { name: "App name" }).fill("Test New App");
await page
  .getByRole("textbox", { name: "Description", exact: true })
  .fill("An app created in the complete browser workflow.");
await page
  .getByRole("textbox", { name: "App URL" })
  .fill("https://example.com");
await page
  .getByRole("button", { name: "Project management", exact: true })
  .click();
await page
  .getByRole("textbox", { name: "Project notes" })
  .fill("Private project note");
await page
  .getByRole("textbox", { name: "Repository / GitHub URL" })
  .fill("https://github.com/example/test");
await page.getByRole("button", { name: "Save app", exact: true }).click();
await page.waitForSelector("dialog", { state: "detached" });
assert.equal(await page.locator(".app-card").count(), 17);
await page.reload();
await page.waitForSelector(".app-card");
await page.getByRole("textbox", { name: "Search apps" }).fill("Test New App");
assert.equal(await page.locator(".art-icon").count(), 1);
await page
  .getByRole("button", { name: "View Test New App", exact: true })
  .click();
assert.equal(
  await page.getByText("Private project note", { exact: true }).count(),
  0,
);
await page.getByRole("button", { name: "Close dialog" }).click();
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
await page.getByRole("button", { name: "Edit app", exact: true }).click();
await page.getByRole("button", { name: "Artwork", exact: true }).click();
await page
  .getByRole("textbox", { name: "Or paste an image URL" })
  .fill("https://invalid.example.test/image.jpg");
await page.getByRole("button", { name: "Save app", exact: true }).click();
await page.waitForSelector("dialog", { state: "detached" });
await page.locator(".app-card").scrollIntoViewIfNeeded();
await page.waitForSelector(".app-card .art-icon");
await page
  .getByRole("button", { name: "Save Test New App", exact: true })
  .click();
await page.getByRole("button", { name: "Saved 1", exact: true }).click();
assert.equal(await page.locator(".app-card").count(), 1);
await page.getByRole("button", { name: "Discover", exact: true }).click();
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
await page.getByRole("button", { name: "Edit app", exact: true }).click();
await page.getByRole("button", { name: "Remove", exact: true }).click();
await page.getByRole("button", { name: "Remove app", exact: true }).click();
await page.waitForSelector("dialog", { state: "detached" });
await page.getByRole("button", { name: "Clear search" }).click();
assert.equal(await page.locator(".app-card").count(), 16);
await page.getByRole("button", { name: "Exit admin", exact: true }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "tests/screenshots/mobile-preview.png",
  fullPage: false,
});
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.getByRole("button", { name: "List view", exact: true }).click();
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
await page.getByRole("button", { name: "Add a new app", exact: true }).click();
await page.screenshot({
  path: "tests/screenshots/admin-mobile-preview.png",
  fullPage: false,
});
await page.getByRole("button", { name: "Cancel", exact: true }).click();
assert.deepEqual(errors, []);
console.log(
  "PASS: 16 migrated cards; search; create; private metadata; persistence; missing/broken images; saved apps; edit; delete; mobile layouts; dialog; no runtime errors.",
);
await browser.close();
