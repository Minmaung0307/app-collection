import { mkdir } from "node:fs/promises";
await mkdir("tests/screenshots", { recursive: true });
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export", exact: true }).click();
const download = await downloadPromise;
const backup = JSON.parse(await readFile(await download.path(), "utf8"));
assert.equal(backup.apps.length, 16);
page.on("dialog", (dialog) => dialog.accept());
const newRecord = {
  ...backup.apps[0],
  id: "imported-test",
  name: "Imported project",
  image: "",
};
await page
  .locator("input[type=file]")
  .first()
  .setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ apps: [newRecord] })),
  });
await page
  .getByRole("textbox", { name: "Search apps" })
  .fill("Imported project");
await page.getByRole("button", { name: "Edit app", exact: true }).click();
await page.getByRole("button", { name: "Artwork", exact: true }).click();
await page
  .locator("dialog input[type=file]")
  .setInputFiles("public/images/remember.jpeg");
await page
  .getByRole("button", { name: "Use generated artwork", exact: true })
  .waitFor();
assert.match(
  await page
    .getByRole("textbox", { name: "Or paste an image URL" })
    .inputValue(),
  /^data:image\/webp;base64,/,
);
await page.screenshot({ path: "tests/screenshots/admin-desktop-preview.png" });
await page.getByRole("button", { name: "Save app", exact: true }).click();
await page.waitForSelector("dialog", { state: "detached" });
await page.reload();
await page
  .getByRole("textbox", { name: "Search apps" })
  .fill("Imported project");
await page.locator(".app-card").scrollIntoViewIfNeeded();
assert.equal(await page.locator(".app-card img").count(), 1);
await page.getByRole("button", { name: "Manage apps", exact: true }).click();
await page
  .locator("input[type=file]")
  .first()
  .setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        apps: [{ ...newRecord, id: "bad", url: "javascript:alert(1)" }],
      }),
    ),
  });
await page.getByRole("alert").waitFor();
assert.match(await page.getByRole("alert").innerText(), /must start/);
await page.getByRole("button", { name: "Clear search" }).click();
assert.equal(await page.locator(".app-card").count(), 17);
await page.setViewportSize({ width: 320, height: 700 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
console.log(
  "PASS: export; validated merge import; image upload/compression and persistence; invalid import rejected atomically; 320px no horizontal overflow.",
);
await browser.close();
