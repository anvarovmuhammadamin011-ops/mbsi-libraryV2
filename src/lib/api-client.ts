"use client";

export class ApiClientError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
    this.name = "ApiClientError";
  }
}

type ApiResult<T> = { success: boolean; data: T; error?: { code: string; message: string } };

// CSRF double-submit: cookie o'qilib, mutation so'rovlariga header qo'shiladi.
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)mbsi_csrf=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

async function request<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(
    method.toUpperCase()
  );
  const csrf = isMutation ? getCsrfToken() : "";
  const headers: Record<string, string> = isForm
    ? {}
    : { "Content-Type": "application/json" };
  if (isMutation && csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch(url, {
    method,
    headers,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });
  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    json = null;
  }
  if (!res.ok || !json || !json.success) {
    const message = json?.error?.message ?? "Xatolik yuz berdi";
    const code = json?.error?.code;
    if (res.status === 401) {
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    throw new ApiClientError(message, code);
  }
  return json.data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, "GET"),
  post: <T>(url: string, body?: unknown) => request<T>(url, "POST", body),
  put: <T>(url: string, body?: unknown) => request<T>(url, "PUT", body),
  patch: <T>(url: string, body?: unknown) => request<T>(url, "PATCH", body),
  del: <T>(url: string) => request<T>(url, "DELETE"),
  delete: <T>(url: string) => request<T>(url, "DELETE"),
};
