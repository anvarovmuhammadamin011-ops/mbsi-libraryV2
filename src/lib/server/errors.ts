import { NextResponse } from "next/server";

// ─── Consistent API error/response format ──────────────────
// All API routes return:
//   success: false, error: { code, message }
//   success: true,  data
//   success: true,  data, pagination

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION_ERROR",
  INVALID_FILE: "INVALID_FILE",
  BOOK_LIMIT: "BOOK_LIMIT_REACHED",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL_ERROR",
} as const;

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function paginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
) {
  return NextResponse.json({ success: true, data, pagination });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return fail(err.code, err.message, err.status, err.details);
  }
  if (err && typeof err === "object" && "code" in err) {
    const e = err as { code?: string; message?: string };
    if (e.code === "P2025") {
      return fail(ERROR_CODES.NOT_FOUND, "Ma'lumot topilmadi", 404);
    }
    if (e.code === "P2002") {
      return fail(ERROR_CODES.CONFLICT, "Dublikat ma'lumot", 409);
    }
  }
  console.error("[API_ERROR]", err);
  return fail(
    ERROR_CODES.INTERNAL,
    "Kutilmagan xatolik yuz berdi",
    500
  );
}
