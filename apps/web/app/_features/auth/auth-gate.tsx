"use client";

import { useEffect, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { MapWorkspace } from "../map/map-workspace";
import { PhoneSignInForm } from "./phone-sign-in-form";

export function AuthGate({ locale }: { readonly locale: Locale }) {
  const [session, setSession] = useState<IdentityUserSummary | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createBrowserApiClient()
      .get<IdentityUserSummary>("/backend/v1/me")
      .then((user) => {
        if (!cancelled) setSession(user);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) {
    return <div className="min-h-dvh bg-app-background" aria-busy="true" />;
  }

  if (!session) {
    return (
      <PhoneSignInForm
        locale={locale}
        onAuthenticated={(user) => {
          setSession(user);
        }}
      />
    );
  }

  return (
    <MapWorkspace
      initialLocale={locale}
      initialUser={session}
      onSessionChange={(user) => {
        setSession(user);
      }}
      onSignOut={() => {
        void createBrowserApiClient().post("/backend/v1/auth/logout", {});
        setSession(null);
      }}
    />
  );
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
