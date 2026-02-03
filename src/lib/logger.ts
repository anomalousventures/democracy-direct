import type { PosthogConfig } from "./config";

interface LogContext {
  path?: string;
  method?: string;
  userId?: string;
}

export interface Logger {
  info(message: string, properties?: Record<string, unknown>): void;
  warn(message: string, properties?: Record<string, unknown>): void;
  error(message: string, properties?: Record<string, unknown>): void;
}

const SEVERITY_MAP = {
  info: { number: 9, text: "INFO" },
  warn: { number: 13, text: "WARN" },
  error: { number: 17, text: "ERROR" },
} as const;

function toOtlpAttribute(
  key: string,
  value: unknown
): { key: string; value: Record<string, unknown> } {
  if (typeof value === "string") {
    return { key, value: { stringValue: value } };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { key, value: { intValue: String(value) } }
      : { key, value: { doubleValue: value } };
  }
  if (typeof value === "boolean") {
    return { key, value: { boolValue: value } };
  }
  return { key, value: { stringValue: JSON.stringify(value) } };
}

function buildOtlpPayload(
  level: "info" | "warn" | "error",
  message: string,
  properties: Record<string, unknown>
) {
  const nowNano = `${Date.now()}000000`;
  const severity = SEVERITY_MAP[level];

  const attributes = Object.entries(properties)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => toOtlpAttribute(k, v));

  return {
    resourceLogs: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: "democracy-direct" } }],
        },
        scopeLogs: [
          {
            scope: { name: "democracy-direct.server" },
            logRecords: [
              {
                timeUnixNano: nowNano,
                observedTimeUnixNano: nowNano,
                severityNumber: severity.number,
                severityText: severity.text,
                body: { stringValue: message },
                attributes,
              },
            ],
          },
        ],
      },
    ],
  };
}

function getPosthogConfig(locals: App.Locals): PosthogConfig | null {
  const apiKey = locals.runtime?.env?.POSTHOG_API_KEY as string | undefined;
  if (!apiKey) return null;

  const host =
    (locals.runtime?.env?.POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";
  return { apiKey, host };
}

export function createLogger(locals: App.Locals, request?: Request): Logger {
  const ctx = locals.runtime?.ctx;
  const posthogConfig = getPosthogConfig(locals);

  const context: LogContext = {
    path: request ? new URL(request.url).pathname : undefined,
    method: request?.method,
    userId: locals.user?.id,
  };

  function log(
    level: "info" | "warn" | "error",
    message: string,
    properties?: Record<string, unknown>
  ) {
    const merged = { ...context, ...properties };

    const consoleFn =
      level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    consoleFn(`[${level.toUpperCase()}] ${message}`, JSON.stringify(merged));

    if (posthogConfig?.apiKey && ctx) {
      const payload = buildOtlpPayload(level, message, merged);
      ctx.waitUntil(
        fetch(`${posthogConfig.host}/i/v1/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${posthogConfig.apiKey}`,
          },
          body: JSON.stringify(payload),
        }).catch((error) => console.error("PostHog log send failed:", error))
      );
    }
  }

  return {
    info: (msg, props) => log("info", msg, props),
    warn: (msg, props) => log("warn", msg, props),
    error: (msg, props) => log("error", msg, props),
  };
}
