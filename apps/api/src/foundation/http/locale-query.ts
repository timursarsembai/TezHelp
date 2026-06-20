import type { Locale } from "@tezhelp/types";

export function resolveApiLocale(locale: string | undefined): Locale {
  if (locale === "ru" || locale === "kk" || locale === "en") {
    return locale;
  }

  return "ru";
}
