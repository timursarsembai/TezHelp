import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("admin reviews documents and approves a provider category", async ({ page }, testInfo) => {
  test.setTimeout(30_000);
  await mockAdminApi(page);
  await page.addInitScript(() => {
    window.open = (url?: string | URL) => {
      document.body.dataset.openedDocumentUrl = String(url ?? "");
      return null;
    };
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("geolocation=()");
  expect(headers["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");

  await page.locator('a[href="#main-content"]').focus();
  await expect(page.locator('a[href="#main-content"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.getByLabel("Телефон").fill("+77003333333");
  await page.getByRole("button", { name: "Получить код" }).click();
  await page.getByLabel("Код из SMS").fill("123456");
  await page.getByRole("button", { name: "Подтвердить и войти" }).click();

  await expect(page.getByRole("heading", { name: "Ручная модерация исполнителей" })).toBeVisible();
  await page.getByRole("button", { name: /Эвакуатор/ }).click();
  await expect(page.getByRole("heading", { name: "Эвакуатор" })).toBeVisible();
  await expect(page.locator(".moderation-detail-header p")).toHaveText("Тестовый исполнитель");

  await page.getByRole("button", { name: "Открыть" }).first().click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-opened-document-url",
    /X-Amz-Signature=synthetic/,
  );

  await page.getByLabel("Причина решения").fill("Документы проверены, требования выполнены");
  await page.getByRole("button", { name: "Одобрить" }).click();
  await expect(page.locator(".moderation-detail-header > strong")).toHaveText("Одобрен");
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-moderation.png`),
    fullPage: true,
  });
});

async function mockAdminApi(page: Page) {
  let moderationStatus: "submitted" | "approved" = "submitted";

  await page.route("**/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let payload: object;

    if (path === "/backend/v1/auth/otp/request") {
      payload = {
        data: {
          challengeId: "00000000-0000-4000-8000-000000000041",
          expiresAt: "2026-06-24T15:00:00.000Z",
          resendAvailableAt: "2026-06-24T14:50:30.000Z",
        },
        correlationId: "admin-otp-request",
      };
    } else if (path === "/backend/v1/auth/otp/verify") {
      payload = {
        data: {
          id: "00000000-0000-4000-8000-000000000042",
          status: "active",
          preferredLocale: "ru",
          selectedRole: "customer",
          verifiedPhone: "+77003333333",
          roles: ["customer"],
        },
        correlationId: "admin-otp-verify",
      };
    } else if (path === "/backend/v1/service-categories") {
      payload = {
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
            allowedTaxStatuses: ["individual_entrepreneur"],
            requiredDocuments: [],
          },
        ],
        correlationId: "admin-categories",
      };
    } else if (path === "/backend/v1/admin/provider-moderation/queue") {
      payload = {
        data: moderationStatus === "submitted" ? [createQueueItem(moderationStatus)] : [],
        correlationId: "admin-queue",
      };
    } else if (
      path ===
      "/backend/v1/admin/provider-moderation/service-profiles/00000000-0000-4000-8000-000000000043"
    ) {
      payload = {
        data: createModerationDetail(moderationStatus),
        correlationId: "admin-detail",
      };
    } else if (path.endsWith("/documents/00000000-0000-4000-8000-000000000044/access-url")) {
      payload = {
        data: {
          url: "http://localhost:9000/tezhelp-private-dev/provider-documents/face.png?X-Amz-Signature=synthetic",
          expiresAt: "2026-06-24T15:00:00.000Z",
        },
        correlationId: "admin-document-url",
      };
    } else if (path.endsWith("/approve") && method === "POST") {
      moderationStatus = "approved";
      payload = {
        data: createModerationDetail(moderationStatus).serviceProfile,
        correlationId: "admin-approve",
      };
    } else {
      payload = { data: {}, correlationId: "admin-fallback" };
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

function createQueueItem(moderationStatus: "submitted" | "approved") {
  const detail = createModerationDetail(moderationStatus);
  return {
    provider: detail.provider,
    serviceProfile: detail.serviceProfile,
    overdue: true,
  };
}

function createModerationDetail(moderationStatus: "submitted" | "approved") {
  const generalDocument = {
    id: "00000000-0000-4000-8000-000000000044",
    documentType: "face_photo",
    originalFilename: "face.png",
    contentType: "image/png",
    sizeBytes: 32,
    documentVersion: 1,
    createdAt: "2026-06-24T12:00:00.000Z",
  };
  const categoryDocument = {
    id: "00000000-0000-4000-8000-000000000045",
    documentType: "driver_license",
    originalFilename: "driver-license.pdf",
    contentType: "application/pdf",
    sizeBytes: 64,
    documentVersion: 2,
    createdAt: "2026-06-24T12:05:00.000Z",
  };
  const serviceProfile = {
    id: "00000000-0000-4000-8000-000000000043",
    providerUserId: "00000000-0000-4000-8000-000000000046",
    categorySlug: "tow_truck",
    categoryName: "Эвакуатор",
    moderationStatus,
    submittedAt: "2026-06-24T12:10:00.000Z",
    slaDeadlineAt: "2026-06-24T15:10:00.000Z",
    documentVersion: 2,
    ratingCount: 0,
    completedOrderCount: 0,
    cancellationCount: 0,
    documents: [categoryDocument],
    ...(moderationStatus === "approved"
      ? {
          decidedAt: "2026-06-24T14:00:00.000Z",
          decisionReason: "Документы проверены, требования выполнены",
        }
      : {}),
  };

  return {
    provider: {
      userId: "00000000-0000-4000-8000-000000000046",
      displayName: "Тестовый исполнитель",
      iin: "900101300001",
      city: "Алматы",
      taxStatus: "individual_entrepreneur",
      generalDocumentVersion: 1,
      generalDocuments: [generalDocument],
    },
    serviceProfile,
    history: [
      {
        id: "00000000-0000-4000-8000-000000000047",
        serviceProfileId: serviceProfile.id,
        action: "provider_service.submitted",
        fromStatus: "draft",
        toStatus: "submitted",
        documentVersion: 2,
        occurredAt: "2026-06-24T12:10:00.000Z",
      },
      ...(moderationStatus === "approved"
        ? [
            {
              id: "00000000-0000-4000-8000-000000000048",
              serviceProfileId: serviceProfile.id,
              actorUserId: "00000000-0000-4000-8000-000000000042",
              action: "provider_service.approved",
              fromStatus: "submitted",
              toStatus: "approved",
              reason: "Документы проверены, требования выполнены",
              documentVersion: 2,
              occurredAt: "2026-06-24T14:00:00.000Z",
            },
          ]
        : []),
    ],
  };
}
