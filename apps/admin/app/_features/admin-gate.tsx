"use client";

import { useEffect, useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import type { IdentityUserSummary, Locale } from "@tezhelp/types";

import { AdminModerationWorkspace } from "./admin-moderation-workspace";
import { AdminPhoneSignIn } from "./admin-phone-sign-in";

export function AdminGate({ locale }: { readonly locale: Locale }) {
  const [admin, setAdmin] = useState<IdentityUserSummary | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createAdminApiClient()
      .get<IdentityUserSummary>("/backend/v1/admin/me")
      .then((user) => {
        if (!cancelled) setAdmin(user);
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
    return <div className="admin-loading-screen" aria-busy="true" />;
  }

  if (!admin) {
    return (
      <AdminPhoneSignIn
        locale={locale}
        onAuthenticated={(user) => {
          setAdmin(user);
        }}
      />
    );
  }

  return (
    <AdminModerationWorkspace
      locale={locale}
      onSignOut={() => {
        void createAdminApiClient().post("/backend/v1/auth/logout", {});
        setAdmin(null);
      }}
    />
  );
}

function createAdminApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
