"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type {
  IdentityUserSummary,
  Locale,
  ProviderDocumentSummary,
  ProviderModerationDetail,
  ProviderModerationQueueItem,
  ProviderModerationStatus,
  ProviderServiceProfileSummary,
  ServiceCategorySlug,
  ServiceCategorySummary,
  SignedDocumentUrlResponse,
} from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

export function AdminModerationWorkspace({
  admin,
  locale,
  onSignOut,
}: {
  readonly admin: IdentityUserSummary;
  readonly locale: Locale;
  readonly onSignOut: () => void;
}) {
  const [queue, setQueue] = useState<ReadonlyArray<ProviderModerationQueueItem>>([]);
  const [categories, setCategories] = useState<ReadonlyArray<ServiceCategorySummary>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProviderModerationDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProviderModerationStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategorySlug | "">("");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const headers = useMemo(() => ({ "x-tezhelp-admin-user-id": admin.id }), [admin.id]);

  const loadQueue = useCallback(async () => {
    setLoadStatus("loading");
    const query = new URLSearchParams({ locale });
    if (statusFilter) {
      query.set("status", statusFilter);
    }
    if (categoryFilter) {
      query.set("categorySlug", categoryFilter);
    }

    try {
      const client = createApiClient();
      const [items, serviceCategories] = await Promise.all([
        client.get<ReadonlyArray<ProviderModerationQueueItem>>(
          `/backend/v1/admin/provider-moderation/queue?${query.toString()}`,
          { headers },
        ),
        client.get<ReadonlyArray<ServiceCategorySummary>>(
          `/backend/v1/service-categories?locale=${locale}`,
        ),
      ]);
      setQueue(items);
      setCategories(serviceCategories);
      setLoadStatus("ready");
    } catch {
      setLoadStatus("error");
    }
  }, [categoryFilter, headers, locale, statusFilter]);

  const loadDetail = useCallback(
    async (serviceProfileId: string) => {
      setSelectedId(serviceProfileId);
      setDetailStatus("loading");
      try {
        const result = await createApiClient().get<ProviderModerationDetail>(
          `/backend/v1/admin/provider-moderation/service-profiles/${serviceProfileId}?locale=${locale}`,
          { headers },
        );
        setDetail(result);
        setDetailStatus("ready");
      } catch {
        setDetail(null);
        setDetailStatus("error");
      }
    },
    [headers, locale],
  );

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return (
    <div className="admin-workspace">
      <a className="tz-skip-link" href="#main-content">
        {translate(locale, "common.skipToContent")}
      </a>
      <header className="admin-topbar" role="banner">
        <div className="admin-brand">
          <span aria-hidden="true">T</span>
          <strong>{translate(locale, "admin.title")}</strong>
        </div>
        <div className="admin-session">
          <span>{translate(locale, "admin.developmentAccess")}</span>
          <button onClick={onSignOut} type="button">
            {translate(locale, "identity.signOut")}
          </button>
        </div>
      </header>

      <aside className="admin-sidebar" aria-label={translate(locale, "admin.title")}>
        <strong>{translate(locale, "admin.moderation.queue")}</strong>
        <span>{queue.length}</span>
      </aside>

      <main className="admin-main" id="main-content" tabIndex={-1}>
        <section className="moderation-queue" aria-labelledby="moderation-queue-title">
          <div className="moderation-heading">
            <div>
              <span>{translate(locale, "admin.moderation.queue")}</span>
              <h1 id="moderation-queue-title">{translate(locale, "admin.moderation.title")}</h1>
            </div>
            <strong>{queue.filter((item) => item.overdue).length}</strong>
          </div>

          <div className="moderation-filters">
            <label>
              {translate(locale, "admin.moderation.statusFilter")}
              <select
                onChange={(event) =>
                  setStatusFilter(event.target.value as ProviderModerationStatus | "")
                }
                value={statusFilter}
              >
                <option value="">{translate(locale, "admin.moderation.activeQueue")}</option>
                {moderationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {translateModerationStatus(locale, status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {translate(locale, "admin.moderation.categoryFilter")}
              <select
                onChange={(event) =>
                  setCategoryFilter(event.target.value as ServiceCategorySlug | "")
                }
                value={categoryFilter}
              >
                <option value="">{translate(locale, "admin.moderation.allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadStatus === "loading" ? (
            <p className="moderation-message" role="status">
              {translate(locale, "admin.moderation.loading")}
            </p>
          ) : null}
          {loadStatus === "error" ? (
            <div className="moderation-message" role="alert">
              <p>{translate(locale, "admin.moderation.loadError")}</p>
              <Button onClick={() => void loadQueue()} variant="secondary">
                {translate(locale, "monitoring.retry")}
              </Button>
            </div>
          ) : null}
          {loadStatus === "ready" && queue.length === 0 ? (
            <p className="moderation-message">{translate(locale, "admin.moderation.empty")}</p>
          ) : null}

          <div className="moderation-queue-list">
            {queue.map((item) => (
              <button
                aria-current={item.serviceProfile.id === selectedId ? "true" : undefined}
                className="moderation-queue-item"
                key={item.serviceProfile.id}
                onClick={() => void loadDetail(item.serviceProfile.id)}
                type="button"
              >
                <div>
                  <strong>{item.serviceProfile.categoryName}</strong>
                  <span>{item.provider.displayName ?? item.provider.userId.slice(0, 8)}</span>
                </div>
                <div>
                  <span data-status={item.serviceProfile.moderationStatus}>
                    {translateModerationStatus(locale, item.serviceProfile.moderationStatus)}
                  </span>
                  {item.overdue ? (
                    <span className="moderation-overdue">
                      {translate(locale, "admin.moderation.overdue")}
                    </span>
                  ) : null}
                </div>
                <time>{formatAdminDate(locale, item.serviceProfile.slaDeadlineAt)}</time>
              </button>
            ))}
          </div>
        </section>

        <section className="moderation-detail">
          {detailStatus === "idle" ? (
            <p className="moderation-detail-placeholder">
              {translate(locale, "admin.moderation.selectSubmission")}
            </p>
          ) : null}
          {detailStatus === "loading" ? (
            <p className="moderation-detail-placeholder" role="status">
              {translate(locale, "admin.moderation.loadingDetail")}
            </p>
          ) : null}
          {detailStatus === "error" ? (
            <p className="moderation-detail-placeholder" role="alert">
              {translate(locale, "admin.moderation.detailError")}
            </p>
          ) : null}
          {detailStatus === "ready" && detail ? (
            <ModerationDetailPanel
              category={categories.find(
                (category) => category.slug === detail.serviceProfile.categorySlug,
              )}
              detail={detail}
              headers={headers}
              locale={locale}
              onChanged={async (profile) => {
                setDetail((current) =>
                  current ? { ...current, serviceProfile: profile } : current,
                );
                await loadQueue();
                await loadDetail(profile.id);
              }}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ModerationDetailPanel({
  category,
  detail,
  locale,
  headers,
  onChanged,
}: {
  readonly category: ServiceCategorySummary | undefined;
  readonly detail: ProviderModerationDetail;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onChanged: (profile: ProviderServiceProfileSummary) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [actionStatus, setActionStatus] = useState<
    "idle" | "review" | "approve" | "reject" | "suspend"
  >("idle");
  const [error, setError] = useState(false);
  const profile = detail.serviceProfile;
  const generalDocuments = detail.provider.generalDocuments ?? [];

  async function runAction(action: "review" | "approve" | "reject" | "suspend") {
    setActionStatus(action);
    setError(false);
    try {
      const result = await createApiClient().post<
        ProviderServiceProfileSummary,
        { readonly reason?: string }
      >(
        `/backend/v1/admin/provider-moderation/service-profiles/${profile.id}/${action}`,
        action === "review" ? {} : { reason },
        { headers },
      );
      setReason("");
      await onChanged(result);
    } catch {
      setError(true);
    } finally {
      setActionStatus("idle");
    }
  }

  return (
    <article>
      <header className="moderation-detail-header">
        <div>
          <span>{translate(locale, "admin.moderation.review")}</span>
          <h2>{profile.categoryName}</h2>
          <p>{detail.provider.displayName ?? detail.provider.userId}</p>
        </div>
        <strong data-status={profile.moderationStatus}>
          {translateModerationStatus(locale, profile.moderationStatus)}
        </strong>
      </header>

      <dl className="moderation-facts">
        <div>
          <dt>{translate(locale, "admin.moderation.iin")}</dt>
          <dd>{detail.provider.iin ?? "—"}</dd>
        </div>
        <div>
          <dt>{translate(locale, "admin.moderation.city")}</dt>
          <dd>{detail.provider.city ?? "—"}</dd>
        </div>
        <div>
          <dt>{translate(locale, "admin.moderation.taxStatus")}</dt>
          <dd>{formatTaxStatus(locale, detail.provider.taxStatus)}</dd>
        </div>
        <div>
          <dt>{translate(locale, "admin.moderation.documentVersion")}</dt>
          <dd>{profile.documentVersion}</dd>
        </div>
      </dl>

      <DocumentSection
        documents={generalDocuments}
        headers={headers}
        isGeneral
        locale={locale}
        title={translate(locale, "admin.moderation.generalDocuments")}
      />
      <DocumentSection
        documents={profile.documents}
        headers={headers}
        labels={new Map(category?.requiredDocuments.map((rule) => [rule.documentType, rule.label]))}
        locale={locale}
        title={translate(locale, "admin.moderation.categoryDocuments")}
      />

      <section className="moderation-history">
        <h3>{translate(locale, "admin.moderation.audit")}</h3>
        {detail.history.length === 0 ? (
          <p>{translate(locale, "admin.moderation.noHistory")}</p>
        ) : (
          <ol>
            {detail.history.map((event) => (
              <li key={event.id}>
                <strong>{translateModerationStatus(locale, event.toStatus)}</strong>
                <span>{event.reason ?? event.action}</span>
                <time>{formatAdminDate(locale, event.occurredAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      {profile.decisionReason ? (
        <p className="moderation-existing-reason">
          <strong>{translate(locale, "admin.moderation.decisionReason")}</strong>
          {profile.decisionReason}
        </p>
      ) : null}

      {["submitted", "under_review", "approved", "rejected"].includes(profile.moderationStatus) ? (
        <section className="moderation-decision">
          {profile.moderationStatus === "submitted" ? (
            <Button
              disabled={actionStatus !== "idle"}
              onClick={() => void runAction("review")}
              variant="secondary"
            >
              {translate(locale, "admin.moderation.startReview")}
            </Button>
          ) : null}
          {["submitted", "under_review"].includes(profile.moderationStatus) ? (
            <>
              <label>
                {translate(locale, "admin.moderation.decisionReason")}
                <textarea
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={translate(locale, "admin.moderation.reasonPlaceholder")}
                  value={reason}
                />
              </label>
              <div>
                <Button
                  disabled={reason.trim().length < 3 || actionStatus !== "idle"}
                  onClick={() => void runAction("approve")}
                >
                  {translate(locale, "admin.moderation.approve")}
                </Button>
                <Button
                  disabled={reason.trim().length < 3 || actionStatus !== "idle"}
                  onClick={() => void runAction("reject")}
                  variant="danger"
                >
                  {translate(locale, "admin.moderation.reject")}
                </Button>
              </div>
            </>
          ) : null}
          {["approved", "rejected"].includes(profile.moderationStatus) ? (
            <>
              <label>
                {translate(locale, "admin.moderation.decisionReason")}
                <textarea
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={translate(locale, "admin.moderation.reasonPlaceholder")}
                  value={reason}
                />
              </label>
              <Button
                disabled={reason.trim().length < 3 || actionStatus !== "idle"}
                onClick={() => void runAction("suspend")}
                variant="danger"
              >
                {translate(locale, "admin.moderation.suspend")}
              </Button>
            </>
          ) : null}
          {error ? (
            <p className="moderation-action-error" role="alert">
              {translate(locale, "admin.moderation.actionError")}
            </p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}

function DocumentSection({
  title,
  documents,
  locale,
  headers,
  isGeneral = false,
  labels = new Map(),
}: {
  readonly title: string;
  readonly documents: ReadonlyArray<ProviderDocumentSummary>;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly isGeneral?: boolean;
  readonly labels?: ReadonlyMap<string, string>;
}) {
  return (
    <section className="moderation-documents">
      <h3>{title}</h3>
      {documents.length === 0 ? (
        <p>{translate(locale, "admin.moderation.noDocuments")}</p>
      ) : (
        <div>
          {documents.map((document) => (
            <DocumentReviewButton
              document={document}
              headers={headers}
              key={document.id}
              label={
                isGeneral
                  ? translateGeneralDocumentType(locale, document.documentType)
                  : (labels.get(document.documentType) ??
                    document.documentType.replaceAll("_", " "))
              }
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DocumentReviewButton({
  document,
  label,
  locale,
  headers,
}: {
  readonly document: ProviderDocumentSummary;
  readonly label: string;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
}) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState(false);

  async function openDocument() {
    setIsOpening(true);
    setError(false);
    try {
      const signed = await createApiClient().get<SignedDocumentUrlResponse>(
        `/backend/v1/admin/provider-moderation/documents/${document.id}/access-url`,
        { headers },
      );
      window.open(signed.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(true);
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="moderation-document-row">
      <div>
        <strong>{label}</strong>
        <span>{document.originalFilename}</span>
      </div>
      <Button disabled={isOpening} onClick={() => void openDocument()} variant="secondary">
        {translate(locale, "admin.moderation.openDocument")}
      </Button>
      {error ? (
        <span role="alert">{translate(locale, "admin.moderation.documentError")}</span>
      ) : null}
    </div>
  );
}

const moderationStatuses: ReadonlyArray<ProviderModerationStatus> = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];

function translateModerationStatus(locale: Locale, status: ProviderModerationStatus): string {
  const keys = {
    draft: "providerOnboarding.status.draft",
    submitted: "providerOnboarding.status.submitted",
    under_review: "providerOnboarding.status.under_review",
    approved: "providerOnboarding.status.approved",
    rejected: "providerOnboarding.status.rejected",
    suspended: "providerOnboarding.status.suspended",
  } as const;

  return translate(locale, keys[status]);
}

function formatAdminDate(locale: Locale, value: string | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Almaty",
  }).format(new Date(value));
}

function formatTaxStatus(
  locale: Locale,
  taxStatus: ProviderModerationDetail["provider"]["taxStatus"],
): string {
  if (taxStatus === "individual_entrepreneur") {
    return translate(locale, "providerOnboarding.taxIp");
  }
  if (taxStatus === "self_employed_special_tax") {
    return translate(locale, "providerOnboarding.taxSelfEmployed");
  }
  return "—";
}

function translateGeneralDocumentType(locale: Locale, documentType: string): string {
  if (documentType === "face_photo") {
    return translate(locale, "providerOnboarding.facePhoto");
  }
  if (documentType === "identity_document") {
    return translate(locale, "providerOnboarding.identityDocument");
  }
  return documentType.replaceAll("_", " ");
}

function createApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
