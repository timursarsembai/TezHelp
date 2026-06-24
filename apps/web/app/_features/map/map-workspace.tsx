"use client";

import { useEffect, useRef, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type { GeoPoint } from "@tezhelp/maps";
import type {
  IdentityUserSummary,
  LiveLocationSnapshot,
  Locale,
  OfferSummary,
  OrderSummary,
  OrderStatus,
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
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [flyToPoint, setFlyToPoint] = useState<GeoPoint | null>(null);
  const [locateStatus, setLocateStatus] = useState<"idle" | "locating" | "error">("idle");
  const [categories, setCategories] = useState<ReadonlyArray<ServiceCategorySummary>>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeOrder, setActiveOrder] = useState<OrderSummary | null>(null);
  const [providerPoint, setProviderPoint] = useState<{ latitude: number; longitude: number } | null>(null);

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

  useEffect(() => {
    if (!selectedPoint) {
      setSelectedAddress(null);
      return;
    }
    const { latitude, longitude } = selectedPoint;
    const controller = new AbortController();
    void fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ru&zoom=18&addressdetails=1`,
      { signal: controller.signal, headers: { "Accept-Language": "ru" } },
    )
      .then((r) => r.json())
      .then((data: {
        name?: string;
        category?: string;
        type?: string;
        address?: {
          road?: string;
          residential?: string;
          pedestrian?: string;
          quarter?: string;
          neighbourhood?: string;
          suburb?: string;
          city_district?: string;
          house_number?: string;
          amenity?: string;
          place?: string;
        }
      }) => {
        const a = data.address;
        const rawRoad = a?.road ?? a?.residential ?? a?.pedestrian;
        // Парковки и подобные объекты "протекают" своим названием в поле road
        // (например "Parking guest"). Это не адрес улицы — отбрасываем.
        const roadIsLeakedName =
          data.type === "parking" ||
          /\b(parking|guest)\b/i.test(rawRoad ?? "");
        const street = roadIsLeakedName ? undefined : rawRoad;
        // Микрорайон лежит в quarter ("Микрорайон №3"); suburb="Микрорайоны" и
        // city_district="Ауэзовский район" слишком общие, поэтому ниже в приоритете.
        const district =
          a?.quarter ?? a?.neighbourhood ?? a?.place ?? a?.suburb ?? a?.city_district;
        const house = a?.house_number;
        const parts = (street ? [street, house] : [district, house]).filter(
          (p): p is string => Boolean(p),
        );
        setSelectedAddress(parts.length > 0 ? parts.join(", ") : null);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [selectedPoint]);

  const terminalStatuses: ReadonlyArray<OrderStatus> = [
    "completed",
    "cancelled_by_customer",
    "cancelled_by_provider",
    "cancelled_by_admin",
  ];

  useEffect(() => {
    if (!activeOrder || terminalStatuses.includes(activeOrder.status)) {
      return;
    }
    const interval = setInterval(() => {
      void createBrowserApiClient()
        .get<OrderSummary>(`/backend/v1/orders/${activeOrder.id}`, {
          headers: { "x-tezhelp-user-id": initialUser.id },
        })
        .then(setActiveOrder)
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status, initialUser.id]);

  // Live-трекинг провайдера: опрашиваем только когда он едет или прибыл
  const trackingStatuses: ReadonlyArray<OrderStatus> = [
    "provider_en_route",
    "provider_arrived",
    "in_progress",
  ];
  useEffect(() => {
    if (!activeOrder || !trackingStatuses.includes(activeOrder.status)) {
      setProviderPoint(null);
      return;
    }
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      if (cancelled || !activeOrder) return;
      try {
        const snapshot = await createBrowserApiClient().get<LiveLocationSnapshot>(
          `/backend/v1/orders/${activeOrder.id}/location`,
          { headers: { "x-tezhelp-user-id": initialUser.id } },
        );
        if (cancelled) return;
        if (snapshot.visible && snapshot.providerPoint) {
          setProviderPoint({
            latitude: snapshot.providerPoint.latitude,
            longitude: snapshot.providerPoint.longitude,
          });
        }
        timeoutId = setTimeout(() => void poll(), snapshot.pollAfterMs);
      } catch {
        if (!cancelled) {
          timeoutId = setTimeout(() => void poll(), 5000);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeOrder?.id, activeOrder?.status, initialUser.id]);

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

  function locateMe() {
    if (!navigator.geolocation) {
      setLocateStatus("error");
      return;
    }
    setLocateStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point: GeoPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setSelectedPoint(point);
        setFlyToPoint(point);
        setLocateStatus("idle");
      },
      () => setLocateStatus("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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
        <AlmatyMap
          flyToPoint={flyToPoint}
          onPointSelect={setSelectedPoint}
          providerPoint={providerPoint}
          selectedPoint={selectedPoint}
        />

        <button
          aria-label={translate(initialLocale, "maps.location")}
          className={`map-locate-button${locateStatus === "locating" ? " map-locate-button--locating" : ""}${locateStatus === "error" ? " map-locate-button--error" : ""}`}
          disabled={locateStatus === "locating"}
          onClick={locateMe}
          title={
            locateStatus === "error"
              ? translate(initialLocale, "maps.locationError")
              : translate(initialLocale, "maps.location")
          }
          type="button"
        >
          {locateStatus === "error" ? (
            <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L2 17h16L10 2z" fill="#dc3545" opacity=".15" stroke="#dc3545" strokeLinejoin="round" strokeWidth="1.5"/>
              <path d="M10 8v4M10 14.5v.5" stroke="#dc3545" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          ) : (
            <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="3" fill={locateStatus === "locating" ? "#165dff" : "none"} stroke="#165dff" strokeWidth="1.75"/>
              <line stroke="#165dff" strokeLinecap="round" strokeWidth="1.75" x1="10" x2="10" y1="1.5" y2="4.5"/>
              <line stroke="#165dff" strokeLinecap="round" strokeWidth="1.75" x1="10" x2="10" y1="15.5" y2="18.5"/>
              <line stroke="#165dff" strokeLinecap="round" strokeWidth="1.75" x1="1.5" x2="4.5" y1="10" y2="10"/>
              <line stroke="#165dff" strokeLinecap="round" strokeWidth="1.75" x1="15.5" x2="18.5" y1="10" y2="10"/>
            </svg>
          )}
        </button>

        <div className="map-floating-actions">
          <p className="map-location-hint" role="status">
            {locateStatus === "error"
              ? translate(initialLocale, "maps.locationError")
              : selectedPoint
                ? (selectedAddress ?? `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`)
                : translate(initialLocale, "maps.pickPoint")}
          </p>
          <Button onClick={() => setActivePanel("create")}>
            <span aria-hidden="true">+</span>
            {translate(initialLocale, "maps.createOrder")}
          </Button>
        </div>

        {!activeOrder ? (
          <section className="map-empty-state">
            <strong>{translate(initialLocale, "maps.noActiveOrders")}</strong>
            <span>{translate(initialLocale, "maps.pickPoint")}</span>
          </section>
        ) : null}

        {activePanel === "create" && !activeOrder ? (
          <OrderPanel
            categories={categories}
            catalogStatus={catalogStatus}
            initialLandmark={selectedAddress ?? ""}
            locale={initialLocale}
            onClose={() => setActivePanel(null)}
            onPublished={(order) => {
              setActiveOrder(order);
              setActivePanel(null);
            }}
            onPointSelect={(point, address) => {
              setSelectedPoint(point);
              setFlyToPoint(point);
              setSelectedAddress(address);
            }}
            selectedPoint={selectedPoint}
            userId={initialUser.id}
          />
        ) : null}

        {activeOrder && activeOrder.status === "receiving_offers" ? (
          <OffersPanel
            locale={initialLocale}
            order={activeOrder}
            userId={initialUser.id}
            onSelected={setActiveOrder}
            onCancelled={() => setActiveOrder(null)}
          />
        ) : null}

        {activeOrder && activeOrder.status !== "receiving_offers" ? (
          <ActiveOrderPanel
            locale={initialLocale}
            order={activeOrder}
            userId={initialUser.id}
            onDone={() => setActiveOrder(null)}
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

interface NominatimResult {
  readonly place_id: number;
  readonly display_name: string;
  readonly name?: string;
  readonly lat: string;
  readonly lon: string;
  readonly address?: {
    readonly road?: string;
    readonly residential?: string;
    readonly neighbourhood?: string;
    readonly house_number?: string;
    readonly suburb?: string;
    readonly city_district?: string;
    readonly amenity?: string;
    readonly building?: string;
  };
}

interface OrderPanelProps {
  readonly categories: ReadonlyArray<ServiceCategorySummary>;
  readonly catalogStatus: "loading" | "ready" | "error";
  readonly initialLandmark?: string;
  readonly locale: Locale;
  readonly selectedPoint: GeoPoint | null;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onPublished: (order: OrderSummary) => void;
  readonly onPointSelect?: (point: GeoPoint, address: string) => void;
}

function OrderPanel({
  categories,
  catalogStatus,
  initialLandmark = "",
  locale,
  selectedPoint,
  userId,
  onClose,
  onPublished,
  onPointSelect,
}: OrderPanelProps) {
  const [categorySlug, setCategorySlug] = useState<ServiceCategorySlug | "">("");
  const [landmark, setLandmark] = useState(initialLandmark);
  const [suggestions, setSuggestions] = useState<ReadonlyArray<NominatimResult>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Обновляем поле адреса когда пользователь двигает метку на карте
  useEffect(() => {
    if (initialLandmark) {
      setLandmark(initialLandmark);
    }
  }, [initialLandmark]);
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

  function handleLandmarkChange(value: string) {
    setLandmark(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      void fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&accept-language=ru&countrycodes=kz&limit=7&addressdetails=1&namedetails=1&viewbox=76.55%2C43.55%2C77.25%2C43.05&bounded=1`,
        { headers: { "Accept-Language": "ru" } },
      )
        .then((r) => r.json())
        .then((results: ReadonlyArray<NominatimResult>) => {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        })
        .catch(() => undefined);
    }, 400);
  }

  function getSuggestionLabel(result: NominatimResult): { primary: string; secondary: string } {
    const name = result.name ?? result.address?.amenity ?? result.address?.building;
    const street = result.address?.road ?? result.address?.residential;
    const district = result.address?.neighbourhood ?? result.address?.suburb ?? result.address?.city_district;
    const house = result.address?.house_number;

    if (name) {
      const addrParts = (street ? [street, house] : [district, house]).filter((p): p is string => Boolean(p));
      const addr = addrParts.join(", ");
      const secondary = addr && addr.toLowerCase() !== name.toLowerCase() ? addr : "";
      return { primary: name, secondary };
    }
    // Нет имени объекта — строим адрес из улицы или микрорайона
    const addrParts = (street ? [street, house] : [district, house]).filter((p): p is string => Boolean(p));
    const addr = addrParts.join(", ");
    return {
      primary: addr || (result.display_name.split(",")[0] ?? result.display_name),
      secondary: (!street && district && addr.includes(district)) ? "" : (district ?? ""),
    };
  }

  function selectSuggestion(result: NominatimResult) {
    const { primary } = getSuggestionLabel(result);
    setLandmark(primary);
    setSuggestions([]);
    setShowSuggestions(false);
    onPointSelect?.(
      { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) },
      primary,
    );
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
          ? (landmark || `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`)
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

      <div className="address-field">
        <label className="field-label" htmlFor="landmark">
          {translate(locale, "maps.orderLandmark")}
          <input
            autoComplete="off"
            className="app-input"
            id="landmark"
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onChange={(event) => handleLandmarkChange(event.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={translate(locale, "maps.orderLandmarkPlaceholder")}
            value={landmark}
          />
        </label>
        {showSuggestions ? (
          <ul className="address-suggestions" role="listbox">
            {suggestions.map((s) => {
              const { primary, secondary } = getSuggestionLabel(s);
              return (
                <li
                  aria-selected={false}
                  className="address-suggestion"
                  key={s.place_id}
                  onMouseDown={() => selectSuggestion(s)}
                  role="option"
                >
                  <span className="address-suggestion-primary">{primary}</span>
                  {secondary ? <span className="address-suggestion-secondary">{secondary}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

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

function OffersPanel({
  locale,
  order,
  userId,
  onSelected,
  onCancelled,
}: {
  readonly locale: Locale;
  readonly order: OrderSummary;
  readonly userId: string;
  readonly onSelected: (order: OrderSummary) => void;
  readonly onCancelled: () => void;
}) {
  const [offers, setOffers] = useState<ReadonlyArray<OfferSummary>>([]);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = createBrowserApiClient();
    const load = () => {
      void client
        .get<ReadonlyArray<OfferSummary>>(`/backend/v1/orders/${order.id}/offers`, {
          headers: { "x-tezhelp-user-id": userId },
        })
        .then(setOffers)
        .catch(() => undefined);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [order.id, userId]);

  async function selectOffer(offerId: string) {
    setSelectingId(offerId);
    setError(null);
    try {
      const updated = await createBrowserApiClient().post<
        OrderSummary,
        { readonly offerId: string; readonly idempotencyKey: string }
      >(
        `/backend/v1/orders/${order.id}/select-provider`,
        { offerId, idempotencyKey: `${order.id}-${offerId}` },
        { headers: { "x-tezhelp-user-id": userId } },
      );
      onSelected(updated);
    } catch {
      setError(translate(locale, "offers.selectError"));
    } finally {
      setSelectingId(null);
    }
  }

  async function cancelOrder() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    setError(null);
    try {
      await createBrowserApiClient().post(
        `/backend/v1/orders/${order.id}/cancel`,
        { reason: cancelReason, idempotencyKey: `cancel-${order.id}` },
        { headers: { "x-tezhelp-user-id": userId } },
      );
      onCancelled();
    } catch {
      setError(translate(locale, "offers.cancelError"));
      setCancelling(false);
    }
  }

  return (
    <section className="order-panel" aria-labelledby="offers-panel-title">
      <div className="order-panel-header">
        <div>
          <span>{order.addressLandmark}</span>
          <h1 id="offers-panel-title">{translate(locale, "offers.title")}</h1>
        </div>
        <button
          aria-label={translate(locale, "offers.cancelOrder")}
          className="icon-button"
          onClick={() => setShowCancel((v) => !v)}
          title={translate(locale, "offers.cancelOrder")}
          type="button"
        >
          ×
        </button>
      </div>

      {showCancel ? (
        <div className="offers-cancel-form">
          <label className="field-label" htmlFor="cancel-reason">
            {translate(locale, "offers.cancelReason")}
            <input
              className="app-input"
              id="cancel-reason"
              onChange={(e) => setCancelReason(e.target.value)}
              value={cancelReason}
            />
          </label>
          <Button
            className="w-full"
            disabled={!cancelReason.trim() || cancelling}
            onClick={() => void cancelOrder()}
            variant="secondary"
          >
            {translate(locale, "offers.confirmCancel")}
          </Button>
        </div>
      ) : null}

      {error ? <p className="order-panel-status" role="alert">{error}</p> : null}

      {offers.length === 0 ? (
        <p className="offers-empty">{translate(locale, "offers.empty")}</p>
      ) : (
        <ul className="offers-list">
          {offers.map((offer) => (
            <li className="offer-card" key={offer.id}>
              <div className="offer-meta">
                <span className="offer-price">{offer.priceKzt.toLocaleString()} ₸</span>
                <span className="offer-arrival">{offer.arrivalMinutes} {translate(locale, "offers.arrival")}</span>
              </div>
              {offer.comment ? <p className="offer-comment">{offer.comment}</p> : null}
              <Button
                className="w-full"
                disabled={selectingId !== null}
                onClick={() => void selectOffer(offer.id)}
              >
                {selectingId === offer.id
                  ? translate(locale, "offers.selecting")
                  : translate(locale, "offers.select")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ORDER_STATUS_STEPS: ReadonlyArray<OrderStatus> = [
  "provider_selected",
  "provider_en_route",
  "provider_arrived",
  "in_progress",
  "completed",
];

function ActiveOrderPanel({
  locale,
  order,
  userId,
  onDone,
}: {
  readonly locale: Locale;
  readonly order: OrderSummary;
  readonly userId: string;
  readonly onDone: () => void;
}) {
  const isCancelled =
    order.status === "cancelled_by_customer" ||
    order.status === "cancelled_by_provider" ||
    order.status === "cancelled_by_admin";
  const isTerminal = order.status === "completed" || isCancelled;

  const statusKey = `order.status.${order.status}` as
    | "order.status.provider_selected"
    | "order.status.provider_en_route"
    | "order.status.provider_arrived"
    | "order.status.in_progress"
    | "order.status.completed"
    | "order.status.cancelled_by_customer"
    | "order.status.cancelled_by_provider"
    | "order.status.cancelled_by_admin";

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status as OrderStatus);

  return (
    <section className="order-panel order-panel--active" aria-labelledby="active-order-title">
      <div className="order-panel-header">
        <div>
          <span>{order.addressLandmark}</span>
          <h1 id="active-order-title">{translate(locale, statusKey)}</h1>
        </div>
        {isTerminal ? (
          <button className="icon-button" onClick={onDone} type="button">
            ×
          </button>
        ) : null}
      </div>

      {!isCancelled ? (
        <ol className="order-steps">
          {ORDER_STATUS_STEPS.filter((s) => s !== "completed").map((step, i) => (
            <li
              className={`order-step${i < currentStep ? " order-step--done" : ""}${i === currentStep ? " order-step--active" : ""}`}
              key={step}
            >
              <span className="order-step-dot" aria-hidden="true" />
              <span>{translate(locale, `order.status.${step}` as typeof statusKey)}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {order.status === "completed" ? (
        <ReviewPanel locale={locale} orderId={order.id} userId={userId} />
      ) : null}
    </section>
  );
}

function ReviewPanel({
  locale,
  orderId,
  userId,
}: {
  readonly locale: Locale;
  readonly orderId: string;
  readonly userId: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  if (status === "submitted") {
    return (
      <div className="review-submitted">
        <span aria-hidden="true">★</span>
        <strong>{translate(locale, "review.submitted")}</strong>
      </div>
    );
  }

  async function submit() {
    if (rating === 0) return;
    setStatus("submitting");
    try {
      await createBrowserApiClient().post(
        `/backend/v1/orders/${orderId}/reviews`,
        { rating, ...(comment.trim() ? { comment: comment.trim() } : {}) },
        { headers: { "x-tezhelp-user-id": userId } },
      );
      setStatus("submitted");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="review-panel">
      <h2>{translate(locale, "review.title")}</h2>
      <p>{translate(locale, "review.prompt")}</p>
      <div className="star-rating" role="group" aria-label={translate(locale, "review.title")}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            aria-label={`${star}`}
            className={`star-rating__btn ${(hovered || rating) >= star ? "star-rating__btn--filled" : "star-rating__btn--empty"}`}
            key={star}
            onClick={() => { setRating(star); }}
            onMouseEnter={() => { setHovered(star); }}
            onMouseLeave={() => { setHovered(0); }}
            type="button"
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        onChange={(e) => { setComment(e.target.value); }}
        placeholder={translate(locale, "review.commentPlaceholder")}
        value={comment}
      />
      {status === "error" ? (
        <p style={{ color: "#dc2626", margin: 0, fontSize: "0.875rem" }}>
          {translate(locale, "review.error")}
        </p>
      ) : null}
      <div className="review-actions">
        <Button
          disabled={rating === 0 || status === "submitting"}
          onClick={() => { void submit(); }}
          variant="primary"
        >
          {status === "submitting"
            ? translate(locale, "review.submitting")
            : translate(locale, "review.submit")}
        </Button>
      </div>
    </div>
  );
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
