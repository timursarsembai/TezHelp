"use client";

import { useEffect, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type { GeoPoint } from "@tezhelp/maps";
import type {
  IdentityUserSummary,
  Locale,
  OrderSummary,
  ServiceCategorySlug,
  ServiceCategorySummary,
} from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

import { AlmatyMap } from "./almaty-map";
import { ProviderMapWorkspace } from "../provider/provider-map-workspace";

interface MapWorkspaceProps {
  readonly initialLocale: Locale;
  readonly initialUser: IdentityUserSummary;
  readonly onSessionChange: (user: IdentityUserSummary) => void;
  readonly onSignOut: () => void;
}

export function MapWorkspace({
  initialLocale,
  initialUser,
  onSessionChange,
  onSignOut,
}: MapWorkspaceProps) {
  const [activePanel, setActivePanel] = useState<"create" | "orders" | "profile" | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(null);
  const [categories, setCategories] = useState<ReadonlyArray<ServiceCategorySummary>>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [publishedOrder, setPublishedOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const client = createBrowserApiClient();
    void client
      .get<ReadonlyArray<ServiceCategorySummary>>(
        `/backend/v1/service-categories?locale=${initialLocale}`,
      )
      .then((result) => {
        setCategories(result);
        setCatalogStatus("ready");
      })
      .catch(() => setCatalogStatus("error"));
  }, [initialLocale]);

  if (initialUser.selectedRole === "provider") {
    return (
      <ProviderMapWorkspace
        locale={initialLocale}
        onSessionChange={onSessionChange}
        onSignOut={onSignOut}
        user={initialUser}
      />
    );
  }

  async function switchToProvider() {
    const nextUser = await createBrowserApiClient().patch<
      IdentityUserSummary,
      { readonly role: "provider" }
    >(
      "/backend/v1/me/role",
      { role: "provider" },
      { headers: { "x-tezhelp-user-id": initialUser.id } },
    );
    onSessionChange(nextUser);
  }

  return (
    <div className="map-app">
      <a className="tz-skip-link" href="#main-content">
        {translate(initialLocale, "common.skipToContent")}
      </a>

      <header className="map-topbar" role="banner">
        <div className="map-brand">
          <span className="map-brand-mark" aria-hidden="true">
            T
          </span>
          <strong>{translate(initialLocale, "app.brand")}</strong>
        </div>
        <button
          className="map-mode map-mode-button"
          onClick={() => void switchToProvider()}
          type="button"
        >
          <span className="map-online-dot" aria-hidden="true" />
          <span>{translate(initialLocale, "maps.customerMode")}</span>
        </button>
        <button
          aria-label={translate(initialLocale, "identity.signOut")}
          className="map-profile-button"
          onClick={onSignOut}
          title={translate(initialLocale, "identity.signOut")}
          type="button"
        >
          {initialUser.verifiedPhone?.slice(-2) ?? "TH"}
        </button>
      </header>

      <aside className="map-navigation" aria-label={translate(initialLocale, "app.brand")}>
        <NavigationButton
          active={activePanel === null || activePanel === "create"}
          icon="+"
          label={translate(initialLocale, "maps.helpNow")}
          onClick={() => setActivePanel("create")}
        />
        <NavigationButton
          active={activePanel === "orders"}
          icon="≡"
          label={translate(initialLocale, "maps.orders")}
          onClick={() => setActivePanel("orders")}
        />
        <NavigationButton
          active={activePanel === "profile"}
          icon="○"
          label={translate(initialLocale, "maps.profile")}
          onClick={() => setActivePanel("profile")}
        />
      </aside>

      <main className="map-main" id="main-content" tabIndex={-1}>
        <AlmatyMap onPointSelect={setSelectedPoint} selectedPoint={selectedPoint} />

        <div className="map-floating-actions">
          <p className="map-location-hint" role="status">
            {selectedPoint
              ? `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`
              : translate(initialLocale, "maps.pickPoint")}
          </p>
          <Button onClick={() => setActivePanel("create")}>
            <span aria-hidden="true">+</span>
            {translate(initialLocale, "maps.createOrder")}
          </Button>
        </div>

        {publishedOrder ? (
          <section className="published-order" aria-live="polite">
            <span className="published-order-status">
              {translate(initialLocale, "maps.orderPublished")}
            </span>
            <strong>{publishedOrder.addressLandmark}</strong>
            <span>#{publishedOrder.id.slice(0, 8)}</span>
          </section>
        ) : (
          <section className="map-empty-state">
            <strong>{translate(initialLocale, "maps.noActiveOrders")}</strong>
            <span>{translate(initialLocale, "maps.pickPoint")}</span>
          </section>
        )}

        {activePanel === "create" ? (
          <OrderPanel
            categories={categories}
            catalogStatus={catalogStatus}
            locale={initialLocale}
            onClose={() => setActivePanel(null)}
            onPublished={(order) => {
              setPublishedOrder(order);
              setActivePanel(null);
            }}
            selectedPoint={selectedPoint}
            userId={initialUser.id}
          />
        ) : null}
        {activePanel === "orders" ? (
          <InformationPanel
            body={translate(initialLocale, "maps.noActiveOrders")}
            locale={initialLocale}
            onClose={() => setActivePanel(null)}
            title={translate(initialLocale, "maps.orders")}
          />
        ) : null}
        {activePanel === "profile" ? (
          <InformationPanel
            body={initialUser.verifiedPhone ?? translate(initialLocale, "identity.localSession")}
            locale={initialLocale}
            onClose={() => setActivePanel(null)}
            onSignOut={onSignOut}
            title={translate(initialLocale, "maps.profile")}
          />
        ) : null}
      </main>

      <nav className="map-mobile-navigation" aria-label={translate(initialLocale, "app.brand")}>
        <NavigationButton
          active={activePanel === null || activePanel === "create"}
          icon="+"
          label={translate(initialLocale, "maps.helpNow")}
          onClick={() => setActivePanel("create")}
        />
        <NavigationButton
          active={activePanel === "orders"}
          icon="≡"
          label={translate(initialLocale, "maps.orders")}
          onClick={() => setActivePanel("orders")}
        />
        <NavigationButton
          active={activePanel === "profile"}
          icon="○"
          label={translate(initialLocale, "maps.profile")}
          onClick={() => setActivePanel("profile")}
        />
        <NavigationButton
          icon="P"
          label={translate(initialLocale, "web.nav.provider")}
          onClick={() => void switchToProvider()}
        />
      </nav>
    </div>
  );
}

function InformationPanel({
  body,
  locale,
  title,
  onClose,
  onSignOut,
}: {
  readonly body: string;
  readonly locale: Locale;
  readonly title: string;
  readonly onClose: () => void;
  readonly onSignOut?: () => void;
}) {
  return (
    <section className="order-panel" aria-labelledby="information-panel-title">
      <div className="order-panel-header">
        <div>
          <span>{translate(locale, "maps.customerMode")}</span>
          <h1 id="information-panel-title">{title}</h1>
        </div>
        <button
          aria-label={translate(locale, "maps.closePanel")}
          className="icon-button"
          onClick={onClose}
          title={translate(locale, "maps.closePanel")}
          type="button"
        >
          ×
        </button>
      </div>
      <p className="information-panel-body">{body}</p>
      {onSignOut ? (
        <Button onClick={onSignOut} variant="secondary">
          {translate(locale, "identity.signOut")}
        </Button>
      ) : null}
    </section>
  );
}

interface OrderPanelProps {
  readonly categories: ReadonlyArray<ServiceCategorySummary>;
  readonly catalogStatus: "loading" | "ready" | "error";
  readonly locale: Locale;
  readonly selectedPoint: GeoPoint | null;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onPublished: (order: OrderSummary) => void;
}

function OrderPanel({
  categories,
  catalogStatus,
  locale,
  selectedPoint,
  userId,
  onClose,
  onPublished,
}: OrderPanelProps) {
  const [categorySlug, setCategorySlug] = useState<ServiceCategorySlug | "">("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function publishOrder() {
    if (!selectedPoint) {
      setStatus(translate(locale, "maps.selectLocationFirst"));
      return;
    }
    if (!categorySlug) {
      return;
    }

    setIsPublishing(true);
    setStatus(null);
    try {
      const order = await createBrowserApiClient().post<
        OrderSummary,
        {
          readonly categorySlug: ServiceCategorySlug;
          readonly latitude: number;
          readonly longitude: number;
          readonly addressLandmark: string;
          readonly description: string;
          readonly images: [];
          readonly unlockingLawfulAccess: Readonly<Record<string, never>>;
        }
      >(
        "/backend/v1/orders",
        {
          categorySlug,
          latitude: selectedPoint.latitude,
          longitude: selectedPoint.longitude,
          addressLandmark: landmark,
          description,
          images: [],
          unlockingLawfulAccess: {},
        },
        { headers: { "x-tezhelp-user-id": userId } },
      );
      onPublished(order);
    } catch {
      setStatus(translate(locale, "maps.publishError"));
    } finally {
      setIsPublishing(false);
    }
  }

  const canPublish =
    Boolean(selectedPoint) &&
    Boolean(categorySlug) &&
    landmark.trim().length >= 3 &&
    description.trim().length >= 5;

  return (
    <section className="order-panel" aria-labelledby="order-panel-title">
      <div className="order-panel-header">
        <div>
          <span>{translate(locale, "maps.customerMode")}</span>
          <h1 id="order-panel-title">{translate(locale, "maps.createOrder")}</h1>
        </div>
        <button
          aria-label={translate(locale, "maps.closePanel")}
          className="icon-button"
          onClick={onClose}
          title={translate(locale, "maps.closePanel")}
          type="button"
        >
          ×
        </button>
      </div>

      <p className="order-location">
        <span aria-hidden="true">●</span>
        {selectedPoint
          ? `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`
          : translate(locale, "maps.selectLocationFirst")}
      </p>

      <label className="field-label" htmlFor="category">
        {translate(locale, "maps.orderCategory")}
        <select
          className="app-input"
          disabled={catalogStatus !== "ready"}
          id="category"
          onChange={(event) => setCategorySlug(event.target.value as ServiceCategorySlug | "")}
          value={categorySlug}
        >
          <option value="">
            {translate(
              locale,
              catalogStatus === "error" ? "maps.categoriesError" : "maps.chooseCategory",
            )}
          </option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label" htmlFor="landmark">
        {translate(locale, "maps.orderLandmark")}
        <input
          className="app-input"
          id="landmark"
          onChange={(event) => setLandmark(event.target.value)}
          placeholder={translate(locale, "maps.orderLandmarkPlaceholder")}
          value={landmark}
        />
      </label>

      <label className="field-label" htmlFor="description">
        {translate(locale, "maps.orderDescription")}
        <textarea
          className="app-input app-textarea"
          id="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder={translate(locale, "maps.orderDescriptionPlaceholder")}
          value={description}
        />
      </label>

      {status ? (
        <p className="order-panel-status" role="status">
          {status}
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={!canPublish || isPublishing}
        onClick={() => void publishOrder()}
      >
        {translate(locale, isPublishing ? "maps.orderPublishing" : "maps.orderPublish")}
      </Button>
    </section>
  );
}

function NavigationButton({
  active = false,
  icon,
  label,
  onClick,
}: {
  readonly active?: boolean;
  readonly icon: string;
  readonly label: string;
  readonly onClick?: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className="map-navigation-button"
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="map-navigation-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
