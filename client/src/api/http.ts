const BASE = "";

export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token: string) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function request<T>(
  path: string,
  opts: { method?: Method; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = false } = opts;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {

    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}
