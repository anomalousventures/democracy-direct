const ALLOWED_DOMAINS = [".gov", ".senate.gov", ".house.gov"];

function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some((domain) => hostname.endsWith(domain));
}

export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      isAllowedDomain(parsed.hostname)
    ) {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}
