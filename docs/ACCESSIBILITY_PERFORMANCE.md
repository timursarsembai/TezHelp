# Accessibility and Performance Baseline

This baseline applies to the current web and admin foundation shells. It is not
a complete WCAG audit or production performance program.

## Accessibility Baseline

Current requirements:

- one visible skip link to `#main-content`
- one `banner` landmark
- one `main` landmark
- visible keyboard focus for interactive controls
- status text exposed with `role="status"`
- form controls have labels
- user-facing shell text uses localization keys
- reduced-motion preference is respected by disabling transitions and animations

E2E smoke tests assert the shared shell landmarks, skip-link keyboard behavior,
status exposure, and reduced-motion media query availability for web and admin.

## Performance Baseline

Current foundation shells must stay lightweight:

- no image, audio, or video resources on initial web/admin shell load
- conservative script, style, and total resource-count budgets in e2e tests
- no external analytics, monitoring, map, tile, upload, or realtime resources in
  the foundation shell

The current resource budgets are intentionally broad because Next.js development
mode loads extra scripts. They are meant to catch obvious regressions, not to
replace production Lighthouse or real-user monitoring.

## Production Gaps

Before launch:

- run a full WCAG review on customer, provider, and admin workflows
- test keyboard and screen-reader flows for order creation, provider offers,
  moderation, chat, live location, wallet, and sanctions
- define production Lighthouse or Web Vitals budgets
- measure mobile network performance in Kazakhstan
- review map tile, routing, upload, realtime, and monitoring providers in the
  CSP and performance budgets
- expand frontend error monitoring into production alerting after Kazakhstan
  hosting/legal review for the chosen provider
