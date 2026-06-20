import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@tezhelp/types";

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
}
