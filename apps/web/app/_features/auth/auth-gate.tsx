"use client";

import { useEffect, useState } from "react";

import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { MapWorkspace } from "../map/map-workspace";
import { PhoneSignInForm } from "./phone-sign-in-form";

const localSessionKey = "tezhelp.local-session";

export function AuthGate({ locale }: { readonly locale: Locale }) {
  const [session, setSession] = useState<IdentityUserSummary | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(readLocalSession());
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div className="min-h-dvh bg-app-background" aria-busy="true" />;
  }

  if (!session) {
    return (
      <PhoneSignInForm
        locale={locale}
        onAuthenticated={(user) => {
          window.sessionStorage.setItem(localSessionKey, JSON.stringify(user));
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
        window.sessionStorage.setItem(localSessionKey, JSON.stringify(user));
        setSession(user);
      }}
      onSignOut={() => {
        window.sessionStorage.removeItem(localSessionKey);
        setSession(null);
      }}
    />
  );
}

function readLocalSession(): IdentityUserSummary | null {
  const serialized = window.sessionStorage.getItem(localSessionKey);
  if (!serialized) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(serialized);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "string" &&
      "status" in value &&
      value.status === "active"
    ) {
      return value as IdentityUserSummary;
    }
  } catch {
    window.sessionStorage.removeItem(localSessionKey);
  }

  return null;
}
