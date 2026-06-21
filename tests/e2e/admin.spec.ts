import { expect, test } from "@playwright/test";

test("admin shell renders auth-required foundation state", async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("body")).toContainText("Администрирование TezHelp");
  await expect(page.locator("body")).toContainText("Требуется вход администратора");
  await expect(page.locator("body")).toContainText("Чат заказа для разбора спора");
  await expect(page.locator("body")).toContainText("Отслеживание активного заказа");
  await expect(page.locator("body")).toContainText("Санкции исполнителей");
  await expect(page.locator("body")).toContainText("Апелляции по санкциям");
});
