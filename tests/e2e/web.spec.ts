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

test("provider opens a discoverable order and submits an offer", async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await mockCustomerApi(page);
  await signIn(page);

  await page.getByRole("button", { name: /Режим клиента|Исполнитель/ }).click();
  await expect(page.getByRole("heading", { name: "Доступные заказы" })).toBeVisible();
  await expect(page.getByText("Проспект Достык, 91")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-provider.png`),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Проспект Достык, 91/ }).click();

  await page.getByLabel("Ваша цена, KZT").fill("15000");
  await page.getByLabel("Прибытие, минут").fill("25");
  await page.getByLabel("Комментарий").fill("Приеду на эвакуаторе через 25 минут");
  await page.getByRole("button", { name: "Отправить отклик" }).click();

  await expect(page.getByRole("status")).toContainText("Отклик опубликован");
});

test("provider completes onboarding and submits a service profile", async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await mockCustomerApi(page);
  await signIn(page);

  await page.getByRole("button", { name: /Режим клиента|Исполнитель/ }).click();
  await page.getByRole("button", { name: "Профиль" }).first().click();
  await expect(page.getByRole("heading", { name: "Профиль исполнителя" })).toBeVisible();

  await page.getByLabel("Имя или название").fill("Тестовый исполнитель");
  await page.getByLabel("ИИН").fill("900101300001");
  await page.getByLabel("Город").fill("Алматы");
  await page.getByLabel("Налоговый статус").selectOption("individual_entrepreneur");
  await page.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(page.getByRole("status")).toContainText("Профиль сохранен");

  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles({
    name: "face.png",
    mimeType: "image/png",
    buffer: Buffer.from("synthetic-face"),
  });
  await expect(page.getByText("face.png")).toBeVisible();
  await fileInputs.nth(1).setInputFiles({
    name: "identity.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("synthetic-identity"),
  });
  await expect(page.getByText("identity.pdf")).toBeVisible();

  await page.getByLabel("Добавить категорию").selectOption("tow_truck");
  await page.getByRole("button", { name: "Добавить категорию" }).click();
  await expect(page.getByRole("heading", { name: "Эвакуатор" })).toBeVisible();
  await page
    .locator('input[type="file"]')
    .last()
    .setInputFiles({
      name: "driver-license.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("synthetic-license"),
    });
  await expect(page.getByText("driver-license.pdf")).toBeVisible();
  await page.getByRole("button", { name: "Отправить на модерацию" }).click();
  await expect(page.getByText("Отправлен", { exact: true }).first()).toBeVisible();
  await page.locator(".provider-onboarding").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-provider-onboarding.png`),
    fullPage: true,
  });
});

async function signIn(page: Page) {
  await page.goto("/?locale=ru", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Телефон").fill("+77001234567");
  await page.getByRole("button", { name: "Получить код" }).click();
  await page.getByLabel("Код из SMS").fill("123456");
  await page.getByRole("button", { name: "Подтвердить и войти" }).click();
  await expect(page.getByTestId("almaty-map")).toBeVisible();
}

async function mockCustomerApi(page: Page) {
  let providerProfile = {
    userId: "00000000-0000-4000-8000-000000000002",
    generalDocumentVersion: 0,
    generalDocuments: [] as Array<Record<string, unknown>>,
  };
  let providerServiceProfiles: Array<Record<string, unknown>> = [];
  let documentSequence = 0;

  await page.route("**/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let payload: object;

    if (path === "/backend/v1/provider/profile") {
      if (method === "PATCH") {
        providerProfile = {
          ...providerProfile,
          displayName: "Тестовый исполнитель",
          iin: "900101300001",
          city: "Алматы",
          taxStatus: "individual_entrepreneur",
        };
      }
      payload = { data: providerProfile, correlationId: "e2e-provider-profile" };
    } else if (path === "/backend/v1/provider/service-profiles" && method === "GET") {
      payload = { data: providerServiceProfiles, correlationId: "e2e-service-profiles" };
    } else if (path === "/backend/v1/provider/service-profiles" && method === "POST") {
      const created = createMockServiceProfile("draft", []);
      providerServiceProfiles = [created];
      payload = { data: created, correlationId: "e2e-service-profile-create" };
    } else if (path === "/backend/v1/provider/documents/upload") {
      documentSequence += 1;
      const documentType =
        documentSequence === 1
          ? "face_photo"
          : documentSequence === 2
            ? "identity_document"
            : "driver_license";
      const document = {
        id: `00000000-0000-4000-8000-00000000002${documentSequence}`,
        documentType,
        originalFilename:
          documentType === "face_photo"
            ? "face.png"
            : documentType === "identity_document"
              ? "identity.pdf"
              : "driver-license.pdf",
        contentType: documentType === "face_photo" ? "image/png" : "application/pdf",
        sizeBytes: 32,
        documentVersion: documentSequence,
        createdAt: "2026-06-24T03:00:00.000Z",
      };
      if (documentSequence <= 2) {
        providerProfile = {
          ...providerProfile,
          generalDocumentVersion: documentSequence,
          generalDocuments: [document, ...providerProfile.generalDocuments],
        };
      } else {
        providerServiceProfiles = [createMockServiceProfile("draft", [document])];
      }
      payload = { data: document, correlationId: "e2e-document-upload" };
    } else if (path.endsWith("/submit")) {
      const submitted = createMockServiceProfile(
        "submitted",
        (providerServiceProfiles[0]?.documents as Array<Record<string, unknown>>) ?? [],
      );
      providerServiceProfiles = [submitted];
      payload = { data: submitted, correlationId: "e2e-service-profile-submit" };
    } else {
      payload = mockApiPayload(path, method);
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

function createMockServiceProfile(
  moderationStatus: "draft" | "submitted",
  documents: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    id: "00000000-0000-4000-8000-000000000012",
    providerUserId: "00000000-0000-4000-8000-000000000002",
    categorySlug: "tow_truck",
    categoryName: "Эвакуатор",
    moderationStatus,
    documentVersion: documents.length,
    ratingCount: 0,
    completedOrderCount: 0,
    cancellationCount: 0,
    documents,
    ...(moderationStatus === "submitted"
      ? {
          submittedAt: "2026-06-24T03:05:00.000Z",
          slaDeadlineAt: "2026-06-24T06:05:00.000Z",
        }
      : {}),
  };
}

function mockApiPayload(path: string, method: string): object {
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

  if (path === "/backend/v1/me/role") {
    const role = method === "PATCH" ? "provider" : "customer";
    return {
      data: {
        id: "00000000-0000-4000-8000-000000000002",
        status: "active",
        preferredLocale: "ru",
        selectedRole: role,
        verifiedPhone: "+77001234567",
        roles: ["customer", "provider"],
      },
      correlationId: "e2e-role",
    };
  }

  if (path === "/backend/v1/provider/orders") {
    return {
      data: [
        {
          order: {
            id: "00000000-0000-4000-8000-000000000010",
            customerUserId: "00000000-0000-4000-8000-000000000011",
            categorySlug: "tow_truck",
            status: "published",
            city: "Almaty",
            latitude: 43.233,
            longitude: 76.956,
            addressLandmark: "Проспект Достык, 91",
            description: "Автомобиль не заводится, нужен эвакуатор",
            offerCount: 2,
            images: [],
            createdAt: "2026-06-24T02:00:00.000Z",
            publishedAt: "2026-06-24T02:00:00.000Z",
          },
          providerServiceProfileId: "00000000-0000-4000-8000-000000000012",
          offerCount: 2,
          distanceMeters: 4200,
        },
      ],
      correlationId: "e2e-provider-feed",
    };
  }

  if (path === "/backend/v1/provider/wallet") {
    return {
      data: {
        providerUserId: "00000000-0000-4000-8000-000000000002",
        availableBalanceKzt: 5000,
        reservedBalanceKzt: 0,
        freeResponsesRemaining: 4,
      },
      correlationId: "e2e-wallet",
    };
  }

  if (path.endsWith("/offers")) {
    return {
      data: {
        id: "00000000-0000-4000-8000-000000000013",
        orderId: "00000000-0000-4000-8000-000000000010",
        providerUserId: "00000000-0000-4000-8000-000000000002",
        providerServiceProfileId: "00000000-0000-4000-8000-000000000012",
        priceKzt: 15000,
        arrivalMinutes: 25,
        comment: "Приеду на эвакуаторе через 25 минут",
        status: "active",
        responseFeeKzt: 0,
        freeResponseCreditUsed: true,
        createdAt: "2026-06-24T02:05:00.000Z",
      },
      correlationId: "e2e-offer",
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
          requiredDocuments: [
            {
              id: "00000000-0000-4000-8000-000000000030",
              categorySlug: "tow_truck",
              documentType: "driver_license",
              label: "Водительское удостоверение",
              required: true,
              allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
              maxSizeBytes: 20_971_520,
            },
          ],
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
