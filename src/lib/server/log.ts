// ─── Structured JSON logging ────────────────────────────────
// Production logs are emitted as single-line JSON so they can be
// shipped to any log aggregator (Vercel Logs, Datadog, LWIM, etc.)
// without ad-hoc parsing of interleaved console output.

type Meta = Record<string, unknown>;

const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

function emit(level: Level, event: string, message: string, meta?: Meta) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    event,
    message,
    ...(meta ?? {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, message = "", meta?: Meta) =>
    emit("debug", event, message, meta),
  info: (event: string, message = "", meta?: Meta) =>
    emit("info", event, message, meta),
  warn: (event: string, message = "", meta?: Meta) =>
    emit("warn", event, message, meta),
  error: (event: string, message = "", meta?: Meta) =>
    emit("error", event, message, meta),
};

// ─── HTTP request logging helper ────────────────────────────
export function logRequest(
  event: string,
  method: string,
  pathname: string,
  status: number,
  durationMs: number,
  meta?: Meta
) {
  logger.info(event, `${method} ${pathname} -> ${status} (${durationMs}ms)`, {
    method,
    path: pathname,
    status,
    durationMs,
    ...(meta ?? {}),
  });
}