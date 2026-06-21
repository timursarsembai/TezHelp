import { expect, test } from "@playwright/test";

test("web mobile shell renders localized identity entry points", async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto("/?locale=ru", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "TezHelp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Помощь на дороге рядом" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Рабочее место исполнителя" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Вход и профиль" })).toBeVisible();
  await expect(page.getByLabel("Телефон")).toBeVisible();
  await expect(page.getByLabel("Код из SMS")).toBeVisible();
  await expect(page.locator("body")).toContainText("Чат заказа");
  await expect(page.locator("body")).toContainText("Переписка хранится для разбора споров");
});
