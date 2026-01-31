import { useCallback } from "react";

interface PostHogInstance {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

function getPostHog(): PostHogInstance | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!("posthog" in window)) {
    return null;
  }
  const posthog = window.posthog;
  if (
    typeof posthog === "object" &&
    posthog !== null &&
    "capture" in posthog &&
    typeof posthog.capture === "function"
  ) {
    return posthog as PostHogInstance;
  }
  return null;
}

export function useAnalytics() {
  const capture = useCallback((event: string, properties?: Record<string, unknown>) => {
    const posthog = getPostHog();
    if (posthog) {
      posthog.capture(event, properties);
    }
  }, []);

  const identify = useCallback((distinctId: string, properties?: Record<string, unknown>) => {
    const posthog = getPostHog();
    if (posthog) {
      posthog.identify(distinctId, properties);
    }
  }, []);

  const reset = useCallback(() => {
    const posthog = getPostHog();
    if (posthog) {
      posthog.reset();
    }
  }, []);

  return {
    capture,
    identify,
    reset,
  };
}
