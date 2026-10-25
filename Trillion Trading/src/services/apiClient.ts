import { site } from "@/config/site";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!site.apiBaseUrl)
    throw new ApiError(
      "This service is not connected yet. Please contact the business for assistance.",
    );
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  // The external backend issues a readable CSRF cookie and an HTTP-only session cookie.
  const csrf =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("csrf_token="))
          ?.slice(11)
      : undefined;
  if (csrf && options.method && options.method !== "GET")
    headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  let response: Response;
  try {
    response = await fetch(`${site.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Unable to connect. Please try again later or contact the business.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.message ?? "Your request could not be completed. Please try again.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const post = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data) });
export const siteSettingsService = {
  get: () => api<Record<string, unknown>>("/api/site-settings"),
};
