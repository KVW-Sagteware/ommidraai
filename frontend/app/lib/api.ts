/**
 * Thin wrapper around `fetch` for the JSON API exposed through the
 * `/api/backend` rewrite. It keeps every call site free of the repeated
 * "parse body -> check status -> extract `detail`" boilerplate.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;

  constructor(message: string, status: number, detail: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface ApiJsonOptions {
  method?: string;
  body?: unknown;
}

/**
 * Performs a request and returns the parsed JSON body.
 *
 * Throws an {@link ApiError} when the response is not ok. The error message is
 * the backend's `detail` field when present, otherwise `fallbackMessage`.
 */
export async function apiJson<T>(
  path: string,
  { method = "GET", body }: ApiJsonOptions = {},
  fallbackMessage = "Request failed"
): Promise<T> {
  const init: RequestInit = { method };

  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);
  const text = await response.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const detail =
      data !== null && typeof data === "object" &&
      "detail" in data && typeof (data as { detail?: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : null;

    throw new ApiError(
      detail ?? `${fallbackMessage} (status ${response.status})`,
      response.status,
      detail
    );
  }

  return data as T;
}
