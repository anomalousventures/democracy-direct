import { parseHTML } from "linkedom";

if (typeof globalThis.DOMParser === "undefined") {
  const { DOMParser } = parseHTML("");
  globalThis.DOMParser = DOMParser.constructor as typeof globalThis.DOMParser;
}
