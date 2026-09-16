import { NextRequest, NextResponse } from "next/server";
import { handleError } from "./errors";
import { logRequest } from "./log";

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function route(handler: Handler): Handler {
  return async (req, ctx) => {
    const started = performance.now();
    const pathname = req.nextUrl?.pathname ?? "";
    try {
      const res = await handler(req, ctx);
      logRequest(
        "http.request",
        req.method,
        pathname,
        res.status,
        Math.round(performance.now() - started)
      );
      return res;
    } catch (e) {
      const res = handleError(e);
      logRequest(
        "http.request",
        req.method,
        pathname,
        res.status,
        Math.round(performance.now() - started),
        { error: true }
      );
      return res;
    }
  };
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function readJson<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}