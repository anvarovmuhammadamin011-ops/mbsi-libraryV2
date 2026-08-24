import { NextRequest, NextResponse } from "next/server";
import { handleError } from "./errors";

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function route(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      return handleError(e);
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
