"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type {
  Locale,
  ProviderDocumentSummary,
  ProviderProfileSummary,
  ProviderServiceProfileSummary,
  ProviderTaxStatus,
  ServiceCategorySlug,
  ServiceCategorySummary,
} from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

interface ProviderOnboardingProps {
  readonly locale: Locale;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onSignOut: () => void;
}

export function ProviderOnboarding({
  locale,
  userId,
  onClose,
  onSignOut,
}: ProviderOnboardingProps) {
  const [profile, setProfile] = useState<ProviderProfileSummary | null>(null);
  const [serviceProfiles, setServiceProfiles] = useState<
    ReadonlyArray<ProviderServiceProfileSummary>
  >([]);
  const [categories, setCategories] = useState<ReadonlyArray<ServiceCategorySummary>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const headers = useMemo(() => ({ "x-tezhelp-user-id": userId }), [userId]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const client = createBrowserApiClient();
      const [providerProfile, profiles, serviceCategories] = await Promise.all([
        client.get<ProviderProfileSummary>("/backend/v1/provider/profile", { headers }),
        client.get<ReadonlyArray<ProviderServiceProfileSummary>>(
          `/backend/v1/provider/service-profiles?locale=${locale}`,
          { headers },
        ),
        client.get<ReadonlyArray<ServiceCategorySummary>>(
          `/backend/v1/service-categories?locale=${locale}`,
        ),
      ]);
      setProfile(providerProfile);
      setServiceProfiles(profiles);
      setCategories(serviceCategories);
      setSelectedProfileId((current) => current ?? profiles[0]?.id ?? null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [headers, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedProfile = serviceProfiles.find((item) => item.id === selectedProfileId) ?? null;
  const selectedCategory =
    categories.find((item) => item.slug === selectedProfile?.categorySlug) ?? null;
  const availableCategories = categories.filter(
    (category) =>
      !serviceProfiles.some((profileItem) => profileItem.categorySlug === category.slug),
  );

  return (
    <section className="provider-onboarding" aria-labelledby="provider-onboarding-title">
      <header className="provider-onboarding-header">
        <div>
          <span>{translate(locale, "providerModeration.generalProfile")}</span>
          <h1 id="provider-onboarding-title">{translate(locale, "providerOnboarding.title")}</h1>
        </div>
        <button
          aria-label={translate(locale, "maps.closePanel")}
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>

      {status === "loading" ? (
        <p className="provider-onboarding-message" role="status">
          {translate(locale, "providerOnboarding.loading")}
        </p>
      ) : null}
      {status === "error" ? (
        <div className="provider-onboarding-message" role="alert">
          <p>{translate(locale, "providerOnboarding.loadError")}</p>
          <Button onClick={() => void load()} variant="secondary">
            {translate(locale, "monitoring.retry")}
          </Button>
        </div>
      ) : null}

      {status === "ready" && profile ? (
        <div className="provider-onboarding-layout">
          <div className="provider-onboarding-primary">
            <ProviderGeneralProfileForm
              headers={headers}
              locale={locale}
              onSaved={(nextProfile) => {
                setProfile(nextProfile);
                setNotice(translate(locale, "providerOnboarding.profileSaved"));
              }}
              profile={profile}
            />
            <GeneralDocuments
              documents={profile.generalDocuments ?? []}
              headers={headers}
              locale={locale}
              onUploaded={() => void load()}
            />
          </div>

          <div className="provider-onboarding-services">
            <ServiceProfileSelector
              availableCategories={availableCategories}
              headers={headers}
              locale={locale}
              onCreated={(created) => {
                setServiceProfiles((current) => [...current, created]);
                setSelectedProfileId(created.id);
              }}
              onSelect={setSelectedProfileId}
              selectedProfileId={selectedProfileId}
              serviceProfiles={serviceProfiles}
            />
            {selectedProfile && selectedCategory ? (
              <ServiceProfileEditor
                category={selectedCategory}
                headers={headers}
                locale={locale}
                onChanged={(nextProfile) => {
                  setServiceProfiles((current) =>
                    current.map((item) => (item.id === nextProfile.id ? nextProfile : item)),
                  );
                }}
                profile={selectedProfile}
                providerProfile={profile}
              />
            ) : (
              <p className="provider-onboarding-message">
                {translate(locale, "providerOnboarding.chooseCategory")}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="provider-onboarding-notice" role="status">
          {notice}
        </p>
      ) : null}
      <button className="provider-signout-link" onClick={onSignOut} type="button">
        {translate(locale, "identity.signOut")}
      </button>
    </section>
  );
}

function ProviderGeneralProfileForm({
  profile,
  locale,
  headers,
  onSaved,
}: {
  readonly profile: ProviderProfileSummary;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onSaved: (profile: ProviderProfileSummary) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [iin, setIin] = useState(profile.iin ?? "");
  const [city, setCity] = useState(profile.city ?? "Almaty");
  const [taxStatus, setTaxStatus] = useState<ProviderTaxStatus | "">(profile.taxStatus ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    try {
      const nextProfile = await createBrowserApiClient().patch<
        ProviderProfileSummary,
        {
          readonly displayName: string;
          readonly iin: string;
          readonly city: string;
          readonly taxStatus: ProviderTaxStatus;
        }
      >(
        "/backend/v1/provider/profile",
        {
          displayName,
          iin,
          city,
          taxStatus: taxStatus as ProviderTaxStatus,
        },
        { headers },
      );
      onSaved(nextProfile);
    } finally {
      setIsSaving(false);
    }
  }

  const isComplete =
    displayName.trim().length >= 2 &&
    /^\d{12}$/.test(iin) &&
    city.trim().length >= 2 &&
    taxStatus !== "";

  return (
    <form
      className="provider-profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="provider-section-heading">
        <h2>{translate(locale, "providerModeration.generalProfile")}</h2>
        <span>{isComplete ? "1/1" : "0/1"}</span>
      </div>
      <label className="field-label">
        {translate(locale, "providerOnboarding.displayName")}
        <input
          className="app-input"
          onChange={(event) => setDisplayName(event.target.value)}
          value={displayName}
        />
      </label>
      <div className="provider-form-grid">
        <label className="field-label">
          {translate(locale, "providerOnboarding.iin")}
          <input
            autoComplete="off"
            className="app-input"
            inputMode="numeric"
            maxLength={12}
            onChange={(event) => setIin(event.target.value.replace(/\D/g, ""))}
            value={iin}
          />
        </label>
        <label className="field-label">
          {translate(locale, "providerOnboarding.city")}
          <input
            className="app-input"
            onChange={(event) => setCity(event.target.value)}
            value={city}
          />
        </label>
      </div>
      <label className="field-label">
        {translate(locale, "providerOnboarding.taxStatus")}
        <select
          className="app-input"
          onChange={(event) => setTaxStatus(event.target.value as ProviderTaxStatus | "")}
          value={taxStatus}
        >
          <option value="">{translate(locale, "providerOnboarding.chooseTaxStatus")}</option>
          <option value="individual_entrepreneur">
            {translate(locale, "providerOnboarding.taxIp")}
          </option>
          <option value="self_employed_special_tax">
            {translate(locale, "providerOnboarding.taxSelfEmployed")}
          </option>
        </select>
      </label>
      <Button disabled={!isComplete || isSaving} type="submit">
        {translate(
          locale,
          isSaving ? "providerOnboarding.savingProfile" : "providerOnboarding.saveProfile",
        )}
      </Button>
    </form>
  );
}

function GeneralDocuments({
  documents,
  locale,
  headers,
  onUploaded,
}: {
  readonly documents: ReadonlyArray<ProviderDocumentSummary>;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onUploaded: () => void;
}) {
  return (
    <section className="provider-general-documents">
      <div className="provider-section-heading">
        <h2>{translate(locale, "providerOnboarding.identityDocuments")}</h2>
        <span>{countPresent(["face_photo", "identity_document"], documents)}/2</span>
      </div>
      <DocumentUploadRow
        accept="image/jpeg,image/png,image/webp"
        documentType="face_photo"
        existing={documents.find((document) => document.documentType === "face_photo")}
        headers={headers}
        label={translate(locale, "providerOnboarding.facePhoto")}
        locale={locale}
        onUploaded={onUploaded}
      />
      <DocumentUploadRow
        accept="application/pdf,image/jpeg,image/png,image/webp"
        documentType="identity_document"
        existing={documents.find((document) => document.documentType === "identity_document")}
        headers={headers}
        label={translate(locale, "providerOnboarding.identityDocument")}
        locale={locale}
        onUploaded={onUploaded}
      />
    </section>
  );
}

function ServiceProfileSelector({
  serviceProfiles,
  selectedProfileId,
  availableCategories,
  locale,
  headers,
  onSelect,
  onCreated,
}: {
  readonly serviceProfiles: ReadonlyArray<ProviderServiceProfileSummary>;
  readonly selectedProfileId: string | null;
  readonly availableCategories: ReadonlyArray<ServiceCategorySummary>;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onSelect: (id: string) => void;
  readonly onCreated: (profile: ProviderServiceProfileSummary) => void;
}) {
  const [categorySlug, setCategorySlug] = useState<ServiceCategorySlug | "">("");
  const [isCreating, setIsCreating] = useState(false);

  async function createProfile() {
    setIsCreating(true);
    try {
      const created = await createBrowserApiClient().post<
        ProviderServiceProfileSummary,
        { readonly categorySlug: ServiceCategorySlug }
      >(
        "/backend/v1/provider/service-profiles",
        { categorySlug: categorySlug as ServiceCategorySlug },
        { headers },
      );
      onCreated(created);
      setCategorySlug("");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="provider-service-selector">
      <div className="provider-section-heading">
        <h2>{translate(locale, "providerModeration.categorySelection")}</h2>
        <span>{serviceProfiles.length}</span>
      </div>
      {serviceProfiles.length > 0 ? (
        <div className="provider-service-tabs" role="tablist">
          {serviceProfiles.map((profile) => (
            <button
              aria-selected={profile.id === selectedProfileId}
              className="provider-service-tab"
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              role="tab"
              type="button"
            >
              <strong>{profile.categoryName}</strong>
              <span data-status={profile.moderationStatus}>
                {translateModerationStatus(locale, profile.moderationStatus)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {availableCategories.length > 0 ? (
        <div className="provider-add-category">
          <select
            aria-label={translate(locale, "providerOnboarding.addCategory")}
            className="app-input"
            onChange={(event) => setCategorySlug(event.target.value as ServiceCategorySlug | "")}
            value={categorySlug}
          >
            <option value="">{translate(locale, "providerOnboarding.chooseCategory")}</option>
            {availableCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <Button
            disabled={categorySlug === "" || isCreating}
            onClick={() => void createProfile()}
            variant="secondary"
          >
            {translate(locale, "providerOnboarding.addCategory")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ServiceProfileEditor({
  profile,
  category,
  providerProfile,
  locale,
  headers,
  onChanged,
}: {
  readonly profile: ProviderServiceProfileSummary;
  readonly category: ServiceCategorySummary;
  readonly providerProfile: ProviderProfileSummary;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onChanged: (profile: ProviderServiceProfileSummary) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const requiredRules = category.requiredDocuments.filter((rule) => rule.required);
  const missingRules = requiredRules.filter(
    (rule) => !profile.documents.some((document) => document.documentType === rule.documentType),
  );
  const generalDocuments = providerProfile.generalDocuments ?? [];
  const generalComplete =
    Boolean(providerProfile.displayName) &&
    Boolean(providerProfile.iin) &&
    Boolean(providerProfile.city) &&
    Boolean(providerProfile.taxStatus) &&
    ["face_photo", "identity_document"].every((type) =>
      generalDocuments.some((document) => document.documentType === type),
    );
  const isSubmittable = ["draft", "rejected"].includes(profile.moderationStatus);
  const canSubmit = isSubmittable && missingRules.length === 0 && generalComplete;

  async function submit() {
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const submitted = await createBrowserApiClient().post<
        ProviderServiceProfileSummary,
        Record<string, never>
      >(`/backend/v1/provider/service-profiles/${profile.id}/submit`, {}, { headers });
      onChanged(submitted);
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="provider-service-editor" role="tabpanel">
      <div className="provider-service-editor-header">
        <div>
          <span>{translate(locale, "providerModeration.perCategoryStatus")}</span>
          <h2>{profile.categoryName}</h2>
        </div>
        <strong data-status={profile.moderationStatus}>
          {translateModerationStatus(locale, profile.moderationStatus)}
        </strong>
      </div>
      <p>{category.description}</p>
      {profile.decisionReason ? (
        <p className="provider-rejection-reason">
          <strong>{translate(locale, "providerModeration.rejectionReason")}</strong>
          {profile.decisionReason}
        </p>
      ) : null}
      <div className="provider-document-list">
        {requiredRules.map((rule) => (
          <DocumentUploadRow
            accept={rule.allowedMimeTypes.join(",")}
            documentType={rule.documentType}
            existing={profile.documents.find(
              (document) => document.documentType === rule.documentType,
            )}
            headers={headers}
            key={rule.id}
            label={rule.label}
            locale={locale}
            onUploaded={(document) =>
              onChanged({
                ...profile,
                documentVersion: document.documentVersion,
                documents: [
                  document,
                  ...profile.documents.filter(
                    (item) => item.documentType !== document.documentType,
                  ),
                ],
              })
            }
            serviceProfileId={profile.id}
          />
        ))}
      </div>
      {submitError ? (
        <p className="order-panel-status" role="alert">
          {translate(locale, "providerOnboarding.submitError")}
        </p>
      ) : null}
      {isSubmittable ? (
        <>
          <Button disabled={!canSubmit || isSubmitting} onClick={() => void submit()}>
            {translate(
              locale,
              isSubmitting
                ? "providerOnboarding.submitting"
                : profile.moderationStatus === "rejected"
                  ? "providerModeration.resubmit"
                  : "providerOnboarding.submit",
            )}
          </Button>
          {!canSubmit ? (
            <p className="provider-submit-hint">
              {translate(locale, "providerOnboarding.completeRequired")}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function DocumentUploadRow({
  label,
  documentType,
  accept,
  existing,
  serviceProfileId,
  locale,
  headers,
  onUploaded,
}: {
  readonly label: string;
  readonly documentType: string;
  readonly accept: string;
  readonly existing: ProviderDocumentSummary | undefined;
  readonly serviceProfileId?: string;
  readonly locale: Locale;
  readonly headers: Readonly<Record<string, string>>;
  readonly onUploaded: (document: ProviderDocumentSummary) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);
    setHasError(false);
    const form = new FormData();
    form.set("documentType", documentType);
    form.set("file", file);
    if (serviceProfileId) {
      form.set("serviceProfileId", serviceProfileId);
    }

    try {
      const document = await createBrowserApiClient().postForm<ProviderDocumentSummary>(
        "/backend/v1/provider/documents/upload",
        form,
        { headers },
      );
      onUploaded(document);
    } catch {
      setHasError(true);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="provider-document-row">
      <div>
        <strong>{label}</strong>
        <span>
          {existing
            ? existing.originalFilename
            : translate(locale, "providerOnboarding.documentMissing")}
        </span>
        {hasError ? (
          <span className="provider-document-error" role="alert">
            {translate(locale, "providerOnboarding.uploadError")}
          </span>
        ) : null}
      </div>
      <label className="provider-file-button">
        {translate(
          locale,
          isUploading
            ? "providerOnboarding.uploading"
            : existing
              ? "providerOnboarding.replaceDocument"
              : "providerOnboarding.uploadDocument",
        )}
        <input
          accept={accept}
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void upload(file);
            }
            event.target.value = "";
          }}
          type="file"
        />
      </label>
    </div>
  );
}

function countPresent(
  documentTypes: ReadonlyArray<string>,
  documents: ReadonlyArray<ProviderDocumentSummary>,
): number {
  return documentTypes.filter((type) =>
    documents.some((document) => document.documentType === type),
  ).length;
}

function translateModerationStatus(
  locale: Locale,
  status: ProviderServiceProfileSummary["moderationStatus"],
): string {
  return translate(locale, `providerOnboarding.status.${status}`);
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
