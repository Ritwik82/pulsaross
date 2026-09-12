import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("home page renders overview telemetry and heat grid", async ({ page }) => {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const body = await page.textContent("body");
  expect(body).toContain("Open-source Android");
  expect(body).toContain("Health Observatory");
  expect(body).toContain("System Telemetry");
  expect(body).toContain("Momentum Leaders");
  expect(body).toContain("New Apps");

  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(theme).toBe("terminal");

  expect(errors).toEqual([]);
});

test("theme picker switches theme and persists across reload", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const trigger = page.getByRole("button", { name: "Change theme" });
  await trigger.click();
  await page.getByRole("button", { name: "LIGHT", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /Cream/ }).click();

  const theme = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    meta: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
  }));
  expect(theme.theme).toBe("cream");
  expect(theme.meta).toBe("#f6eddd");

  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(persisted).toBe("cream");
});

test("catalog workbench renders and filters data", async ({ page }) => {
  await page.goto("/catalog", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const body = await page.textContent("body");
  expect(body).toContain("Catalog Workbench");
  expect(body).toContain("Specimen");

  // Test search filter input
  const searchInput = page.locator("#workbench-search");
  await expect(searchInput).toBeVisible();
  await searchInput.fill("Obtainium");
  await page.waitForTimeout(300);

  const filteredBody = await page.textContent("body");
  expect(filteredBody).toContain("Obtainium");
});

test("watchlist management hub renders properly", async ({ page }) => {
  await page.goto("/watchlist", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const body = await page.textContent("body");
  expect(body).toContain("Watchlist Management");
  expect(body).toContain("Apps you rely on");
});

test("project detail lab renders 3-column diagnostic dossier", async ({ page }) => {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), "data", "projects.json"), "utf-8")
  );
  const p = data.projects[0];
  await page.goto(`/project/${p.id}`, { waitUntil: "networkidle" });

  const body = await page.textContent("body");
  expect(body).toContain(p.name);
  expect(body).toContain(p.owner);
  expect(body).toContain("Composite Health Assessment");
  expect(body).toContain("Android Platform Diagnostics");
});

test("methodology page renders 6 signals and API reference", async ({ page }) => {
  await page.goto("/methodology", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const body = await page.textContent("body");
  expect(body).toContain("How the health score is calculated");
  expect(body).toContain("Recency");
  expect(body).toContain("Momentum");
  expect(body).toContain("Issue Health");
  expect(body).toContain("Contributors");
  expect(body).toContain("License");
  expect(body).toContain("Abandonment Risk");
  expect(body).toContain("Interactive Health Simulator");
  expect(body).toContain("Developer API & Feed Reference");
  expect(body).toContain("/api/score/");
  expect(body).toContain("/api/openapi");
});

test("mobile navigation drawer search finds a project", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const data = JSON.parse(
    readFileSync(join(process.cwd(), "data", "projects.json"), "utf-8")
  );
  const p = data.projects[0];

  await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  const drawerSearch = page.getByRole("combobox", {
    name: "Search the whole catalog",
  });
  await expect(drawerSearch).toBeVisible();
  await drawerSearch.fill(p.name.slice(0, 6));
  await page.getByRole("option").first().click();
  await page.waitForURL(/\/project\//);
  await expect(page).toHaveURL(new RegExp(`/project/${p.id}`));
});

test("track from snippet adds to watchlist", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const trackBtn = page.getByRole("button", { name: /^Track / }).first();
  if (await trackBtn.count() > 0) {
    const name = (await trackBtn.getAttribute("aria-label")).replace(/^Track /, "").trim();
    await trackBtn.click();
    await page.waitForTimeout(300);
    const stopBtn = page.getByRole("button", { name: `Stop tracking ${name}` });
    await expect(stopBtn).toBeVisible();
  }
});

test("api score endpoint returns canonical score for catalog projects", async ({ request }) => {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), "data", "projects.json"), "utf-8")
  );
  const p = data.projects[0];
  const res = await request.get(`/api/score/${p.owner}/${p.name}`);
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.id).toBe(p.id);
  expect(json.score).toBe(p.score);
});
