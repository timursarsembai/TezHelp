import { translate } from "@tezhelp/i18n";
import { Button, ResponsiveShell } from "@tezhelp/ui";

export default function AdminHomePage() {
  const locale = "ru";

  return (
    <ResponsiveShell
      status={translate(locale, "common.status.foundation")}
      title={translate(locale, "admin.title")}
    >
      <section className="flex flex-1 items-center justify-center">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-lg bg-white p-5 shadow-sm" aria-labelledby="moderation-title">
            <p className="text-sm font-semibold text-brand-blue">
              {translate(locale, "admin.moderation.queue")}
            </p>
            <h2 className="mt-2 text-2xl font-bold" id="moderation-title">
              {translate(locale, "admin.moderation.title")}
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                translate(locale, "admin.moderation.filters"),
                translate(locale, "admin.moderation.overdue"),
                translate(locale, "admin.moderation.audit"),
              ].map((label) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={label}>
                  <p className="text-sm font-semibold text-slate-950">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                {translate(locale, "admin.moderation.review")}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button disabled>{translate(locale, "admin.moderation.approve")}</Button>
                <Button disabled variant="secondary">
                  {translate(locale, "admin.moderation.reject")}
                </Button>
                <Button disabled variant="danger">
                  {translate(locale, "admin.moderation.suspend")}
                </Button>
              </div>
            </div>
          </section>

          <aside className="rounded-lg bg-white p-5 shadow-sm" role="status">
            <p className="text-sm font-semibold text-brand-danger">
              {translate(locale, "admin.authRequired")}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {translate(locale, "admin.authRequiredBody")}
            </p>
            <Button className="mt-6 w-full" disabled>
              {translate(locale, "admin.authRequired")}
            </Button>
          </aside>
        </div>
      </section>
    </ResponsiveShell>
  );
}
