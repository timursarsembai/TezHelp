"use client";

import { useEffect } from "react";

import { ApiClient, FrontendErrorReporter } from "@tezhelp/api-client";
import { defaultLocale, translate } from "@tezhelp/i18n";
import { Button, ResponsiveShell } from "@tezhelp/ui";

const reporter = new FrontendErrorReporter({
  apiClient: new ApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  }),
  source: "admin",
});

export default function AdminRootError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    void reporter.report({
      error,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
    });
  }, [error]);

  return (
    <ResponsiveShell
      skipLabel={translate(defaultLocale, "common.skipToContent")}
      status={translate(defaultLocale, "monitoring.reported")}
      title={translate(defaultLocale, "admin.title")}
    >
      <section className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-brand-danger">
            {translate(defaultLocale, "monitoring.reported")}
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {translate(defaultLocale, "monitoring.errorTitle")}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {translate(defaultLocale, "monitoring.errorBody")}
          </p>
          <Button className="mt-6 w-full sm:w-fit" onClick={reset} type="button">
            {translate(defaultLocale, "monitoring.retry")}
          </Button>
        </div>
      </section>
    </ResponsiveShell>
  );
}
