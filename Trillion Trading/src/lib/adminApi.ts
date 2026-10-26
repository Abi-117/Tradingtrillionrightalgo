
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://tradingtrillionrightalgo.onrender.com"
).replace(/\/+$/, "");

export async function adminApi<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data as T;
}
