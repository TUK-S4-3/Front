const BASE = "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function createTraceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function request<T>(
  path: string,
  opts: { method?: Method; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body } = opts;

  const headers: Record<string, string> = {};
  const traceId = createTraceId();
  headers["x-trace-id"] = traceId;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    const responseTraceId = res.headers.get("x-trace-id") ?? traceId;
    let code = "";
    let message = "";
    let raw = "";

    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        code = typeof record.code === "string" ? record.code : "";
        message = typeof record.message === "string" ? record.message : "";
        raw = message || JSON.stringify(data);
      }
    } else {
      raw = await res.text().catch(() => "");
    }

    const detail = [code, raw, `traceId=${responseTraceId}`].filter(Boolean).join(" ");
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? ` ${detail}` : ""}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {

    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}
