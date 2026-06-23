"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type {
  IdentityUserSummary,
  Locale,
  OfferSummary,
  ProviderOrderDiscoveryItem,
  WalletSummary,
} from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

import { AlmatyMap } from "../map/almaty-map";

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
  const [feedStatus, setFeedStatus] = useState<"loading" | "ready" | "error">("loading");
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
    <div className="map-app provider-map-app">
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
          aria-label={translate(locale, "identity.signOut")}
          className="map-profile-button"
          onClick={onSignOut}
          title={translate(locale, "identity.signOut")}
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
        <AlmatyMap
          onOrderSelect={setSelectedOrderId}
          onPointSelect={() => undefined}
          orderPoints={orderPoints}
          selectedPoint={null}
        />
        {selectedOrder ? (
          <ProviderOfferPanel
            item={selectedOrder}
            locale={locale}
            onClose={() => setSelectedOrderId(null)}
            onSubmitted={() => void loadProviderData()}
            userId={user.id}
          />
        ) : null}
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
        <span className="provider-mobile-count">{orders.length}</span>
        <button className="map-navigation-button" onClick={onSignOut} type="button">
          <span className="map-navigation-icon" aria-hidden="true">
            ○
          </span>
          <span>{translate(locale, "maps.profile")}</span>
        </button>
      </nav>
    </div>
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
