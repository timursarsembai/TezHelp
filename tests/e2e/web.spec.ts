import { expect, test } from "@playwright/test";

test("web mobile shell renders localized identity entry points", async ({ page }) => {
  test.setTimeout(15_000);
  const response = await page.goto("/?locale=ru", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=(self)");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

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
