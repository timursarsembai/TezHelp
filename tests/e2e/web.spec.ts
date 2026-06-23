import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("customer signs in and opens the Almaty order flow", async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await mockCustomerApi(page);

  const response = await page.goto("/?locale=ru", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=(self)");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

  await expect(page.getByRole("heading", { name: "Войти в TezHelp" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator('a[href="#main-content"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByLabel("Телефон")).toBeVisible();
  await expectInitialResourceBudget(page);

  await page.getByLabel("Телефон").fill("+77001234567");
  await page.getByRole("button", { name: "Получить код" }).click();
  await page.getByLabel("Код из SMS").fill("123456");
  await page.getByRole("button", { name: "Подтвердить и войти" }).click();

  await expect(page.getByTestId("almaty-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Создать заказ" })).toBeVisible();
  const mapBox = await page.getByTestId("almaty-map").boundingBox();
  expect(mapBox?.width).toBeGreaterThan(300);
  expect(mapBox?.height).toBeGreaterThan(400);
  await expect(page.locator(".map-canvas canvas")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-map.png`),
    fullPage: true,
  });

  await page.getByTestId("almaty-map").click({ position: { x: 180, y: 320 } });
  await page.getByRole("button", { name: "Создать заказ" }).click();
  await page.getByLabel("Что случилось?").selectOption("tow_truck");
  await page.getByLabel("Ориентир или адрес").fill("Проспект Абая, рядом с АЗС");
  await page.getByLabel("Что нужно сделать").fill("Нужен эвакуатор для легкового автомобиля");
  await page.getByRole("button", { name: "Опубликовать заказ" }).click();

  await expect(page.getByText("Заказ опубликован")).toBeVisible();
  await expect(page.getByText("Проспект Абая, рядом с АЗС")).toBeVisible();
});

async function mockCustomerApi(page: Page) {
  await page.route("**/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const payload = mockApiPayload(path);

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

function mockApiPayload(path: string): object {
  if (path === "/backend/v1/auth/otp/request") {
    return {
      data: {
        challengeId: "00000000-0000-4000-8000-000000000001",
        expiresAt: "2026-06-24T02:00:00.000Z",
        resendAvailableAt: "2026-06-24T01:50:30.000Z",
      },
      correlationId: "e2e-request",
    };
  }

  if (path === "/backend/v1/auth/otp/verify") {
    return {
      data: {
        id: "00000000-0000-4000-8000-000000000002",
        status: "active",
        preferredLocale: "ru",
        selectedRole: "customer",
        verifiedPhone: "+77001234567",
        roles: ["customer", "provider"],
      },
      correlationId: "e2e-verify",
    };
  }

  if (path === "/backend/v1/service-categories") {
    return {
      data: [
        {
          slug: "tow_truck",
          enabled: true,
          name: "Эвакуатор",
          description: "Перевозка автомобиля",
          commercialConfig: {
            responseFeeKzt: 100,
            commissionStrategy: "percentage",
            commissionPercentageBps: 1000,
            commissionFixedKzt: 0,
            operationalMinimumKzt: 3000,
          },
          allowedTaxStatuses: [],
          requiredDocuments: [],
        },
      ],
      correlationId: "e2e-catalog",
    };
  }

  return {
    data: {
      id: "00000000-0000-4000-8000-000000000003",
      customerUserId: "00000000-0000-4000-8000-000000000002",
      categorySlug: "tow_truck",
      status: "published",
      city: "Almaty",
      latitude: 43.238949,
      longitude: 76.889709,
      addressLandmark: "Проспект Абая, рядом с АЗС",
      description: "Нужен эвакуатор для легкового автомобиля",
      offerCount: 0,
      images: [],
      createdAt: "2026-06-24T01:55:00.000Z",
      publishedAt: "2026-06-24T01:55:00.000Z",
    },
    correlationId: "e2e-order",
  };
}

async function expectInitialResourceBudget(page: Page) {
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
  expect(resources.styles).toBeLessThanOrEqual(10);
  expect(resources.scripts).toBeLessThanOrEqual(50);
  expect(resources.total).toBeLessThanOrEqual(70);
}
