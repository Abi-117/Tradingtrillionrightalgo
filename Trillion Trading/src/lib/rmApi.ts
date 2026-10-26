
const API_BASE = import.meta.env.DEV
  ? (
      import.meta.env.VITE_API_URL ||
      "https://tradingtrillionrightalgo.onrender.com"
    ).replace(/\/+$/, "")
  : "";

export async function rmApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`,
    );
  }

  return result as T;
}
