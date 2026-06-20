import { expect, test } from "@playwright/test";

test("admin shell renders auth-required foundation state", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Администрирование TezHelp" })).toBeVisible();
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Требуется вход администратора" }),
  ).toBeVisible();
});
