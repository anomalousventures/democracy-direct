export interface ShareParams {
  url: string;
  title: string;
  description?: string;
}

export interface TemplateShareParams extends ShareParams {
  pageType: "template";
}

export interface RepShareParams extends ShareParams {
  pageType: "rep";
  repName: string;
  repParty: string;
  repState: string;
}

export type TypedShareParams = TemplateShareParams | RepShareParams;

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

export function generateTypedShareUrls(params: TypedShareParams): ShareUrls {
  const { url } = params;

  if (params.pageType === "template") {
    return {
      twitter: generateTwitterUrl(
        url,
        `📝 Found this letter template for contacting Congress: "${params.title}" #CivicEngagement #ContactCongress`
      ),
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`I found this template to help contact Congress about "${params.title}". Make your voice heard!`)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Letter template: ${params.title}`)}`,
      email: generateEmailUrl(
        `Letter template for contacting Congress: ${params.title}`,
        `I thought you might find this useful - it's a letter template for contacting your representatives in Congress.\n\nTemplate: "${params.title}"\n\nYou can customize it and send it directly to your senators and representative.`,
        url
      ),
    };
  }

  const { repName, repParty, repState } = params;
  return {
    twitter: generateTwitterUrl(
      url,
      `📣 Contact ${repName} (${repParty}-${repState}) about issues that matter to you. Make your voice heard! #ContactCongress`
    ),
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`Here's how to contact ${repName} (${repParty}-${repState}) about the issues you care about.`)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Contact info for ${repName} (${repParty}-${repState})`)}`,
    email: generateEmailUrl(
      `How to contact ${repName} (${repParty}-${repState})`,
      `I wanted to share this page with contact information for ${repName} (${repParty}-${repState}).\n\nYou can find their phone numbers, office addresses, and social media profiles, plus letter templates to help you communicate effectively.`,
      url
    ),
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
