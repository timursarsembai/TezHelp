# Backend module template

Use this template when a future task introduces a real business module.

```text
module-name/
  domain/
    entities/
    value-objects/
    policies/
    events/
  application/
    commands/
    queries/
    use-cases/
    ports/
  infrastructure/
    persistence/
    external/
  presentation/
    http/
    websocket/
```

Small modules should not contain empty folders. Add a folder only when there is
real code with that responsibility.

Rules:

- Controllers parse transport input, call one use case, and map output.
- Use cases coordinate narrow ports and own transaction requirements.
- Domain code must not depend on NestJS, HTTP, database clients, or providers.
- Repositories persist and retrieve; they do not decide business policy.
- Cross-module calls use explicit ports or domain events.
- Transaction-sensitive behavior must keep the transaction boundary visible.
- Do not create `AppService`, `CommonService`, `MarketplaceService`, generic
  stores, or catch-all utilities.
