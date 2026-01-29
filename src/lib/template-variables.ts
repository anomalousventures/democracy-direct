import { type Representative, getRepresentativeTitle } from "@/types/representative";

export type { Representative };
export { getRepresentativeTitle };

export interface TemplateAddress {
  name?: string;
  city?: string;
}

export interface TemplateContext {
  repTitle?: string;
  repName?: string;
  repFirst?: string;
  repLast?: string;
  repParty?: string;
  state?: string;
  district?: string;
  userName?: string;
  userCity?: string;
}

const SUPPORTED_VARIABLES = [
  "REP_TITLE",
  "REP_NAME",
  "REP_FIRST",
  "REP_LAST",
  "REP_PARTY",
  "STATE",
  "DISTRICT",
  "USER_NAME",
  "USER_CITY",
  "TODAY_DATE",
] as const;

export type TemplateVariable = (typeof SUPPORTED_VARIABLES)[number];

export function getTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function substituteTemplateVariables(content: string, context: TemplateContext): string {
  const variables: Record<string, string> = {
    REP_TITLE: context.repTitle ?? "{{REP_TITLE}}",
    REP_NAME: context.repName ?? "{{REP_NAME}}",
    REP_FIRST: context.repFirst ?? "{{REP_FIRST}}",
    REP_LAST: context.repLast ?? "{{REP_LAST}}",
    REP_PARTY: context.repParty ?? "{{REP_PARTY}}",
    STATE: context.state ?? "{{STATE}}",
    DISTRICT: context.district ?? "{{DISTRICT}}",
    USER_NAME: context.userName ?? "{{USER_NAME}}",
    USER_CITY: context.userCity ?? "{{USER_CITY}}",
    TODAY_DATE: getTodayDate(),
  };

  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] ?? match;
  });
}

export function parseTemplateVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVars = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  return uniqueVars;
}

export function getSupportedVariables(): readonly string[] {
  return SUPPORTED_VARIABLES;
}

export function isKnownVariable(varName: string): boolean {
  return SUPPORTED_VARIABLES.includes(varName as TemplateVariable);
}

export function createTemplateContext(
  rep: Representative,
  address?: TemplateAddress
): TemplateContext {
  return {
    repTitle: getRepresentativeTitle(rep),
    repName: `${rep.first_name} ${rep.last_name}`,
    repFirst: rep.first_name,
    repLast: rep.last_name,
    repParty: rep.party,
    state: rep.state,
    district: rep.district ?? "At-Large",
    userName: address?.name,
    userCity: address?.city,
  };
}

export function substituteForRepresentative(
  content: string,
  rep: Representative,
  address?: TemplateAddress
): string {
  return substituteTemplateVariables(content, createTemplateContext(rep, address));
}
