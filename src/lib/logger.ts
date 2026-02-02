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
    const timestamp = new Date().toISOString();

    const consoleFn =
      level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    consoleFn(`[${level.toUpperCase()}] ${message}`, JSON.stringify(merged));

    if (posthogConfig?.apiKey && ctx) {
      ctx.waitUntil(
        fetch(`${posthogConfig.host}/capture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: posthogConfig.apiKey,
            event: "server_log",
            distinct_id: context.userId || "anonymous",
            properties: {
              level,
              message,
              ...merged,
              timestamp,
            },
          }),
        }).catch(() => {})
      );
    }
  }

  return {
    info: (msg, props) => log("info", msg, props),
    warn: (msg, props) => log("warn", msg, props),
    error: (msg, props) => log("error", msg, props),
  };
}
