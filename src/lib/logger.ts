/**
 * Sanitized logger for the web client.
 *
 * Goal: keep noisy debugging output (especially `console.error` argument
 * dumps that can include user data, JWTs, request bodies, etc.) out of
 * production builds, while still letting operators see *that* something
 * went wrong.
 *
 * Behaviour
 * ---------
 * - In development (`import.meta.env.DEV`): full pass-through to the
 *   console — same DX you'd expect.
 * - In production: only a redacted summary is logged. Argument values are
 *   replaced with their type/shape so message strings cannot leak fields
 *   like emails, tokens, or request payloads. Errors keep their `name`
 *   and `message` but never their `stack`.
 *
 * This module is a *replacement* for direct `console.error` / `console.warn`
 * calls in app code paths that touch user data. Existing call sites can
 * migrate incrementally.
 */

const IS_DEV = typeof import.meta !== "undefined" && (import.meta as any).env?.DEV === true;

type LogLevel = "log" | "info" | "warn" | "error";

const SENSITIVE_KEY = /(token|password|secret|authorization|apikey|api_key|cookie|session|email|phone)/i;

function redactValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 2) return "[truncated]";

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (typeof value === "string") {
    return value.length > 64 ? `[string(${value.length})]` : "[string]";
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return `[${typeof value}]`;
  }
  if (typeof value === "function") return "[function]";
  if (typeof value === "symbol") return "[symbol]";

  if (Array.isArray(value)) {
    return `[array(${value.length})]`;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (count >= 8) {
        out["…"] = "[truncated]";
        break;
      }
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redactValue(v, depth + 1);
      count++;
    }
    return out;
  }

  return "[unknown]";
}

function emit(level: LogLevel, message: string, args: unknown[]) {
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    (console[level] as (...a: unknown[]) => void)(message, ...args);
    return;
  }

  // Production: emit only the message string + redacted argument shapes.
  const sanitized = args.map((a) => redactValue(a));
  // eslint-disable-next-line no-console
  (console[level] as (...a: unknown[]) => void)(`[align] ${message}`, ...sanitized);
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (!IS_DEV) return; // never emit debug in prod
    emit("log", message, args);
  },
  info(message: string, ...args: unknown[]) {
    emit("info", message, args);
  },
  warn(message: string, ...args: unknown[]) {
    emit("warn", message, args);
  },
  error(message: string, ...args: unknown[]) {
    emit("error", message, args);
  },
};

/**
 * Install a global `window.onerror` / `unhandledrejection` handler that
 * emits sanitized summaries in production. Idempotent.
 */
let installed = false;
export function installGlobalErrorMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    logger.error("window.onerror", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logger.error("unhandledrejection", reason instanceof Error
      ? { name: reason.name, message: reason.message }
      : { reason });
  });

  // In production, neutralise stray console.error calls so that whatever
  // legacy code paths remain cannot dump raw payloads to the devtools.
  if (!IS_DEV) {
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const first = typeof args[0] === "string" ? args[0] : "console.error";
      original(`[align] ${first}`, ...args.slice(1).map((a) => redactValue(a)));
    };
  }
}
