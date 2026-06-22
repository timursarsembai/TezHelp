import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  FrontendErrorReport,
  FrontendMonitoringSource,
  MonitoringReportResponse,
} from "@tezhelp/types";

export class ApiClientError extends Error {
  constructor(
    public readonly envelope: ApiErrorEnvelope,
    public readonly status: number,
  ) {
    super(envelope.error.code);
  }
}

export interface ApiClientOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: typeof fetch;
}

export class ApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async get<TData>(path: `/${string}`, correlationId = crypto.randomUUID()): Promise<TData> {
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    const payload = (await response.json()) as ApiErrorEnvelope | ApiSuccessEnvelope<TData>;

    if (!response.ok) {
      throw new ApiClientError(payload as ApiErrorEnvelope, response.status);
    }

    return (payload as ApiSuccessEnvelope<TData>).data;
  }

  async post<TData, TBody extends object>(
    path: `/${string}`,
    body: TBody,
    correlationId = crypto.randomUUID(),
  ): Promise<TData> {
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      method: "POST",
    });

    const payload = (await response.json()) as ApiErrorEnvelope | ApiSuccessEnvelope<TData>;

    if (!response.ok) {
      throw new ApiClientError(payload as ApiErrorEnvelope, response.status);
    }

    return (payload as ApiSuccessEnvelope<TData>).data;
  }
}

export interface FrontendErrorReporterOptions {
  readonly apiClient: ApiClient;
  readonly source: FrontendMonitoringSource;
}

export class FrontendErrorReporter {
  constructor(private readonly options: FrontendErrorReporterOptions) {}

  async report(input: {
    readonly route: string;
    readonly error: Error & { readonly digest?: string };
    readonly componentStack?: string;
    readonly userAgent?: string;
    readonly occurredAt?: Date;
  }): Promise<MonitoringReportResponse | undefined> {
    const report: FrontendErrorReport = {
      source: this.options.source,
      severity: "error",
      route: sanitizeRoute(input.route),
      errorName: input.error.name || "Error",
      message: input.error.message || "Unhandled frontend error",
      occurredAt: (input.occurredAt ?? new Date()).toISOString(),
      ...(input.error.digest ? { digest: input.error.digest } : {}),
      ...(input.componentStack ? { componentStack: input.componentStack } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    };

    try {
      return await this.options.apiClient.post<MonitoringReportResponse, FrontendErrorReport>(
        "/v1/monitoring/frontend-errors",
        report,
      );
    } catch {
      return undefined;
    }
  }
}

export function sanitizeRoute(route: string): string {
  const path = route.split(/[?#]/, 1)[0]?.trim() || "/";
  return path.startsWith("/") ? path.slice(0, 200) : "/";
}
