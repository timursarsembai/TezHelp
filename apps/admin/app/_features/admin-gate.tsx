"use client";

import { useEffect, useState } from "react";

import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { AdminModerationWorkspace } from "./admin-moderation-workspace";
import { AdminPhoneSignIn } from "./admin-phone-sign-in";

const adminSessionKey = "tezhelp.local-admin-session";

export function AdminGate({ locale }: { readonly locale: Locale }) {
  const [admin, setAdmin] = useState<IdentityUserSummary | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAdmin(readAdminSession());
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div className="admin-loading-screen" aria-busy="true" />;
  }

  if (!admin) {
    return (
      <AdminPhoneSignIn
        locale={locale}
        onAuthenticated={(user) => {
          window.sessionStorage.setItem(adminSessionKey, JSON.stringify(user));
          setAdmin(user);
        }}
      />
    );
  }

  return (
    <AdminModerationWorkspace
      admin={admin}
      locale={locale}
      onSignOut={() => {
        window.sessionStorage.removeItem(adminSessionKey);
        setAdmin(null);
      }}
    />
  );
}

function readAdminSession(): IdentityUserSummary | null {
  const serialized = window.sessionStorage.getItem(adminSessionKey);
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
    window.sessionStorage.removeItem(adminSessionKey);
  }

  return null;
}
