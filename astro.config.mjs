// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://democracydirect.us",
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: [
        "node:crypto",
        "node:events",
        "node:util",
        "node:url",
        "node:net",
        "node:dns",
        "node:fs",
        "node:os",
        "node:child_process",
        "node:http",
        "node:https",
        "node:zlib",
        "node:stream",
        "node:path",
        "node:tls",
      ],
    },
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
