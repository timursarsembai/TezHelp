"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type {
  IdentityUserSummary,
  Locale,
  OfferSummary,
  OrderStatus,
  OrderSummary,
  ProviderOrderDiscoveryItem,
  WalletSummary,
} from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

import { AlmatyMap } from "../map/almaty-map";
import { ProviderOnboarding } from "./provider-onboarding";

interface ProviderMapWorkspaceProps {
  readonly locale: Locale;
  readonly user: IdentityUserSummary;
  readonly onSessionChange: (user: IdentityUserSummary) => void;
  readonly onSignOut: () => void;
}

export function ProviderMapWorkspace({
  locale,
  user,
  onSessionChange,
  onSignOut,
}: ProviderMapWorkspaceProps) {
  const [orders, setOrders] = useState<ReadonlyArray<ProviderOrderDiscoveryItem>>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedStatus, setFeedStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeOrder, setActiveOrder] = useState<OrderSummary | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const headers = useMemo(() => ({ "x-tezhelp-user-id": user.id }), [user.id]);

  const loadProviderData = useCallback(async () => {
    const client = createBrowserApiClient();
    try {
      const [orderFeed, walletSummary] = await Promise.all([
        client.get<ReadonlyArray<ProviderOrderDiscoveryItem>>("/backend/v1/provider/orders", {
          headers,
        }),
        client.get<WalletSummary>("/backend/v1/provider/wallet", { headers }),
      ]);
      setOrders(orderFeed);
      setWallet(walletSummary);
      setFeedStatus("ready");
    } catch {
      setFeedStatus("error");
    }
  }, [headers]);

  useEffect(() => {
    void loadProviderData();
  }, [loadProviderData]);

  // Polling активного заказа провайдера каждые 4 сек
  useEffect(() => {
    const terminalStatuses: ReadonlyArray<OrderStatus> = [
      "completed", "cancelled_by_customer", "cancelled_by_provider", "cancelled_by_admin",
    ];
    if (activeOrder && terminalStatuses.includes(activeOrder.status)) return;

    const interval = setInterval(async () => {
      try {
        const order = await createBrowserApiClient().get<OrderSummary | null>(
          "/backend/v1/provider/orders/active",
          { headers },
        );
        setActiveOrder(order);
      } catch {
        // ignore
      }
    }, 4000);

    void createBrowserApiClient()
      .get<OrderSummary | null>("/backend/v1/provider/orders/active", { headers })
      .then(setActiveOrder)
      .catch(() => undefined);

    return () => clearInterval(interval);
  }, [headers, activeOrder?.status]);

  // GPS-публикация пока заказ активен
  useEffect(() => {
    const trackingStatuses: ReadonlyArray<OrderStatus> = [
      "provider_en_route", "provider_arrived", "in_progress",
    ];
    if (!activeOrder || !trackingStatuses.includes(activeOrder.status)) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (watchIdRef.current !== null) return; // уже следим

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        void createBrowserApiClient().post(
          `/backend/v1/provider/orders/${activeOrder.id}/location`,
          {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            resumed: false,
          },
          { headers },
        ).catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeOrder?.id, activeOrder?.status, headers]);

  const selectedOrder = orders.find((item) => item.order.id === selectedOrderId) ?? null;
  const orderPoints = useMemo(
    () =>
      orders.map((item) => ({
        id: item.order.id,
        point: {
          latitude: item.order.latitude,
          longitude: item.order.longitude,
        },
      })),
    [orders],
  );

  async function switchToCustomer() {
    const nextUser = await createBrowserApiClient().patch<
      IdentityUserSummary,
      { readonly role: "customer" }
    >("/backend/v1/me/role", { role: "customer" }, { headers });
    onSessionChange(nextUser);
  }

  return (
    <div className={`map-app provider-map-app${showOnboarding ? " provider-profile-open" : ""}`}>
      <a className="tz-skip-link" href="#main-content">
        {translate(locale, "common.skipToContent")}
      </a>
      <header className="map-topbar" role="banner">
        <div className="map-brand">
          <span className="map-brand-mark" aria-hidden="true">
            T
          </span>
          <strong>{translate(locale, "app.brand")}</strong>
        </div>
        <button
          className="map-mode map-mode-button"
          onClick={() => void switchToCustomer()}
          type="button"
        >
          <span className="map-online-dot" aria-hidden="true" />
          <span>{translate(locale, "maps.providerMode")}</span>
        </button>
        <button
          aria-label={translate(locale, "maps.profile")}
          className="map-profile-button"
          onClick={() => setShowOnboarding(true)}
          title={translate(locale, "maps.profile")}
          type="button"
        >
          {user.verifiedPhone?.slice(-2) ?? "TH"}
        </button>
      </header>

      <aside className="provider-feed" aria-labelledby="provider-feed-title">
        <div className="provider-feed-header">
          <div>
            <span>{translate(locale, "maps.providerMode")}</span>
            <h1 id="provider-feed-title">{translate(locale, "provider.feedTitle")}</h1>
          </div>
          <strong>{orders.length}</strong>
        </div>
        <div className="provider-wallet-strip">
          <ProviderMetric
            label={translate(locale, "provider.walletBalance")}
            value={wallet ? `${wallet.availableBalanceKzt.toLocaleString()} KZT` : "—"}
          />
          <ProviderMetric
            label={translate(locale, "provider.freeResponses")}
            value={wallet ? String(wallet.freeResponsesRemaining) : "—"}
          />
        </div>
        <div className="provider-order-list">
          {feedStatus === "error" ? (
            <p className="provider-feed-message">{translate(locale, "provider.feedUnavailable")}</p>
          ) : null}
          {feedStatus === "ready" && orders.length === 0 ? (
            <p className="provider-feed-message">{translate(locale, "provider.feedEmpty")}</p>
          ) : null}
          {orders.map((item) => (
            <button
              className="provider-order-card"
              key={item.order.id}
              onClick={() => setSelectedOrderId(item.order.id)}
              type="button"
            >
              <strong>{item.order.addressLandmark}</strong>
              <span>{item.order.description}</span>
              <span>
                {translate(locale, "provider.offerCount")}: {item.offerCount}
                {item.distanceMeters !== undefined
                  ? ` · ${translate(locale, "provider.distance")}: ${formatDistance(item.distanceMeters)}`
                  : ""}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="map-main provider-map-main" id="main-content" tabIndex={-1}>
        {showOnboarding ? (
          <ProviderOnboarding
            locale={locale}
            onClose={() => setShowOnboarding(false)}
            onSignOut={onSignOut}
            userId={user.id}
          />
        ) : (
          <>
            <AlmatyMap
              onOrderSelect={setSelectedOrderId}
              onPointSelect={() => undefined}
              orderPoints={orderPoints}
              selectedPoint={null}
            />
            {activeOrder && !["completed","cancelled_by_customer","cancelled_by_provider","cancelled_by_admin"].includes(activeOrder.status) ? (
              <ProviderActiveOrderPanel
                locale={locale}
                order={activeOrder}
                onUpdated={setActiveOrder}
                userId={user.id}
              />
            ) : selectedOrder ? (
              <ProviderOfferPanel
                item={selectedOrder}
                locale={locale}
                onClose={() => setSelectedOrderId(null)}
                onSubmitted={() => void loadProviderData()}
                userId={user.id}
              />
            ) : null}
          </>
        )}
      </main>

      <nav
        aria-label={translate(locale, "app.brand")}
        className="map-mobile-navigation provider-mobile-navigation"
      >
        <button
          className="map-navigation-button"
          onClick={() => void switchToCustomer()}
          type="button"
        >
          <span className="map-navigation-icon" aria-hidden="true">
            C
          </span>
          <span>{translate(locale, "web.nav.customer")}</span>
        </button>
        <button
          aria-current={!showOnboarding ? "page" : undefined}
          className="map-navigation-button"
          onClick={() => setShowOnboarding(false)}
          type="button"
        >
          <span className="map-navigation-icon" aria-hidden="true">
            {orders.length}
          </span>
          <span>{translate(locale, "maps.orders")}</span>
        </button>
        <button
          aria-current={showOnboarding ? "page" : undefined}
          className="map-navigation-button"
          onClick={() => setShowOnboarding(true)}
          type="button"
        >
          <span className="map-navigation-icon" aria-hidden="true">
            ○
          </span>
          <span>{translate(locale, "maps.profile")}</span>
        </button>
      </nav>
    </div>
  );
}

function ProviderActiveOrderPanel({
  locale,
  order,
  userId,
  onUpdated,
}: {
  readonly locale: Locale;
  readonly order: OrderSummary;
  readonly userId: string;
  readonly onUpdated: (order: OrderSummary) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const headers = useMemo(() => ({ "x-tezhelp-user-id": userId }), [userId]);

  async function lifecycle(endpoint: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const updated = await createBrowserApiClient().post<OrderSummary, Record<string, unknown>>(
        `/backend/v1/provider/orders/${order.id}/${endpoint}`,
        body,
        { headers },
      );
      onUpdated(updated);
    } catch {
      setError(translate(locale, "provider.actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!cancelReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await createBrowserApiClient().post<OrderSummary, { reason: string; idempotencyKey: string }>(
        `/backend/v1/provider/orders/${order.id}/cancel`,
        { reason: cancelReason, idempotencyKey: `cancel-provider-${order.id}` },
        { headers },
      );
      onUpdated(updated);
    } catch {
      setError(translate(locale, "provider.cancelError"));
      setBusy(false);
    }
  }

  const lat = order.latitude;
  const lon = order.longitude;
  const navLinks = [
    {
      label: "Яндекс",
      href: `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`,
      fallback: `https://yandex.kz/maps/?rtext=~${lat},${lon}&rtt=auto`,
    },
    {
      label: "2ГИС",
      href: `dgis://2gis.ru/routeSearch/rsType/car/to/${lon},${lat}`,
      fallback: `https://2gis.kz/almaty/routing/car/${lon},${lat}`,
    },
    {
      label: "Google",
      href: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
      fallback: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    },
  ];

  function openNav(href: string, fallback: string) {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = href;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
    setTimeout(() => {
      // Если приложение не открылось — открываем браузерную версию
      window.open(fallback, "_blank", "noopener,noreferrer");
    }, 800);
  }

  return (
    <section className="order-panel order-panel--active" aria-labelledby="provider-active-title">
      <div className="order-panel-header">
        <div>
          <span>{translate(locale, "provider.activeOrder")}</span>
          <h1 id="provider-active-title">{order.addressLandmark}</h1>
        </div>
      </div>

      <p style={{ color: "#475569", margin: "0 0 0.75rem" }}>{order.description}</p>

      <div className="nav-links">
        {navLinks.map((nav) => (
          <button
            className="nav-link-btn"
            key={nav.label}
            onClick={() => { openNav(nav.href, nav.fallback); }}
            type="button"
          >
            {nav.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
        {order.status === "provider_selected" ? (
          <Button disabled={busy} onClick={() => void lifecycle("depart")}>
            {translate(locale, "provider.depart")}
          </Button>
        ) : null}
        {order.status === "provider_en_route" ? (
          <Button disabled={busy} onClick={() => void lifecycle("arrive")}>
            {translate(locale, "provider.arrive")}
          </Button>
        ) : null}
        {order.status === "provider_arrived" ? (
          <Button disabled={busy} onClick={() => void lifecycle("start-work")}>
            {translate(locale, "provider.startWork")}
          </Button>
        ) : null}
        {order.status === "in_progress" ? (
          <Button
            disabled={busy}
            onClick={() => void lifecycle("complete", { idempotencyKey: `complete-${order.id}` })}
          >
            {translate(locale, "provider.complete")}
          </Button>
        ) : null}
        <Button
          disabled={busy}
          onClick={() => { setShowCancel((v) => !v); }}
          variant="secondary"
        >
          {translate(locale, "provider.cancelOrder")}
        </Button>
      </div>

      {showCancel ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          <label className="field-label">
            {translate(locale, "provider.cancelReason")}
            <input
              className="app-input"
              onChange={(e) => { setCancelReason(e.target.value); }}
              value={cancelReason}
            />
          </label>
          <Button
            disabled={!cancelReason.trim() || busy}
            onClick={() => void cancelOrder()}
            variant="secondary"
          >
            {translate(locale, "provider.confirmCancel")}
          </Button>
        </div>
      ) : null}

      {error ? <p className="order-panel-status" role="alert">{error}</p> : null}
    </section>
  );
}

function ProviderOfferPanel({
  item,
  locale,
  userId,
  onClose,
  onSubmitted,
}: {
  readonly item: ProviderOrderDiscoveryItem;
  readonly locale: Locale;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onSubmitted: () => void;
}) {
  const [priceKzt, setPriceKzt] = useState("");
  const [arrivalMinutes, setArrivalMinutes] = useState("30");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitOffer() {
    setIsSubmitting(true);
    setStatus(null);
    try {
      await createBrowserApiClient().post<
        OfferSummary,
        {
          readonly providerServiceProfileId: string;
          readonly priceKzt: number;
          readonly arrivalMinutes: number;
          readonly comment: string;
          readonly idempotencyKey: string;
        }
      >(
        `/backend/v1/provider/orders/${item.order.id}/offers`,
        {
          providerServiceProfileId: item.providerServiceProfileId,
          priceKzt: Number(priceKzt),
          arrivalMinutes: Number(arrivalMinutes),
          comment,
          idempotencyKey: createIdempotencyKey(),
        },
        { headers: { "x-tezhelp-user-id": userId } },
      );
      setStatus(translate(locale, "provider.offerSubmitted"));
      onSubmitted();
    } catch {
      setStatus(translate(locale, "provider.offerError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    Number.isInteger(Number(priceKzt)) &&
    Number(priceKzt) > 0 &&
    Number.isInteger(Number(arrivalMinutes)) &&
    Number(arrivalMinutes) > 0 &&
    comment.trim().length > 0;

  return (
    <section className="order-panel provider-offer-panel" aria-labelledby="provider-order-title">
      <div className="order-panel-header">
        <div>
          <span>{translate(locale, "provider.feedTitle")}</span>
          <h1 id="provider-order-title">{item.order.addressLandmark}</h1>
        </div>
        <button
          aria-label={translate(locale, "maps.closePanel")}
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      <p className="provider-order-description">{item.order.description}</p>
      <div className="provider-order-meta">
        <span>
          {translate(locale, "provider.offerCount")}: {item.offerCount}
        </span>
        {item.distanceMeters !== undefined ? (
          <span>
            {translate(locale, "provider.distance")}: {formatDistance(item.distanceMeters)}
          </span>
        ) : null}
      </div>
      <label className="field-label">
        {translate(locale, "provider.offerPrice")}
        <input
          className="app-input"
          inputMode="numeric"
          onChange={(event) => setPriceKzt(event.target.value.replace(/\D/g, ""))}
          value={priceKzt}
        />
      </label>
      <label className="field-label">
        {translate(locale, "provider.arrivalMinutes")}
        <input
          className="app-input"
          inputMode="numeric"
          onChange={(event) => setArrivalMinutes(event.target.value.replace(/\D/g, ""))}
          value={arrivalMinutes}
        />
      </label>
      <label className="field-label">
        {translate(locale, "provider.offerComment")}
        <textarea
          className="app-input app-textarea"
          onChange={(event) => setComment(event.target.value)}
          placeholder={translate(locale, "provider.offerCommentPlaceholder")}
          value={comment}
        />
      </label>
      {status ? (
        <p className="order-panel-status" role="status">
          {status}
        </p>
      ) : null}
      <Button disabled={!canSubmit || isSubmitting} onClick={() => void submitOffer()}>
        {translate(locale, isSubmitting ? "provider.submittingOffer" : "provider.submitOffer")}
      </Button>
    </section>
  );
}

function ProviderMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDistance(distanceMeters: number): string {
  return distanceMeters < 1000
    ? `${Math.round(distanceMeters)} м`
    : `${(distanceMeters / 1000).toFixed(1)} км`;
}

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `offer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
