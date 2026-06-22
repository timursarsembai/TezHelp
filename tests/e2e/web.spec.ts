import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("web mobile shell renders localized identity entry points", async ({ page }) => {
  test.setTimeout(15_000);
  const response = await page.goto("/?locale=ru", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=(self)");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

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

  await expect(page.getByRole("heading", { name: "TezHelp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Помощь на дороге рядом" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Рабочее место исполнителя" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Вход и профиль" })).toBeVisible();
  await expect(page.getByLabel("Телефон")).toBeVisible();
  await expect(page.getByLabel("Код из SMS")).toBeVisible();
  await expect(page.locator("body")).toContainText("Чат заказа");
  await expect(page.locator("body")).toContainText("Переписка хранится для разбора споров");
  await expect(page.locator("body")).toContainText("Живое отслеживание");
  await expect(page.locator("body")).toContainText("Метка исполнителя");
  await expect(page.locator("body")).toContainText("Отзыв после завершения заказа");
  await expect(page.locator("body")).toContainText("Надежность клиента");
  await expect(page.locator("body")).toContainText("Публичная надежность исполнителя");
});

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
