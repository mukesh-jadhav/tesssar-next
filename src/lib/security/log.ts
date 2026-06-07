import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Structured request logger. Emits one JSON line per call, formatted so
 * Cloud Run's log collector promotes the fields into Cloud Logging:
 *   - `severity` → log severity
 *   - `logging.googleapis.com/trace` → auto-links to Cloud Trace
 *   - `requestId` → grep key across the request lifecycle
 *
 * Locally (NODE_ENV !== "production") we fall back to a human-readable
 * `console.*` line so logs stay readable during `next dev`.
 */

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.GCP_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  null;

type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface RequestLogger {
  reqId: string;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

/**
 * Build a per-request logger. Pulls the trace id from Cloud Run's
 * `x-cloud-trace-context` header (format: `TRACE_ID/SPAN_ID;o=...`).
 * Falls back to a fresh UUID when called outside Cloud Run (local dev,
 * tests).
 */
export function requestLogger(
  req: { headers: Headers },
  scope: string,
): RequestLogger {
  const trace = parseTraceContext(req.headers.get("x-cloud-trace-context"));
  const reqId = trace?.traceId ?? randomUUID();

  function emit(severity: Severity, msg: string, fields?: Record<string, unknown>) {
    const base: Record<string, unknown> = {
      severity,
      message: `[${scope}] ${msg}`,
      scope,
      requestId: reqId,
      ...fields,
    };
    if (trace && PROJECT_ID) {
      base["logging.googleapis.com/trace"] = `projects/${PROJECT_ID}/traces/${trace.traceId}`;
      if (trace.spanId) base["logging.googleapis.com/spanId"] = trace.spanId;
    }
    if (process.env.NODE_ENV !== "production") {
      const fn =
        severity === "ERROR" ? console.error
        : severity === "WARNING" ? console.warn
        : console.log;
      fn(`[${scope}] (${reqId.slice(0, 8)}) ${msg}`, fields ?? "");
      return;
    }
    // Cloud Run picks JSON off stdout/stderr.
    if (severity === "ERROR") process.stderr.write(JSON.stringify(base) + "\n");
    else process.stdout.write(JSON.stringify(base) + "\n");
  }

  return {
    reqId,
    info: (msg, fields) => emit("INFO", msg, fields),
    warn: (msg, fields) => emit("WARNING", msg, fields),
    error: (msg, fields) => emit("ERROR", msg, fields),
  };
}

function parseTraceContext(value: string | null): { traceId: string; spanId: string | null } | null {
  if (!value) return null;
  // `TRACE_ID/SPAN_ID;o=1`
  const [traceAndSpan] = value.split(";");
  const [traceId, spanId] = traceAndSpan.split("/");
  if (!traceId) return null;
  return { traceId, spanId: spanId || null };
}
