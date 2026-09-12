import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const url = (process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100").replace(/\/$/, "");
const light = process.argv.includes("--light");

const projects = JSON.parse(readFileSync("data/projects.json", "utf-8"));
const firstProject = projects.projects[0];
const projectUrl = `${url}/project/${encodeURIComponent(firstProject.id)}`;
const catalogUrl = `${url}/catalog`;
const watchlistUrl = `${url}/watchlist`;
const methodologyUrl = `${url}/methodology`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
if (light) {
  await context.addInitScript(() => localStorage.setItem("pulsaross-theme", "cream"));
}
const page = await context.newPage();

let failed = false;

async function auditPage(target, label) {
  await page.goto(target, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag21a"])
    .analyze();

  console.log(`\n=== AXE: ${label} (${target}) ===`);
  console.log(`violations: ${results.violations.length}`);

  for (const v of results.violations) {
    failed = true;
    console.log(`\n[${v.impact}] ${v.id} — ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) {
      console.log(`  node: ${n.target.join(" ")}`);
      console.log(`  summary: ${n.failureSummary.split("\n")[0]}`);
    }
  }
}

async function keyboardCheck(label) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  console.log(`\n=== KEYBOARD: ${label} ===`);

  const firstTab = await page.evaluate(() => {
    const skip = document.querySelector(".skip-link");
    if (!skip) return "no skip-link found";
    const order = [];
    let el = skip;
    for (let i = 0; i < 20 && el; i++) {
      order.push(el.tagName.toLowerCase() + (el.getAttribute("href") ? `[${el.getAttribute("href")}]` : ""));
      el = el.nextElementSibling;
    }
    return order.join(" → ");
  });

  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}${el.getAttribute("href") ? `#${el.getAttribute("href")}` : ""}` : "body";
  });

  const focusOutline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "none";
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });

  console.log(`first Tab lands on: ${focused}`);
  console.log(`focus outline: ${focusOutline}`);
  console.log(`skip-link chain: ${firstTab}`);
}

await auditPage(url, "Home (Overview)");
await auditPage(catalogUrl, "Catalog Workbench");
await auditPage(watchlistUrl, "Watchlist Management");
await auditPage(projectUrl, "Project Detail Lab");
await auditPage(methodologyUrl, "Scoring Methodology & API");
await keyboardCheck("Home");

await browser.close();
if (failed) {
  console.log("\nRESULT: FAIL — axe violations found");
  process.exit(1);
}
console.log("\nRESULT: PASS — no WCAG 2.x violations across all routes");
