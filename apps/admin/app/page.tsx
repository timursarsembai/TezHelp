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
        <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-sm" role="status">
          <p className="text-sm font-semibold text-brand-danger">
            {translate(locale, "admin.authRequired")}
          </p>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {translate(locale, "admin.authRequiredBody")}
          </p>
          <Button className="mt-6" disabled>
            {translate(locale, "admin.authRequired")}
          </Button>
        </div>
      </section>
    </ResponsiveShell>
  );
}
