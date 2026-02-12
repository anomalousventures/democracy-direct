// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://democracy-direct.com",
  output: "server",
  integrations: [preact({ compat: true })],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["nodemailer", "node:crypto"],
    },
    resolve: {
      alias: {
        events: "node:events",
        util: "node:util",
        url: "node:url",
        net: "node:net",
        dns: "node:dns",
        fs: "node:fs",
        os: "node:os",
        child_process: "node:child_process",
        http: "node:http",
        https: "node:https",
        zlib: "node:zlib",
        stream: "node:stream",
        path: "node:path",
        tls: "node:tls",
      },
    },
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "compile",
  }),
});
