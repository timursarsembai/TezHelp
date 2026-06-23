"use client";

import { useState } from "react";

import { ApiClient } from "@tezhelp/api-client";
import { translate } from "@tezhelp/i18n";
import type { IdentityUserSummary, Locale, OtpChallengeResponse } from "@tezhelp/types";
import { Button } from "@tezhelp/ui";

interface PhoneSignInFormProps {
  readonly locale: Locale;
  readonly onAuthenticated: (user: IdentityUserSummary) => void;
}

export function PhoneSignInForm({ locale, onAuthenticated }: PhoneSignInFormProps) {
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode() {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const result = await createBrowserApiClient().post<
        OtpChallengeResponse,
        { readonly phone: string; readonly purpose: "sign_in" }
      >("/backend/v1/auth/otp/request", { phone, purpose: "sign_in" });
      setChallenge(result);
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
      const user = await createBrowserApiClient().post<
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
    <div className="auth-screen">
      <a className="tz-skip-link" href="#main-content">
        {translate(locale, "common.skipToContent")}
      </a>
      <header className="auth-brand" role="banner">
        <span className="auth-brand-mark" aria-hidden="true">
          T
        </span>
        <strong>{translate(locale, "app.brand")}</strong>
      </header>
      <main className="auth-main" id="main-content" tabIndex={-1}>
        <section className="auth-panel" aria-labelledby="sign-in-title">
          <div className="auth-panel-heading">
            <span className="auth-eyebrow">{translate(locale, "maps.customerMode")}</span>
            <h1 id="sign-in-title">{translate(locale, "identity.phoneSignInTitle")}</h1>
            <p>{translate(locale, "identity.phoneSignInBody")}</p>
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <div className="auth-demo-note" role="note">
              {translate(locale, "identity.localDemoCode")}
            </div>
          ) : null}

          <label className="field-label" htmlFor="phone">
            {translate(locale, "identity.phone")}
            <input
              autoComplete="tel"
              className="app-input"
              id="phone"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder={translate(locale, "identity.phonePlaceholder")}
              value={phone}
            />
          </label>

          {challenge ? (
            <label className="field-label" htmlFor="otp">
              {translate(locale, "identity.otp")}
              <input
                autoComplete="one-time-code"
                className="app-input"
                id="otp"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder={translate(locale, "identity.otpPlaceholder")}
                value={code}
              />
            </label>
          ) : null}

          {status ? (
            <p className="auth-status" role="status">
              {status}
            </p>
          ) : null}

          {challenge ? (
            <Button
              className="w-full"
              disabled={code.length !== 6 || isSubmitting}
              onClick={() => void verifyCode()}
            >
              {translate(locale, "identity.verifyCode")}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={phone.length < 12 || isSubmitting}
              onClick={() => void requestCode()}
            >
              {translate(locale, "identity.requestCode")}
            </Button>
          )}
        </section>
      </main>
    </div>
  );
}

function createBrowserApiClient(): ApiClient {
  return new ApiClient({ baseUrl: window.location.origin });
}
