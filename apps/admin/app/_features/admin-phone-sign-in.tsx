"use client";

import { useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type { IdentityUserSummary, Locale, OtpChallengeResponse } from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

export function AdminPhoneSignIn({
  locale,
  onAuthenticated,
}: {
  readonly locale: Locale;
  readonly onAuthenticated: (user: IdentityUserSummary) => void;
}) {
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode() {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const nextChallenge = await createApiClient().post<
        OtpChallengeResponse,
        { readonly phone: string; readonly purpose: "sign_in" }
      >("/backend/v1/auth/otp/request", { phone, purpose: "sign_in" });
      setChallenge(nextChallenge);
      setStatus(translate(locale, "identity.codeSent"));
    } catch {
      setStatus(translate(locale, "identity.authError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!challenge) {
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    try {
      const user = await createApiClient().post<
        IdentityUserSummary,
        { readonly challengeId: string; readonly code: string; readonly preferredLocale: Locale }
      >("/backend/v1/auth/otp/verify", {
        challengeId: challenge.challengeId,
        code,
        preferredLocale: locale,
      });
      onAuthenticated(user);
    } catch {
      setStatus(translate(locale, "identity.authError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-auth-screen">
      <a className="tz-skip-link" href="#main-content">
        {translate(locale, "common.skipToContent")}
      </a>
      <header className="admin-auth-brand" role="banner">
        <span aria-hidden="true">T</span>
        <strong>{translate(locale, "admin.title")}</strong>
      </header>
      <main className="admin-auth-main" id="main-content" tabIndex={-1}>
        <section className="admin-auth-panel" aria-labelledby="admin-sign-in-title">
          <span>{translate(locale, "admin.developmentAccess")}</span>
          <h1 id="admin-sign-in-title">{translate(locale, "admin.authRequired")}</h1>
          <p>{translate(locale, "admin.developmentAccessBody")}</p>
          <div className="admin-development-note" role="note">
            {translate(locale, "identity.localDemoCode")}
          </div>
          <label className="admin-field">
            {translate(locale, "identity.phone")}
            <input
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              value={phone}
            />
          </label>
          {challenge ? (
            <label className="admin-field">
              {translate(locale, "identity.otp")}
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                value={code}
              />
            </label>
          ) : null}
          {status ? (
            <p className="admin-auth-status" role="status">
              {status}
            </p>
          ) : null}
          <Button
            disabled={(challenge ? code.length !== 6 : phone.length < 12) || isSubmitting}
            onClick={() => void (challenge ? verifyCode() : requestCode())}
          >
            {translate(locale, challenge ? "identity.verifyCode" : "identity.requestCode")}
          </Button>
        </section>
      </main>
    </div>
  );
}

function createApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
