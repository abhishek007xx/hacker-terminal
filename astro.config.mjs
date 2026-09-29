// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/* ------------------------------------------------------------------
   SITE URL — <-- EDIT THIS to your real domain before deploying
   e.g. 'https://spectre-9.pages.dev' or 'https://yourdomain.com'
   Used for: canonical link, Open Graph, sitemap, robots, JSON-LD.
   ------------------------------------------------------------------ */
const SITE = process.env.SITE_URL || 'https://hacker-terminal-4mk.pages.dev';

export default defineConfig({
    site: SITE,
    output: 'static',
    trailingSlash: 'ignore',
    integrations: [sitemap()],
    build: {
        // Keep stylesheet output small; Astro inlines tiny ones automatically.
        inlineStylesheets: 'always',
        assets: '_astro',
    },
    compressHTML: true,
    server: { host: true, port: 4321 },
    vite: {
        build: {
            assetsInlineLimit: 0,
        },
    },
});
