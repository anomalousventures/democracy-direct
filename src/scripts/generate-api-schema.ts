import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const API_DIR = join(import.meta.dirname, "../pages/api");
const STATIC_ENDPOINTS = ["/data/zip-districts.json"];

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function filePathToRoute(filePath: string): string {
  const rel = relative(API_DIR, filePath)
    .replace(/\.ts$/, "")
    .replace(/\/index$/, "");
  const openApiPath = rel.replace(/\[([^\]]+)\]/g, "{$1}");
  return `/api/${openApiPath}`;
}

function extractMethods(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  return HTTP_METHODS.filter(
    (m) =>
      content.includes(`export const ${m}`) ||
      content.includes(`export async function ${m}`) ||
      content.includes(`export function ${m}`)
  );
}

function extractPathParams(route: string) {
  const params: { name: string; in: "path"; required: true; schema: { type: "string" } }[] = [];
  const matches = route.matchAll(/\{(\w+)\}/g);
  for (const match of matches) {
    params.push({ name: match[1], in: "path", required: true, schema: { type: "string" } });
  }
  return params;
}

type PathItem = Record<
  string,
  { summary: string; parameters?: ReturnType<typeof extractPathParams> }
>;
const paths: Record<string, PathItem> = {};

for (const file of collectFiles(API_DIR)) {
  const route = filePathToRoute(file);
  const methods = extractMethods(file);
  if (methods.length === 0) continue;

  const params = extractPathParams(route);
  paths[route] = {};
  for (const method of methods) {
    paths[route][method.toLowerCase()] = {
      summary: route,
      ...(params.length > 0 && { parameters: params }),
    };
  }
}

for (const endpoint of STATIC_ENDPOINTS) {
  paths[endpoint] = { get: { summary: endpoint } };
}

const schema = {
  openapi: "3.0.3",
  info: {
    title: "Democracy Direct API",
    version: "1.0.0",
  },
  servers: [{ url: "https://democracy-direct.com" }],
  paths,
};

const output = process.argv[2] || "api-schema.json";
writeFileSync(output, JSON.stringify(schema, null, 2) + "\n");
const routeCount = Object.keys(paths).length;
const methodCount = Object.values(paths).reduce(
  (sum, methods) => sum + Object.keys(methods).length,
  0
);
console.log(`Wrote ${routeCount} routes (${methodCount} operations) to ${output}`);
