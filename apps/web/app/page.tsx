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

      <section className="mt-4 rounded-lg bg-white p-5 shadow-sm" aria-labelledby="identity-title">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-blue">
            {translate(locale, "identity.google")}
          </p>
          <h2 className="mt-2 text-2xl font-bold" id="identity-title">
            {translate(locale, "identity.title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {translate(locale, "identity.subtitle")}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <IdentityField
            label={translate(locale, "identity.phone")}
            placeholder={translate(locale, "identity.phonePlaceholder")}
          />
          <IdentityField
            label={translate(locale, "identity.otp")}
            placeholder={translate(locale, "identity.otpPlaceholder")}
          />
          <IdentitySelect
            label={translate(locale, "identity.role")}
            options={[
              translate(locale, "identity.roleCustomer"),
              translate(locale, "identity.roleProvider"),
            ]}
          />
          <IdentitySelect
            label={translate(locale, "identity.locale")}
            options={["ru", "kk", "en"]}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-fit">{translate(locale, "identity.submit")}</Button>
          <Button className="w-full sm:w-fit" variant="secondary">
            {translate(locale, "identity.completePhone")}
          </Button>
        </div>
      </section>

      <section
        className="mt-4 rounded-lg bg-white p-5 shadow-sm"
        aria-labelledby="provider-moderation-title"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-orange">
            {translate(locale, "web.nav.provider")}
          </p>
          <h2 className="mt-2 text-2xl font-bold" id="provider-moderation-title">
            {translate(locale, "providerModeration.title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {translate(locale, "providerModeration.subtitle")}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            translate(locale, "providerModeration.generalProfile"),
            translate(locale, "providerModeration.categorySelection"),
            translate(locale, "providerModeration.documents"),
            translate(locale, "providerModeration.perCategoryStatus"),
          ].map((item, index) => (
            <div className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 p-4" key={item}>
              <p className="text-xs font-semibold text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-950">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {translate(locale, "providerModeration.rejectionReason")}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {translate(locale, "providerModeration.perCategoryStatus")}
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {translate(locale, "providerModeration.documents")}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {translate(locale, "providerModeration.resubmit")}
            </p>
          </div>
        </div>
      </section>

      <section
        className="mt-4 rounded-lg bg-white p-5 shadow-sm"
        aria-labelledby="marketplace-title"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-blue">
            {translate(locale, "marketplace.order.title")}
          </p>
          <h2 className="mt-2 text-2xl font-bold" id="marketplace-title">
            {translate(locale, "marketplace.order.publish")}
          </h2>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-3 sm:grid-cols-2">
            <MarketplaceField label={translate(locale, "marketplace.order.title")} value="Алматы" />
            <MarketplaceField
              label={translate(locale, "marketplace.provider.discovery")}
              value="5 км"
            />
            <MarketplaceField
              label={translate(locale, "marketplace.provider.offer")}
              value="12 000 KZT"
            />
            <MarketplaceField label={translate(locale, "marketplace.provider.wallet")} value="5" />
            <MarketplaceField
              label={translate(locale, "marketplace.lifecycle.departed")}
              value={translate(locale, "marketplace.lifecycle.contactVisible")}
            />
            <MarketplaceField
              label={translate(locale, "marketplace.lifecycle.completed")}
              value="10%"
            />
            <MarketplaceField
              label={translate(locale, "chat.title")}
              value={translate(locale, "chat.disputeEvidence")}
            />
            <MarketplaceField
              label={translate(locale, "maps.liveTracking")}
              value={translate(locale, "maps.staleState")}
            />
            <MarketplaceField
              label={translate(locale, "reputation.review")}
              value={translate(locale, "reputation.providerRating")}
            />
            <MarketplaceField
              label={translate(locale, "reputation.customerReliability")}
              value={translate(locale, "marketplace.provider.discovery")}
            />
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {translate(locale, "marketplace.provider.wallet")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">KZT</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">3 000</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">free</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">5</p>
              </div>
            </div>
            <p className="mt-4 rounded-md border border-blue-100 bg-white p-3 text-sm font-semibold leading-6 text-slate-700">
              {translate(locale, "chat.attachmentAccess")}
            </p>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              <span>{translate(locale, "maps.customerMarker")}</span>
              <span>{translate(locale, "maps.providerMarker")}</span>
              <span>{translate(locale, "reputation.customerReliability")}</span>
            </div>
          </aside>
        </div>
      </section>
    </ResponsiveShell>
  );
}

function IdentityField({
  label,
  placeholder,
}: {
  readonly label: string;
  readonly placeholder: string;
}) {
  const id = `identity-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor={id}>
      {label}
      <input
        className="min-h-11 rounded-md border border-slate-300 px-3 text-base font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
        id={id}
        inputMode="tel"
        placeholder={placeholder}
      />
    </label>
  );
}

function IdentitySelect({
  label,
  options,
}: {
  readonly label: string;
  readonly options: ReadonlyArray<string>;
}) {
  const id = `identity-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor={id}>
      {label}
      <select
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
        id={id}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MarketplaceField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-h-24 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
