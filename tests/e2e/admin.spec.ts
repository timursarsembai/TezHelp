import { expect, test } from "@playwright/test";

test("admin shell renders auth-required foundation state", async ({ page }) => {
  test.setTimeout(15_000);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=()");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

  await expect(page.locator("body")).toContainText("Администрирование TezHelp");
  await expect(page.locator("body")).toContainText("Требуется вход администратора");
  await expect(page.locator("body")).toContainText("Чат заказа для разбора спора");
  await expect(page.locator("body")).toContainText("Отслеживание активного заказа");
  await expect(page.locator("body")).toContainText("Санкции исполнителей");
  await expect(page.locator("body")).toContainText("Апелляции по санкциям");
});
