import type { Env } from "../env.d";

type EnvKey = keyof Env;

export function getEnv<K extends EnvKey>(locals: App.Locals, key: K): Env[K] | undefined {
  // In Cloudflare, env vars are on locals.runtime.env
  // In dev, they're on import.meta.env
  const runtimeValue = locals.runtime?.env?.[key];
  if (runtimeValue !== undefined) {
    return runtimeValue;
  }

  // Fallback to import.meta.env for local development
  return import.meta.env[key] as Env[K] | undefined;
}

export function getRequiredEnv<K extends EnvKey>(locals: App.Locals, key: K): Env[K] {
  const value = getEnv(locals, key);
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv<K extends EnvKey>(locals: App.Locals, key: K): Env[K] | undefined {
  return getEnv(locals, key);
}
