
import { site } from "@/config/site";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = import.meta.env.DEV
  ? (
      import.meta.env.VITE_API_BASE_URL ||
      site.apiBaseUrl ||
      "http://localhost:5000"
    ).replace(/\/+$/, "")
  : "";

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const csrf = typeof document !== "undefined"
    ? document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("csrf_token="))
        ?.slice("csrf_token=".length)
    : undefined;

  if (
    csrf &&
    options.method &&
    options.method.toUpperCase() !== "GET"
  ) {
    headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
      {
        ...options,
        headers,
        credentials: "include",
      },
    );
  } catch {
    throw new ApiError(
      "Unable to connect to the service. Please try again.",
    );
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError("Request failed.", response.status);
    }
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      body?.message || `Request failed (${response.status})`,
      response.status,
    );
  }

  return body as T;
}

export function post<T = unknown>(
  path: string,
  data: unknown,
): Promise<T> {
  return api<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const siteSettingsService = {
  get: () => api<Record<string, unknown>>("/api/site-settings"),
};
