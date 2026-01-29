// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://democracy-direct.com",
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["nodemailer", "node:crypto"],
    },
    resolve: {
      alias: {
        // Fix React 19 MessageChannel error on Cloudflare Workers
        // https://github.com/withastro/astro/issues/12824
        "react-dom/server": "react-dom/server.edge",
        crypto: "node:crypto",
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
