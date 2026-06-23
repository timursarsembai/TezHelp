import { defaultLocale, resolveLocale } from "@tezhelp/i18n";

import { AuthGate } from "./_features/auth/auth-gate";

interface HomePageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const rawLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = resolveLocale(rawLocale ?? defaultLocale);

  return <AuthGate locale={locale} />;
}
