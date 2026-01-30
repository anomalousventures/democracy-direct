export interface ShareParams {
  url: string;
  title: string;
  description?: string;
}

export interface ShareUrls {
  twitter: string;
  facebook: string;
  reddit: string;
  email: string;
}

export function generateShareUrls(params: ShareParams): ShareUrls {
  const { url, title, description } = params;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: generateTwitterUrl(url, title),
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: generateEmailUrl(title, description || title, url),
  };
}

export function generateTwitterUrl(url: string, text: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
}

export function generateEmailUrl(subject: string, body: string, url: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const fullBody = `${body}\n\n${url}`;
  const encodedBody = encodeURIComponent(fullBody);
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}

export function generateTemplateShareText(title: string): string {
  return `Check out this letter template for contacting Congress: "${title}"`;
}

export function generateRepShareText(name: string, party: string, state: string): string {
  return `Contact ${name} (${party}-${state}) about issues that matter to you:`;
}

export function supportsWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function triggerWebShare(params: ShareParams): Promise<boolean> {
  if (!supportsWebShare()) {
    return false;
  }

  try {
    await navigator.share({
      title: params.title,
      text: params.description,
      url: params.url,
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}
