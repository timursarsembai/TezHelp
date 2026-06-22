import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("admin shell renders auth-required foundation state", async ({ page }) => {
  test.setTimeout(15_000);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=()");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

  await expectSharedShellStyles(page);
  await page.keyboard.press("Tab");
  await expect(page.locator('a[href="#main-content"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.locator('header [role="status"]')).toBeVisible();
  await expect(page.locator("main#main-content")).toHaveCount(1);
  expect(
    await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").media),
  ).toBe("(prefers-reduced-motion: reduce)");
  await expectFoundationResourceBudget(page);

  await expect(page.locator("body")).toContainText("Администрирование TezHelp");
  await expect(page.locator("body")).toContainText("Требуется вход администратора");
  await expect(page.locator("body")).toContainText("Чат заказа для разбора спора");
  await expect(page.locator("body")).toContainText("Отслеживание активного заказа");
  await expect(page.locator("body")).toContainText("Санкции исполнителей");
  await expect(page.locator("body")).toContainText("Апелляции по санкциям");
});

async function expectSharedShellStyles(page: Page) {
  const skipLinkBox = await page.locator('a[href="#main-content"]').boundingBox();
  expect(skipLinkBox?.width).toBeLessThanOrEqual(2);
  expect(skipLinkBox?.height).toBeLessThanOrEqual(2);

  const shellStyles = await page.locator(".tz-shell").evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      minHeight: Number.parseFloat(styles.minHeight),
    };
  });

  expect(shellStyles.backgroundColor).toBe("rgb(246, 248, 252)");
  expect(shellStyles.color).toBe("rgb(21, 32, 51)");
  expect(shellStyles.minHeight).toBeGreaterThanOrEqual(page.viewportSize()?.height ?? 0);
}

async function expectFoundationResourceBudget(page: Page) {
  const resources = await page.evaluate(() =>
    performance.getEntriesByType("resource").reduce(
      (summary, entry) => {
        const resource = entry as PerformanceResourceTiming;
        summary.total += 1;
        if (resource.initiatorType === "script") {
          summary.scripts += 1;
        }
        if (resource.initiatorType === "css" || resource.initiatorType === "link") {
          summary.styles += 1;
        }
        if (["audio", "img", "image", "video"].includes(resource.initiatorType)) {
          summary.media += 1;
        }
        return summary;
      },
      { media: 0, scripts: 0, styles: 0, total: 0 },
    ),
  );

  expect(resources.media).toBe(0);
  expect(resources.styles).toBeLessThanOrEqual(8);
  expect(resources.scripts).toBeLessThanOrEqual(40);
  expect(resources.total).toBeLessThanOrEqual(60);
}
