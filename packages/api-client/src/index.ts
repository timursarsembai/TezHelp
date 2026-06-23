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

export interface ApiRequestOptions {
  readonly correlationId?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export class ApiClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl =
      options.fetchImpl ?? ((input, init) => globalThis.fetch.call(globalThis, input, init));
  }

  async get<TData>(
    path: `/${string}`,
    requestOptions: ApiRequestOptions | string = {},
  ): Promise<TData> {
    const options = normalizeRequestOptions(requestOptions);
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      headers: {
        ...options.headers,
        "x-correlation-id": options.correlationId,
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
    requestOptions: ApiRequestOptions | string = {},
  ): Promise<TData> {
    return this.mutate<TData, TBody>("POST", path, body, requestOptions);
  }

  async patch<TData, TBody extends object>(
    path: `/${string}`,
    body: TBody,
    requestOptions: ApiRequestOptions | string = {},
  ): Promise<TData> {
    return this.mutate<TData, TBody>("PATCH", path, body, requestOptions);
  }

  private async mutate<TData, TBody extends object>(
    method: "PATCH" | "POST",
    path: `/${string}`,
    body: TBody,
    requestOptions: ApiRequestOptions | string,
  ): Promise<TData> {
    const options = normalizeRequestOptions(requestOptions);
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl), {
      body: JSON.stringify(body),
      headers: {
        ...options.headers,
        "content-type": "application/json",
        "x-correlation-id": options.correlationId,
      },
      method,
    });

    const payload = (await response.json()) as ApiErrorEnvelope | ApiSuccessEnvelope<TData>;

    if (!response.ok) {
      throw new ApiClientError(payload as ApiErrorEnvelope, response.status);
    }

    return (payload as ApiSuccessEnvelope<TData>).data;
  }
}

function normalizeRequestOptions(
  requestOptions: ApiRequestOptions | string,
): ApiRequestOptions & { readonly correlationId: string } {
  if (typeof requestOptions === "string") {
    return { correlationId: requestOptions };
  }

  return {
    ...requestOptions,
    correlationId: requestOptions.correlationId ?? createCorrelationId(),
  };
}

function createCorrelationId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
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
