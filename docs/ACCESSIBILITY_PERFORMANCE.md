# Accessibility and Performance Baseline

This baseline applies to the current map-first customer web flow and admin
foundation shell. It is not a complete WCAG audit or production performance
program.

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

E2E smoke tests assert the sign-in landmarks, skip-link keyboard behavior,
labelled order controls, a stable mobile map viewport, and the admin shell
baseline.

## Performance Baseline

The initial unauthenticated route and admin shell must stay lightweight:

- no image, audio, or video resources on initial web/admin shell load
- conservative script, style, and total resource-count budgets in e2e tests
- no external analytics, monitoring, upload, or realtime resources on initial
  load
- MapLibre and tile resources load only after a local customer session opens the
  map workspace

The current resource budgets are intentionally broad because Next.js development
mode loads extra scripts. They are meant to catch obvious regressions, not to
replace production Lighthouse or real-user monitoring.

Public OpenStreetMap raster tiles are a low-volume development adapter, not a
production dependency or an accepted production performance baseline.

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
