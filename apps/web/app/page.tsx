import { defaultLocale, resolveLocale, translate } from "@tezhelp/i18n";
import { Button, ResponsiveShell } from "@tezhelp/ui";

interface HomePageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const rawLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const locale = resolveLocale(rawLocale ?? defaultLocale);

  return (
    <ResponsiveShell
      status={translate(locale, "common.status.foundation")}
      title={translate(locale, "app.brand")}
    >
      <section
        className="grid flex-1 gap-4 md:grid-cols-2"
        aria-label={translate(locale, "app.brand")}
      >
        <article className="flex min-h-64 flex-col justify-between rounded-lg bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-brand-blue">
              {translate(locale, "web.nav.customer")}
            </p>
            <h2 className="mt-3 text-2xl font-bold">{translate(locale, "web.customer.title")}</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {translate(locale, "web.customer.subtitle")}
            </p>
          </div>
          <Button className="mt-6 w-full sm:w-fit">{translate(locale, "web.nav.customer")}</Button>
        </article>

        <article className="flex min-h-64 flex-col justify-between rounded-lg bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-brand-orange">
              {translate(locale, "web.nav.provider")}
            </p>
            <h2 className="mt-3 text-2xl font-bold">{translate(locale, "web.provider.title")}</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {translate(locale, "web.provider.subtitle")}
            </p>
          </div>
          <Button className="mt-6 w-full sm:w-fit" variant="secondary">
            {translate(locale, "web.nav.provider")}
          </Button>
        </article>
      </section>
    </ResponsiveShell>
  );
}
