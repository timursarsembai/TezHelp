import { expect, test } from "@playwright/test";

test("web mobile shell renders localized customer and provider entry points", async ({ page }) => {
  await page.goto("/?locale=ru");

  await expect(page.getByRole("heading", { name: "TezHelp" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Помощь на дороге рядом" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Рабочее место исполнителя" })).toBeVisible();
});
