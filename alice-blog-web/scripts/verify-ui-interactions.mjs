/**
 * Manual browser verification for the logged-in interaction flows.
 *
 * Usage (PowerShell or Git Bash):
 *   $env:BASE_URL="http://127.0.0.1:3001"
 *   $env:ADMIN_EMAIL="admin@zpero.local"
 *   $env:ADMIN_PASSWORD="..."
 *   node scripts/verify-ui-interactions.mjs
 *
 * This script writes comments, likes, favorites and a subscription to the
 * configured database. Clean those test rows afterwards.
 */
import puppeteer from "puppeteer-core";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const executablePath =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (error) => console.error("PAGE ERROR:", error.message));

async function waitForText(text, timeout = 20000) {
  await page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    { timeout },
    text,
  );
}

async function waitForEnabledButton(text) {
  await page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll("button")].some(
        (item) => item.textContent?.includes(expected) && !item.disabled,
      ),
    { timeout: 20000 },
    text,
  );
}

async function clickButtonWithText(text) {
  await waitForEnabledButton(text);
  const clicked = await page.evaluate((expected) => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent?.includes(expected) && !item.disabled,
    );
    if (!button) return false;
    button.click();
    return true;
  }, text);
  if (!clicked) throw new Error(`button not found: ${text}`);
}

async function waitForPressedButton(text) {
  await page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll("button")].some(
        (item) =>
          item.getAttribute("aria-pressed") === "true" &&
          item.textContent?.includes(expected) &&
          !item.disabled,
      ),
    { timeout: 20000 },
    text,
  );
}

try {
  console.log("1. login");
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#login-email");
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await page.click('form button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/account");
  await waitForText("管理员");
  console.log("   login ok");

  console.log("2. article interactions");
  await page.goto(`${baseUrl}/posts/building-zpero-site`, { waitUntil: "domcontentloaded" });
  await waitForEnabledButton("赞");
  await clickButtonWithText("赞");
  await waitForPressedButton("赞");
  await clickButtonWithText("收藏");
  await waitForPressedButton("收藏");
  await waitForEnabledButton("订阅本站");
  await clickButtonWithText("订阅本站");
  await waitForText("已订阅本站");
  console.log("   like/favorite/subscribe ok");

  console.log("3. comments");
  await page.type('textarea[aria-label="发表评论"]', "UI integration comment");
  await clickButtonWithText("发表评论");
  await waitForText("UI integration comment");
  await clickButtonWithText("回复");
  await page.waitForSelector('textarea[aria-label^="回复"]');
  await page.type('textarea[aria-label^="回复"]', "UI integration reply");
  await clickButtonWithText("发送回复");
  await waitForText("UI integration reply");
  console.log("   comment/reply ok");

  console.log("4. favorites page");
  await page.goto(`${baseUrl}/favorites`, { waitUntil: "domcontentloaded" });
  await waitForText("我的收藏");
  await waitForText("从零构建一个有边界的个人博客");
  console.log("   favorites ok");

  console.log("5. notifications page");
  await page.goto(`${baseUrl}/notifications`, { waitUntil: "domcontentloaded" });
  await waitForText("站内通知");
  console.log("   notifications ok");

  console.log("6. admin dashboard");
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  await waitForText("数据概览");
  await waitForText("已发布文章");
  console.log("   dashboard ok");

  console.log("7. admin comments");
  await page.goto(`${baseUrl}/admin/comments`, { waitUntil: "domcontentloaded" });
  await waitForText("评论管理");
  await waitForText("UI integration comment");
  const hidden = await page.evaluate(() => {
    const row = [...document.querySelectorAll("tr")].find((item) =>
      item.textContent?.includes("UI integration comment"),
    );
    if (!row) return false;
    const button = [...row.querySelectorAll("button")].find((item) =>
      item.textContent?.includes("隐藏"),
    );
    if (!button) return false;
    button.click();
    return true;
  });
  if (!hidden) throw new Error("hide button not found for UI test comment");
  await waitForText("已隐藏");
  console.log("   comment hide ok");

  console.log("ALL UI CHECKS PASSED");
} finally {
  await browser.close();
}
