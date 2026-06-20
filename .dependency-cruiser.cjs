/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies hide ownership and make module boundaries fragile.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-frontend-to-api",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: { path: "^apps/api/" },
    },
    {
      name: "no-api-to-frontend",
      severity: "error",
      from: { path: "^apps/api/" },
      to: { path: "^apps/(web|admin)/" },
    },
    {
      name: "no-shared-to-apps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "no-domain-to-infrastructure",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { path: "^infrastructure/" },
    },
    {
      name: "no-ui-to-backend-clients",
      severity: "error",
      from: { path: "^packages/ui/" },
      to: { path: "^(apps/api|packages/api-client|packages/maps)/" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "(^|/)(node_modules|dist|.next|.turbo|coverage)/",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.base.json",
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
  },
};
